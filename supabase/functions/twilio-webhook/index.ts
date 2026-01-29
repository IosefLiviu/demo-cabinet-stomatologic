import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse the form data from Twilio webhook
    const formData = await req.formData();
    
    const from = formData.get("From")?.toString() || "";
    const body = formData.get("Body")?.toString() || "";
    const messageSid = formData.get("MessageSid")?.toString() || "";
    const profileName = formData.get("ProfileName")?.toString() || "";
    
    console.log("Received WhatsApp message:", { from, body, messageSid, profileName });

    // Clean phone number (remove whatsapp: prefix if present)
    const cleanPhone = from.replace("whatsapp:", "").replace(/\D/g, "");
    
    // Try to find matching patient by phone number
    const { data: patient } = await supabase
      .from("patients")
      .select("id, first_name, last_name, phone")
      .or(`phone.ilike.%${cleanPhone.slice(-9)}%,phone.ilike.%${cleanPhone.slice(-10)}%`)
      .maybeSingle();

    console.log("Found patient:", patient);

    // Store the message in database
    const { data: message, error: insertError } = await supabase
      .from("whatsapp_messages")
      .insert({
        patient_phone: from,
        patient_name: patient 
          ? `${patient.first_name} ${patient.last_name}` 
          : profileName || "Necunoscut",
        message_body: body,
        message_sid: messageSid,
        direction: "inbound",
        status: "unread",
        patient_id: patient?.id || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing message:", insertError);
      throw insertError;
    }

    console.log("Message stored successfully:", message);

    // Return TwiML response (empty response, we don't auto-reply)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { 
          "Content-Type": "application/xml",
          ...corsHeaders 
        },
      }
    );
  } catch (error: any) {
    console.error("Error in twilio-webhook function:", error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { 
          "Content-Type": "application/xml",
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
