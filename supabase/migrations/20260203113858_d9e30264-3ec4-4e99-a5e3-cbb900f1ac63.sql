-- Add debt_paid_at column to track when a debt payment was made
-- This will be used to correctly attribute debt payments to the month they were paid
ALTER TABLE public.appointments ADD COLUMN debt_paid_at timestamp with time zone NULL;

-- Add a comment to explain the column's purpose
COMMENT ON COLUMN public.appointments.debt_paid_at IS 'Timestamp when a debt/remaining balance was paid. Used for monthly report attribution of debt payments.';