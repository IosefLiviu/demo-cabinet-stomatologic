-- Drop the old check constraint that doesn't include 'deleted' status
ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;

-- Add new check constraint that includes 'deleted' status for soft delete functionality
ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status = ANY (ARRAY['scheduled'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text, 'no_show'::text, 'deleted'::text]));