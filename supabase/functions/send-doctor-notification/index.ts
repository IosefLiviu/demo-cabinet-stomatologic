import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface AppointmentNotificationRequest {
  doctorId: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  cabinetName: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      doctorId,
      patientName,
      appointmentDate,
      appointmentTime,
      cabinetName,
      notes,
    }: AppointmentNotificationRequest = await req.json();

    console.log("Received notification request for doctor:", doctorId);

    // Fetch doctor details including email and notification preference
    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("name, email, email_notifications_enabled")
      .eq("id", doctorId)
      .maybeSingle();

    if (doctorError) {
      console.error("Error fetching doctor:", doctorError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch doctor details" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!doctor) {
      console.log("Doctor not found:", doctorId);
      return new Response(
        JSON.stringify({ error: "Doctor not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if notifications are disabled for this doctor
    if (doctor.email_notifications_enabled === false) {
      console.log("Email notifications disabled for doctor:", doctorId);
      return new Response(
        JSON.stringify({ message: "Email notifications disabled for this doctor" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    if (!doctor.email) {
      console.log("Doctor has no email configured:", doctorId);
      return new Response(
        JSON.stringify({ message: "Doctor has no email configured, skipping notification" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Sending email to:", doctor.email);

    // Send email using Resend REST API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Perfect Smile <office@perfectsmileglim.ro>",
        to: [doctor.email],
        subject: `Programare nouă - ${patientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Programare nouă</h1>
            <p>Bună ziua, Dr. ${doctor.name}!</p>
            <p>Aveți o programare nouă:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Pacient:</strong> ${patientName}</p>
              <p><strong>Data:</strong> ${appointmentDate}</p>
              <p><strong>Ora:</strong> ${appointmentTime}</p>
              <p><strong>Cabinet:</strong> ${cabinetName}</p>
              ${notes ? `<p><strong>Note:</strong> ${notes}</p>` : ''}
            </div>
            
            <p>Cu stimă,<br>Echipa Perfect Smile</p>
          </div>
        `,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Failed to send email:", emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailResult }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-doctor-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
