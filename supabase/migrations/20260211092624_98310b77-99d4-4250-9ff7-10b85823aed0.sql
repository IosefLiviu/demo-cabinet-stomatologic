
-- Add recall_type and doctor_id to patient_reminders
ALTER TABLE public.patient_reminders
  ADD COLUMN recall_type text[] DEFAULT '{}',
  ADD COLUMN doctor_id uuid REFERENCES public.doctors(id);
