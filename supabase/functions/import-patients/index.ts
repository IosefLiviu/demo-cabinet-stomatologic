import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PatientRow {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  address?: string;
  date_of_birth?: string;
  gender?: "M" | "F" | "other";
  cnp?: string;
  notes?: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr === "-") return null;
  
  // Handle format DD.MM.YYYY
  const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (match) {
    const [, day, month, year] = match;
    return `${year}-${month}-${day}`;
  }
  return null;
}

function parseGender(sex: string): "M" | "F" | "other" | undefined {
  if (sex === "M") return "M";
  if (sex === "F") return "F";
  return undefined;
}

function parseName(fullName: string): { first_name: string; last_name: string } {
  if (!fullName || fullName.trim() === "") {
    return { first_name: "Necunoscut", last_name: "Necunoscut" };
  }
  
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: "" };
  }
  
  // First part is last name, rest is first name (Romanian convention)
  const lastName = parts[0];
  const firstName = parts.slice(1).join(" ");
  return { first_name: firstName || "Necunoscut", last_name: lastName };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the requesting user is authenticated and is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { csvContent } = await req.json();
    
    if (!csvContent) {
      return new Response(
        JSON.stringify({ error: "CSV content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lines = csvContent.split("\n").filter((line: string) => line.trim());
    
    // Skip first line (title) and second line (headers)
    const dataLines = lines.slice(2);
    
    const patients: PatientRow[] = [];
    const errors: string[] = [];
    let skipped = 0;

    for (let i = 0; i < dataLines.length; i++) {
      const line = dataLines[i];
      const columns = parseCSVLine(line);
      
      // Column mapping based on header:
      // 0: Pacient, 1: Mobil, 2: Telefon fix, 3: Email, 4: CC Email, 5: Adresa
      // 15: Data de nastere, 17: Sex, 24: Observatii, 26: CNP
      
      const fullName = columns[0] || "";
      const mobile = columns[1] || "";
      const fixedPhone = columns[2] || "";
      const email = columns[3] || "";
      const address = columns[5] || "";
      const dateOfBirth = columns[15] || "";
      const sex = columns[17] || "";
      const notes = columns[24] || "";
      const cnp = columns[26] || "";
      
      // Skip rows without name
      if (!fullName.trim()) {
        skipped++;
        continue;
      }
      
      const phone = mobile || fixedPhone;
      if (!phone) {
        skipped++;
        continue;
      }
      
      const { first_name, last_name } = parseName(fullName);
      
      const patient: PatientRow = {
        first_name,
        last_name,
        phone,
        email: email || undefined,
        address: address || undefined,
        date_of_birth: parseDate(dateOfBirth) || undefined,
        gender: parseGender(sex),
        cnp: cnp || undefined,
        notes: notes || undefined,
      };
      
      patients.push(patient);
    }

    // Insert patients in batches
    const batchSize = 100;
    let inserted = 0;
    let duplicates = 0;

    for (let i = 0; i < patients.length; i += batchSize) {
      const batch = patients.slice(i, i + batchSize);
      
      for (const patient of batch) {
        // Check if patient with same phone already exists
        const { data: existing } = await supabase
          .from("patients")
          .select("id")
          .eq("phone", patient.phone)
          .maybeSingle();
        
        if (existing) {
          duplicates++;
          continue;
        }
        
        const { error } = await supabase
          .from("patients")
          .insert(patient);
        
        if (error) {
          errors.push(`Error inserting ${patient.first_name} ${patient.last_name}: ${error.message}`);
        } else {
          inserted++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        total: dataLines.length,
        inserted,
        duplicates,
        skipped,
        errors: errors.slice(0, 10), // Return first 10 errors
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
