-- Add tooth_data column to store tooth status and notes as JSONB
ALTER TABLE public.appointment_treatments 
ADD COLUMN tooth_data JSONB DEFAULT '[]'::jsonb;