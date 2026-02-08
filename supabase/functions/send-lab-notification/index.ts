import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LabNotificationRequest {
  doctorId: string;
  patientName: string;
  workType: string;
}

const LAB_RECEIVED_TEMPLATE_SID = "HX1abdb4c6d95e1dab5183c10b49b13b71";

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { doctorId, patientName, workType }: LabNotificationRequest = await req.json();

    if (!doctorId || !patientName || !workType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: doctorId, patientName, workType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Lab notification request:", { doctorId, patientName, workType });

    // Fetch doctor details using service role to get phone
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { data: doctor, error: doctorError } = await supabaseService
      .from("doctors")
      .select("name, phone")
      .eq("id", doctorId)
      .maybeSingle();

    if (doctorError) {
      console.error("Error fetching doctor:", doctorError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch doctor details" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!doctor) {
      console.log("Doctor not found:", doctorId);
      return new Response(
        JSON.stringify({ error: "Doctor not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!doctor.phone) {
      console.log("Doctor has no phone configured:", doctorId);
      return new Response(
        JSON.stringify({ message: "Doctor has no phone configured, skipping notification" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Twilio credentials
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioWhatsAppNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

    if (!accountSid || !authToken || !twilioWhatsAppNumber) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "Twilio credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number for WhatsApp
    let formattedPhone = (doctor.phone || "").replace(/\D/g, "");
    if (formattedPhone.startsWith("0")) {
      formattedPhone = formattedPhone.substring(1);
    }
    if (!formattedPhone.startsWith("40")) {
      formattedPhone = "40" + formattedPhone;
    }

    const whatsappTo = `whatsapp:+${formattedPhone}`;
    const whatsappFrom = twilioWhatsAppNumber.startsWith("whatsapp:")
      ? twilioWhatsAppNumber
      : `whatsapp:${twilioWhatsAppNumber}`;

    console.log(`Sending lab notification to Dr. ${doctor.name} at ${whatsappTo}`);

    // Send via Twilio using approved template
    // Template variables: {{1}} = patient name, {{2}} = work type, {{3}} = doctor name
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    const statusCallbackUrl = `${supabaseUrl}/functions/v1/twilio-webhook?type=status`;

    const formData = new URLSearchParams();
    formData.append("To", whatsappTo);
    formData.append("From", whatsappFrom);
    formData.append("ContentSid", LAB_RECEIVED_TEMPLATE_SID);
    formData.append("ContentVariables", JSON.stringify({
      "1": patientName,
      "2": workType,
      "3": doctor.name,
    }));
    formData.append("StatusCallback", statusCallbackUrl);

    console.log("Sending lab notification via template:", {
      to: whatsappTo,
      from: whatsappFrom,
      contentSid: LAB_RECEIVED_TEMPLATE_SID,
      patientName,
      workType,
      doctorName: doctor.name,
    });

    const twilioResponse = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    const twilioResult = await twilioResponse.json();

    if (!twilioResponse.ok) {
      console.error("Twilio error:", twilioResult);
      return new Response(
        JSON.stringify({ error: twilioResult.message || "Failed to send notification", details: twilioResult }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Lab notification sent successfully:", {
      sid: twilioResult.sid,
      status: twilioResult.status,
    });

    // Store outbound message in whatsapp_messages
    const messageBody = `Notificare laborator: Proba pentru ${patientName} (${workType}) a fost primită - Dr. ${doctor.name}`;
    await supabaseService.from("whatsapp_messages").insert({
      patient_phone: whatsappTo,
      patient_name: doctor.name,
      message_body: messageBody,
      message_sid: twilioResult.sid,
      direction: "outbound",
      status: twilioResult.status || "sent",
    });

    return new Response(
      JSON.stringify({ success: true, messageSid: twilioResult.sid }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-lab-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
