-- Add laborator column to appointment_treatments table
ALTER TABLE public.appointment_treatments 
ADD COLUMN laborator numeric DEFAULT 0;