-- Create prescriptions table
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  prescription_date DATE NOT NULL DEFAULT CURRENT_DATE,
  judet TEXT DEFAULT 'Ilfov',
  localitate TEXT DEFAULT 'Măgurele',
  unitate_sanitara TEXT DEFAULT 'Perfect Smile',
  nr_fisa TEXT,
  diagnostic TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescription_items table for medications
CREATE TABLE public.prescription_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prescription_id UUID NOT NULL REFERENCES public.prescriptions(id) ON DELETE CASCADE,
  medication TEXT NOT NULL,
  quantity TEXT,
  dosage TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for prescriptions
CREATE POLICY "Authenticated users can view prescriptions"
ON public.prescriptions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert prescriptions"
ON public.prescriptions FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update prescriptions"
ON public.prescriptions FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete prescriptions"
ON public.prescriptions FOR DELETE
TO authenticated
USING (true);

-- RLS policies for prescription_items
CREATE POLICY "Authenticated users can view prescription_items"
ON public.prescription_items FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert prescription_items"
ON public.prescription_items FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update prescription_items"
ON public.prescription_items FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete prescription_items"
ON public.prescription_items FOR DELETE
TO authenticated
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_prescriptions_updated_at
  BEFORE UPDATE ON public.prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();