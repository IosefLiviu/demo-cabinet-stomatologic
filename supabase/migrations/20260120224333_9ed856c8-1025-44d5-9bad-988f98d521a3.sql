-- Add plan_item_id to appointment_treatments to link back to treatment plan items
ALTER TABLE appointment_treatments 
ADD COLUMN IF NOT EXISTS plan_item_id UUID REFERENCES treatment_plan_items(id) ON DELETE SET NULL;