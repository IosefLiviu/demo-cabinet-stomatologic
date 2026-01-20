-- Add tooth_numbers array column to treatment_plan_items
ALTER TABLE public.treatment_plan_items
ADD COLUMN tooth_numbers integer[] DEFAULT NULL;

-- Add discount_percent column to treatment_plans
ALTER TABLE public.treatment_plans
ADD COLUMN discount_percent numeric DEFAULT 0;

-- Migrate existing data: copy single tooth_number to tooth_numbers array
UPDATE public.treatment_plan_items
SET tooth_numbers = ARRAY[tooth_number]
WHERE tooth_number IS NOT NULL AND tooth_numbers IS NULL;