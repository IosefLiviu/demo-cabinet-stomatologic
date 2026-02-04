import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface SendWhatsAppRequest {
  to: string;
  message: string;
  patientId?: string;
  patientName?: string;
  // For template-based messages
  templateType?: "reminder" | "direct";
  templateVariables?: {
    date?: string;
    time?: string;
    name?: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
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

    const { to, message, patientId, patientName, templateType, templateVariables }: SendWhatsAppRequest = await req.json();

    if (!to) {
      return new Response(
        JSON.stringify({ error: "Missing 'to' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For template messages, validate required variables
    if (templateType === "reminder" && (!templateVariables?.date || !templateVariables?.time)) {
      return new Response(
        JSON.stringify({ error: "Missing template variables (date, time) for reminder" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    if (templateType === "direct" && !templateVariables?.name) {
      return new Response(
        JSON.stringify({ error: "Missing template variable (name) for direct message" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // For non-template messages (replies within 24h window), we need message body
    if (!templateType && !message) {
      return new Response(
        JSON.stringify({ error: "Missing 'message' field" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format phone number for WhatsApp
    let formattedTo = to.replace(/\D/g, "");
    
    // Remove leading 0 if present (common in Romanian local format like 0731825274)
    if (formattedTo.startsWith("0")) {
      formattedTo = formattedTo.substring(1);
    }
    
    // Add country code if not present
    if (!formattedTo.startsWith("40")) {
      formattedTo = "40" + formattedTo;
    }
    const whatsappTo = `whatsapp:+${formattedTo}`;
    const whatsappFrom = twilioWhatsAppNumber.startsWith("whatsapp:")
      ? twilioWhatsAppNumber
      : `whatsapp:${twilioWhatsAppNumber}`;

    console.log("Sending WhatsApp message:", { to: whatsappTo, from: whatsappFrom, templateType });

    // Send message via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = btoa(`${accountSid}:${authToken}`);

    // Status callback (delivery/failed updates)
    const statusCallbackUrl = `${supabaseUrl}/functions/v1/twilio-webhook?type=status`;

    const formData = new URLSearchParams();
    formData.append("To", whatsappTo);
    formData.append("From", whatsappFrom);
    formData.append("StatusCallback", statusCallbackUrl);

    // Template SIDs for approved WhatsApp templates
    const REMINDER_TEMPLATE_SID = "HX6cd6d3274cd89e4dfcacbe860aa546b3";
    const DIRECT_TEMPLATE_SID = "HXd7b671c57f63d19bd9957ee889e2a5bf";
    
    let messageBody = message || "";
    
    if (templateType === "reminder" && templateVariables) {
      // Use approved template for reminders
      // Variables: {{1}} = date, {{2}} = time
      formData.append("ContentSid", REMINDER_TEMPLATE_SID);
      formData.append("ContentVariables", JSON.stringify({
        "1": templateVariables.date,
        "2": templateVariables.time,
      }));
      // Store a readable version for our database
      messageBody = `Reminder: ${templateVariables.date} la ora ${templateVariables.time}`;
      console.log("Using reminder template:", { date: templateVariables.date, time: templateVariables.time });
    } else if (templateType === "direct" && templateVariables) {
      // Use approved template for direct messages
      // Variables: {{1}} = name
      formData.append("ContentSid", DIRECT_TEMPLATE_SID);
      formData.append("ContentVariables", JSON.stringify({
        "1": templateVariables.name,
      }));
      // Store a readable version for our database
      messageBody = `Mesaj direct către ${templateVariables.name}`;
      console.log("Using direct template:", { name: templateVariables.name });
    } else {
      // Reply within 24h window - use Body (free-form text allowed)
      formData.append("Body", message);
    }

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
      console.error("Twilio API error:", twilioResult);
      return new Response(
        JSON.stringify({ error: twilioResult.message || "Failed to send message" }),
        { status: twilioResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Twilio message created:", {
      sid: twilioResult.sid,
      status: twilioResult.status,
      to: twilioResult.to,
      from: twilioResult.from,
      errorCode: twilioResult.error_code,
      errorMessage: twilioResult.error_message,
    });

    // Store outbound message in database using service role
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { error: insertError } = await supabaseService
      .from("whatsapp_messages")
      .insert({
        patient_phone: whatsappTo,
        patient_name: patientName || null,
        message_body: messageBody,
        message_sid: twilioResult.sid,
        direction: "outbound",
        status: twilioResult.status || "sent",
        patient_id: patientId || null,
      });

    if (insertError) {
      console.error("Error storing outbound message:", insertError);
      // Don't fail the request, message was sent successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        messageSid: twilioResult.sid,
        status: twilioResult.status || null,
        errorCode: twilioResult.error_code || null,
        errorMessage: twilioResult.error_message || null,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-whatsapp function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
