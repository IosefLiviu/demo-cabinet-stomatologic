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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if reminders are enabled
    const { data: setting, error: settingError } = await supabase
      .from("app_settings")
      .select("setting_value")
      .eq("setting_key", "whatsapp_reminders_enabled")
      .single();

    if (settingError || setting?.setting_value !== "true") {
      console.log("WhatsApp reminders are disabled");
      return new Response(
        JSON.stringify({ message: "Reminders are disabled", sent: 0 }),
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

    // Calculate tomorrow's date range (24h from now)
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    console.log(`Checking appointments for date: ${tomorrowDate}`);

    // Get appointments scheduled for tomorrow that haven't been reminded yet
    // Added filter: reminder_sent_at IS NULL to prevent duplicate messages
    const { data: appointments, error: appointmentsError } = await supabase
      .from("appointments")
      .select(`
        id,
        appointment_date,
        start_time,
        patient_id,
        patients (
          id,
          first_name,
          last_name,
          phone
        )
      `)
      .eq("appointment_date", tomorrowDate)
      .eq("status", "scheduled")
      .is("reminder_sent_at", null);

    if (appointmentsError) {
      console.error("Error fetching appointments:", appointmentsError);
      throw appointmentsError;
    }

    console.log(`Found ${appointments?.length || 0} appointments for tomorrow (without reminder yet)`);

    let sentCount = 0;
    const errors: string[] = [];

    for (const appointment of appointments || []) {
      const patient = appointment.patients as any;
      
      if (!patient?.phone) {
        console.log(`Skipping appointment ${appointment.id}: no phone number`);
        continue;
      }

      // Format date for Romanian locale
      const appointmentDate = new Date(appointment.appointment_date);
      const formattedDate = appointmentDate.toLocaleDateString("ro-RO", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });

      // Format time (remove seconds if present)
      const startTime = appointment.start_time.substring(0, 5);

      // Get custom message template or use default
      const { data: messageSetting } = await supabase
        .from("app_settings")
        .select("setting_value")
        .eq("setting_key", "whatsapp_reminder_message")
        .single();

      const defaultMessage = "Bună ziua, vă așteptăm mâine, {data}, la ora {ora}, la Perfect Smile Glim. Adresa: Strada București 68–70. Dacă nu puteți ajunge, vă rugăm să ne contactați pentru reprogramare.";
      const messageTemplate = messageSetting?.setting_value || defaultMessage;

      // Build the message by replacing placeholders
      const message = messageTemplate
        .replace("{data}", formattedDate)
        .replace("{ora}", startTime);

      // Format phone number for WhatsApp
      let formattedPhone = patient.phone.replace(/\D/g, "");
      if (!formattedPhone.startsWith("40")) {
        formattedPhone = "40" + formattedPhone;
      }
      const whatsappTo = `whatsapp:+${formattedPhone}`;
      const whatsappFrom = twilioWhatsAppNumber.startsWith("whatsapp:")
        ? twilioWhatsAppNumber
        : `whatsapp:${twilioWhatsAppNumber}`;

      console.log(`Sending reminder to ${patient.first_name} ${patient.last_name} at ${whatsappTo}`);

      try {
        // Send message via Twilio API
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
        const credentials = btoa(`${accountSid}:${authToken}`);

        const formData = new URLSearchParams();
        formData.append("To", whatsappTo);
        formData.append("From", whatsappFrom);
        formData.append("Body", message);

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
          console.error(`Twilio error for ${patient.phone}:`, twilioResult);
          errors.push(`${patient.first_name} ${patient.last_name}: ${twilioResult.message}`);
          continue;
        }

        console.log(`Message sent successfully: ${twilioResult.sid}`);

        // Store outbound message in database
        await supabase.from("whatsapp_messages").insert({
          patient_phone: whatsappTo,
          patient_name: `${patient.first_name} ${patient.last_name}`,
          message_body: message,
          message_sid: twilioResult.sid,
          direction: "outbound",
          status: "sent",
          patient_id: patient.id,
        });

        // Mark appointment as reminded to prevent duplicates
        const { error: updateError } = await supabase
          .from("appointments")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", appointment.id);

        if (updateError) {
          console.error(`Error marking appointment ${appointment.id} as reminded:`, updateError);
        }

        sentCount++;
      } catch (sendError: any) {
        console.error(`Error sending to ${patient.phone}:`, sendError);
        errors.push(`${patient.first_name} ${patient.last_name}: ${sendError.message}`);
      }
    }

    console.log(`Completed: sent ${sentCount} reminders, ${errors.length} errors`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: sentCount, 
        errors: errors.length > 0 ? errors : undefined,
        date: tomorrowDate
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-appointment-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
