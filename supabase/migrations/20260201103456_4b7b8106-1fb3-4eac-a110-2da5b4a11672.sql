-- Drop the old check constraint and add a new one with all valid statuses
ALTER TABLE public.lab_samples DROP CONSTRAINT IF EXISTS lab_samples_status_check;

ALTER TABLE public.lab_samples 
ADD CONSTRAINT lab_samples_status_check 
CHECK (status IN ('sent', 'returned', 'trial', 'finalized', 'resent'));