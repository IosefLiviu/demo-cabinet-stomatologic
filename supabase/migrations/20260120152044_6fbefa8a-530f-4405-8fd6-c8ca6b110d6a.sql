-- Add discount_percent column to appointment_treatments
ALTER TABLE public.appointment_treatments
ADD COLUMN discount_percent numeric DEFAULT 0;