-- Add registration number field to patients table
ALTER TABLE public.patients
ADD COLUMN registration_number text;