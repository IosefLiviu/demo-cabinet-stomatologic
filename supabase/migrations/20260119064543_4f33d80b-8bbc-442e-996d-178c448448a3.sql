-- Create storage bucket for patient radiographs
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-radiographs', 
  'patient-radiographs', 
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/dicom', 'application/dicom']
);

-- RLS policies for patient radiographs bucket
CREATE POLICY "Authenticated users can upload radiographs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'patient-radiographs');

CREATE POLICY "Authenticated users can view radiographs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'patient-radiographs');

CREATE POLICY "Authenticated users can delete radiographs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'patient-radiographs');

CREATE POLICY "Authenticated users can update radiographs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'patient-radiographs');

-- Create table to track radiograph metadata
CREATE TABLE public.patient_radiographs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  radiograph_type TEXT, -- 'panoramic', 'periapical', 'bitewing', 'cbct', 'other'
  tooth_numbers INTEGER[],
  taken_at DATE,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.patient_radiographs ENABLE ROW LEVEL SECURITY;

-- RLS policies for radiographs metadata
CREATE POLICY "Authenticated users can view radiographs metadata"
ON public.patient_radiographs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert radiographs metadata"
ON public.patient_radiographs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update radiographs metadata"
ON public.patient_radiographs
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete radiographs metadata"
ON public.patient_radiographs
FOR DELETE
TO authenticated
USING (true);

-- Create index for faster queries
CREATE INDEX idx_patient_radiographs_patient_id ON public.patient_radiographs(patient_id);
CREATE INDEX idx_patient_radiographs_taken_at ON public.patient_radiographs(taken_at DESC);