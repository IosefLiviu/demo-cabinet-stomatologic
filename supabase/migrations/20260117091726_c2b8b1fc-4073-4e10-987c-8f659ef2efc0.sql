-- Add CAS column to treatments table
ALTER TABLE public.treatments ADD COLUMN IF NOT EXISTS cas numeric DEFAULT 0;

-- Optionally migrate existing data: combine decont + co_plata into cas
UPDATE public.treatments 
SET cas = COALESCE(decont, 0) + COALESCE(co_plata, 0)
WHERE cas IS NULL OR cas = 0;