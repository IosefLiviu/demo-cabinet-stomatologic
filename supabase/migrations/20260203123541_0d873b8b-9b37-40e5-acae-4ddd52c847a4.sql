-- Add debt_amount column to track how much debt was paid (separate from original payment)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS debt_amount numeric DEFAULT NULL;

COMMENT ON COLUMN public.appointments.debt_amount IS 'The amount of debt that was paid at debt_paid_at timestamp, separate from original payment';