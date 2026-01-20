-- Add new columns to treatment_plan_items for full intervention details
ALTER TABLE public.treatment_plan_items 
ADD COLUMN IF NOT EXISTS duration integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS laborator numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS cas numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;