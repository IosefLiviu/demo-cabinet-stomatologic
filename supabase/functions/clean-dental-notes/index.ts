import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ─── Helpers to strip diagnostic JSON from notes ───────────────────────────

function extractBalancedJson(str: string, startIndex: number): string | null {
  if (str[startIndex] !== "[") return null;
  let depth = 0;
  for (let i = startIndex; i < str.length; i++) {
    if (str[i] === "[") depth++;
    else if (str[i] === "]") depth--;
    if (depth === 0) return str.slice(startIndex, i + 1);
  }
  return null;
}

function stripTaggedBalanced(
  input: string,
  tagStart: "[DIAGNOSTICS:" | "[DIAGLINES:"
): string {
  let result = input;
  const idx = result.indexOf(tagStart);
  if (idx === -1) return result;

  const jsonStart = idx + tagStart.length;
  const jsonContent = extractBalancedJson(result, jsonStart);
  if (!jsonContent) return result;

  return result.replace(`${tagStart}${jsonContent}]`, "");
}

function stripOrphanLeadingJsonArrays(input: string): string {
  let result = input;
  for (let i = 0; i < 50; i++) {
    const trimmed = result.trimStart();
    if (!trimmed.startsWith("[")) break;
    if (/[a-zA-ZăâîșțĂÂÎȘȚ]/.test(trimmed)) break;

    const leading = extractBalancedJson(trimmed, 0);
    if (!leading) break;

    result = trimmed
      .slice(leading.length)
      .replace(/^[\s,]+/, "")
      .trimStart();
  }
  return result;
}

function stripNumericNoisePrefix(original: string): string {
  const firstTagIdx = (() => {
    const a = original.indexOf("[DIAGNOSTICS:");
    const b = original.indexOf("[DIAGLINES:");
    if (a === -1) return b;
    if (b === -1) return a;
    return Math.min(a, b);
  })();

  if (firstTagIdx <= 0) return original;

  const prefix = original.slice(0, firstTagIdx);
  const floatMatches = prefix.match(/-?\d+\.\d+/g) ?? [];
  if (floatMatches.length < 6) return original;

  return original.slice(firstTagIdx);
}

function cleanDentalNotes(notes: string | null | undefined): string {
  if (!notes) return "";

  let result = notes;
  result = stripNumericNoisePrefix(result);
  result = stripTaggedBalanced(result, "[DIAGNOSTICS:");
  result = stripTaggedBalanced(result, "[DIAGLINES:");
  result = stripOrphanLeadingJsonArrays(result);

  return result.replace(/^\n+|\n+$/g, "").trim();
}

// ─── Main handler ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all dental_status rows with notes
    const { data: rows, error: fetchError } = await supabase
      .from("dental_status")
      .select("id, notes")
      .not("notes", "is", null);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updatedCount = 0;
    const updates: { id: string; notes: string | null }[] = [];

    for (const row of rows ?? []) {
      if (!row.notes) continue;

      const cleanedNotes = cleanDentalNotes(row.notes);

      // Only update if cleaning actually changed something
      if (cleanedNotes !== row.notes) {
        updates.push({
          id: row.id,
          notes: cleanedNotes || null,
        });
      }
    }

    // Batch update
    for (const upd of updates) {
      const { error: updateError } = await supabase
        .from("dental_status")
        .update({ notes: upd.notes })
        .eq("id", upd.id);

      if (updateError) {
        console.error(`Update error for ${upd.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }

    // Also clean dental_status_history notes
    const { data: historyRows, error: histFetchError } = await supabase
      .from("dental_status_history")
      .select("id, notes")
      .not("notes", "is", null);

    let historyUpdatedCount = 0;

    if (!histFetchError && historyRows) {
      for (const row of historyRows) {
        if (!row.notes) continue;
        const cleanedNotes = cleanDentalNotes(row.notes);
        if (cleanedNotes !== row.notes) {
          const { error: updateError } = await supabase
            .from("dental_status_history")
            .update({ notes: cleanedNotes || null })
            .eq("id", row.id);

          if (!updateError) {
            historyUpdatedCount++;
          }
        }
      }
    }

    console.log(
      `Cleaned ${updatedCount} dental_status rows and ${historyUpdatedCount} history rows`
    );

    return new Response(
      JSON.stringify({
        success: true,
        updatedDentalStatus: updatedCount,
        updatedHistory: historyUpdatedCount,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
