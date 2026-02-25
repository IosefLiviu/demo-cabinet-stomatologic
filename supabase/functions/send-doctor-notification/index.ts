import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

interface AppointmentNotificationRequest {
  doctorId: string;
  patientName: string;
  appointmentDate: string;
  appointmentTime: string;
  cabinetName: string;
  notes?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Email service not configured" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const {
      doctorId,
      patientName,
      appointmentDate,
      appointmentTime,
      cabinetName,
      notes,
    }: AppointmentNotificationRequest = await req.json();

    // Validate required fields
    if (!doctorId || !patientName || !appointmentDate || !appointmentTime || !cabinetName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Notification request by user ${user.id} for doctor: ${doctorId}`);

    const { data: doctor, error: doctorError } = await supabase
      .from("doctors")
      .select("name, email, email_notifications_enabled")
      .eq("id", doctorId)
      .maybeSingle();

    if (doctorError || !doctor) {
      return new Response(
        JSON.stringify({ error: "Doctor not found" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (doctor.email_notifications_enabled === false) {
      return new Response(
        JSON.stringify({ message: "Email notifications disabled for this doctor" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!doctor.email) {
      return new Response(
        JSON.stringify({ message: "Doctor has no email configured, skipping notification" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Sanitize all user-supplied data
    const safePatientName = escapeHtml(patientName);
    const safeAppointmentDate = escapeHtml(appointmentDate);
    const safeAppointmentTime = escapeHtml(appointmentTime);
    const safeCabinetName = escapeHtml(cabinetName);
    const safeNotes = notes ? escapeHtml(notes) : '';
    const safeDoctorName = escapeHtml(doctor.name);

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Perfect Smile <office@perfectsmileglim.ro>",
        to: [doctor.email],
        subject: `Programare nouă - ${safePatientName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #2563eb;">Programare nouă</h1>
            <p>Bună ziua, Dr. ${safeDoctorName}!</p>
            <p>Aveți o programare nouă:</p>
            
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Pacient:</strong> ${safePatientName}</p>
              <p><strong>Data:</strong> ${safeAppointmentDate}</p>
              <p><strong>Ora:</strong> ${safeAppointmentTime}</p>
              <p><strong>Cabinet:</strong> ${safeCabinetName}</p>
              ${safeNotes ? `<p><strong>Note:</strong> ${safeNotes}</p>` : ''}
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
        JSON.stringify({ error: "Failed to send email" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Email sent successfully to ${doctor.email} by user ${user.id}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-doctor-notification function:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

Deno.serve(handler);
