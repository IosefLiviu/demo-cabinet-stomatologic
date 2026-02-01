-- Add new columns for the extended workflow
ALTER TABLE public.lab_samples 
  ADD COLUMN IF NOT EXISTS resend_reason text,
  ADD COLUMN IF NOT EXISTS resend_date date,
  ADD COLUMN IF NOT EXISTS trial_date date,
  ADD COLUMN IF NOT EXISTS finalized_date date;

-- Update status default to allow new statuses: sent, returned, trial, finalized, resent
COMMENT ON COLUMN public.lab_samples.status IS 'Statuses: sent, returned, trial, finalized, resent';