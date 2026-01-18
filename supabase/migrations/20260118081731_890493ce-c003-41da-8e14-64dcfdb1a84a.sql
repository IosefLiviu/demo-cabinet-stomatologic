-- Add paid_amount column to track actual amount paid (for partial payments)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS paid_amount numeric DEFAULT 0;

-- Add payment_method column to track how payment was made
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS payment_method text DEFAULT NULL;

-- Update existing completed appointments to have paid_amount = price where is_paid = true
UPDATE public.appointments 
SET paid_amount = COALESCE(price, 0)
WHERE status = 'completed' AND is_paid = true;

-- Add comment for clarity
COMMENT ON COLUMN public.appointments.paid_amount IS 'Amount actually paid by patient (can be less than price for partial payments)';
COMMENT ON COLUMN public.appointments.payment_method IS 'Payment method: card, cash, or partial_card, partial_cash';