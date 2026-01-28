-- Create patient families table
CREATE TABLE public.patient_families (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_name TEXT NOT NULL,
  primary_contact_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  primary_phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patient family members junction table
CREATE TABLE public.patient_family_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.patient_families(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  relationship TEXT, -- ex: 'Părinte', 'Copil', 'Soț/Soție', 'Bunic/Bunică'
  is_primary_contact BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(family_id, patient_id)
);

-- Enable RLS
ALTER TABLE public.patient_families ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_family_members ENABLE ROW LEVEL SECURITY;

-- RLS policies for patient_families
CREATE POLICY "Authenticated users can view patient_families"
ON public.patient_families FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert patient_families"
ON public.patient_families FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patient_families"
ON public.patient_families FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete patient_families"
ON public.patient_families FOR DELETE
USING (true);

-- RLS policies for patient_family_members
CREATE POLICY "Authenticated users can view patient_family_members"
ON public.patient_family_members FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert patient_family_members"
ON public.patient_family_members FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patient_family_members"
ON public.patient_family_members FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete patient_family_members"
ON public.patient_family_members FOR DELETE
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_patient_families_updated_at
BEFORE UPDATE ON public.patient_families
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_patient_family_members_family_id ON public.patient_family_members(family_id);
CREATE INDEX idx_patient_family_members_patient_id ON public.patient_family_members(patient_id);