-- Add completion tracking fields to treatment_plan_items
ALTER TABLE treatment_plan_items 
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS paid_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS completed_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_treatment_plan_items_completed ON treatment_plan_items(completed_at) WHERE completed_at IS NOT NULL;