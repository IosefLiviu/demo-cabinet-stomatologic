-- Create treatment_plans table
CREATE TABLE public.treatment_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  next_appointment_date DATE,
  next_appointment_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create treatment_plan_items table for individual treatments in a plan
CREATE TABLE public.treatment_plan_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  treatment_plan_id UUID NOT NULL REFERENCES public.treatment_plans(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES public.treatments(id) ON DELETE SET NULL,
  treatment_name TEXT NOT NULL,
  tooth_number INTEGER,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE SET NULL,
  quantity INTEGER DEFAULT 1,
  price NUMERIC DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plan_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for treatment_plans
CREATE POLICY "Authenticated users can view treatment_plans"
  ON public.treatment_plans FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert treatment_plans"
  ON public.treatment_plans FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update treatment_plans"
  ON public.treatment_plans FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete treatment_plans"
  ON public.treatment_plans FOR DELETE
  USING (true);

-- Create RLS policies for treatment_plan_items
CREATE POLICY "Authenticated users can view treatment_plan_items"
  ON public.treatment_plan_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert treatment_plan_items"
  ON public.treatment_plan_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update treatment_plan_items"
  ON public.treatment_plan_items FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete treatment_plan_items"
  ON public.treatment_plan_items FOR DELETE
  USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_treatment_plans_updated_at
  BEFORE UPDATE ON public.treatment_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();