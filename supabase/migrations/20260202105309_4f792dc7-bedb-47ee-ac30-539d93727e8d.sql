-- Add reminder_sent_at column to track when WhatsApp reminder was sent
ALTER TABLE public.appointments 
ADD COLUMN reminder_sent_at timestamp with time zone DEFAULT NULL;

-- Add index for efficient querying of appointments needing reminders
CREATE INDEX idx_appointments_reminder_pending 
ON public.appointments (appointment_date, status) 
WHERE reminder_sent_at IS NULL;