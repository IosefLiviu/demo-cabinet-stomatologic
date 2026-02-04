import { supabase } from "@/integrations/supabase/client";

interface SendReminderParams {
  appointmentId: string;
  appointmentDate: string;
  startTime: string;
  patientId: string;
  patientPhone: string;
  patientName: string;
}

/**
 * Checks if appointment is for tomorrow and sends WhatsApp reminder if so.
 * Also marks the appointment as reminded to prevent duplicates from cron job.
 */
export async function sendAppointmentReminderIfTomorrow(params: SendReminderParams): Promise<boolean> {
  const { appointmentId, appointmentDate, startTime, patientId, patientPhone, patientName } = params;

  // Check if WhatsApp reminders are enabled
  const { data: settingData } = await supabase
    .from("app_settings")
    .select("setting_value")
    .eq("setting_key", "whatsapp_reminders_enabled")
    .single();

  if (settingData?.setting_value !== "true") {
    console.log("WhatsApp reminders are disabled, skipping");
    return false;
  }

  // Check if appointment is for tomorrow
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split("T")[0];

  if (appointmentDate !== tomorrowDate) {
    console.log(`Appointment is for ${appointmentDate}, not tomorrow (${tomorrowDate}). Skipping reminder.`);
    return false;
  }

  if (!patientPhone) {
    console.log("No phone number for patient, skipping reminder");
    return false;
  }

  // CRITICAL: Check if reminder was already sent (prevents duplicate from cron job)
  const { data: appointment } = await supabase
    .from("appointments")
    .select("reminder_sent_at")
    .eq("id", appointmentId)
    .single();

  if (appointment?.reminder_sent_at) {
    console.log(`Reminder already sent for appointment ${appointmentId} at ${appointment.reminder_sent_at}. Skipping.`);
    return false;
  }

  // Format date for Romanian locale
  const appointmentDateObj = new Date(appointmentDate);
  const formattedDate = appointmentDateObj.toLocaleDateString("ro-RO", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  // Format time (remove seconds if present)
  const formattedTime = startTime.substring(0, 5);

  try {
    // Send WhatsApp message via edge function using approved template
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: {
        to: patientPhone,
        patientId,
        patientName,
        templateType: "reminder",
        templateVariables: {
          date: formattedDate,
          time: formattedTime,
        },
      },
    });

    if (error) {
      console.error("Error sending WhatsApp reminder:", error);
      return false;
    }

    console.log("WhatsApp reminder sent successfully:", data);

    // Mark appointment as reminded to prevent duplicate from cron job
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq("id", appointmentId);

    if (updateError) {
      console.error("Error marking appointment as reminded:", updateError);
    }

    return true;
  } catch (error) {
    console.error("Failed to send appointment reminder:", error);
    return false;
  }
}
