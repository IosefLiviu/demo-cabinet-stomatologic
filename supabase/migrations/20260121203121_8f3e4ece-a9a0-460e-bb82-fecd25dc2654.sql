-- Add email column to doctors table
ALTER TABLE public.doctors ADD COLUMN IF NOT EXISTS email TEXT;