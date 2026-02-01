-- Add cabinet_id column to lab_samples for tracking which cabinet the trial happens in
ALTER TABLE public.lab_samples 
  ADD COLUMN IF NOT EXISTS cabinet_id integer REFERENCES public.cabinets(id);