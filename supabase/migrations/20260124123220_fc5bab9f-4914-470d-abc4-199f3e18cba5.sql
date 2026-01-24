-- Create table for dental status history
CREATE TABLE public.dental_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tooth_number INTEGER NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dental_status_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view dental_status_history"
ON public.dental_status_history
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert dental_status_history"
ON public.dental_status_history
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_dental_status_history_patient ON public.dental_status_history(patient_id);
CREATE INDEX idx_dental_status_history_tooth ON public.dental_status_history(patient_id, tooth_number);
CREATE INDEX idx_dental_status_history_date ON public.dental_status_history(changed_at DESC);