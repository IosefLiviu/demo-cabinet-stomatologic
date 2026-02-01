-- Create lab_samples table for tracking laboratory work
CREATE TABLE public.lab_samples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  patient_name TEXT NOT NULL,
  work_type TEXT NOT NULL,
  zone_quadrant TEXT,
  sample_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expected_return_date DATE,
  actual_return_date DATE,
  laboratory_name TEXT,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'returned')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lab_samples ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated users can view lab_samples"
ON public.lab_samples FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert lab_samples"
ON public.lab_samples FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update lab_samples"
ON public.lab_samples FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete lab_samples"
ON public.lab_samples FOR DELETE
USING (true);

-- Update trigger
CREATE TRIGGER update_lab_samples_updated_at
BEFORE UPDATE ON public.lab_samples
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();