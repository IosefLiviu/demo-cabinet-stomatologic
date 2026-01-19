-- Add cancellation_reason column to appointments table
ALTER TABLE public.appointments 
ADD COLUMN cancellation_reason text DEFAULT NULL;

-- Add cancelled_at timestamp
ALTER TABLE public.appointments 
ADD COLUMN cancelled_at timestamp with time zone DEFAULT NULL;