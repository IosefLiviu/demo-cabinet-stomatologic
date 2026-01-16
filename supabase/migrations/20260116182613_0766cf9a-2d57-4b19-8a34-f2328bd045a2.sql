-- Create enum for dental status per tooth
CREATE TYPE public.tooth_status AS ENUM (
  'healthy',
  'cavity',
  'filled',
  'crown',
  'missing',
  'implant',
  'root_canal',
  'extraction_needed'
);

-- Create patients table
CREATE TABLE public.patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('M', 'F', 'other')),
  address TEXT,
  city TEXT,
  cnp TEXT, -- Romanian personal ID
  allergies TEXT[], -- Array of allergies
  medical_conditions TEXT[], -- Chronic conditions, diseases
  medications TEXT[], -- Current medications
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create dental status table (per tooth per patient)
CREATE TABLE public.dental_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  tooth_number INTEGER NOT NULL CHECK (tooth_number >= 11 AND tooth_number <= 85), -- FDI notation
  status public.tooth_status NOT NULL DEFAULT 'healthy',
  notes TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (patient_id, tooth_number)
);

-- Create treatments/procedures catalog
CREATE TABLE public.treatments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_duration INTEGER NOT NULL DEFAULT 30, -- in minutes
  default_price DECIMAL(10,2),
  category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create appointments table (enhanced)
CREATE TABLE public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  cabinet_id INTEGER NOT NULL CHECK (cabinet_id >= 1 AND cabinet_id <= 5),
  treatment_id UUID REFERENCES public.treatments(id),
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  duration INTEGER NOT NULL DEFAULT 30, -- in minutes
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  price DECIMAL(10,2),
  is_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medical history/treatment records
CREATE TABLE public.treatment_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  treatment_id UUID REFERENCES public.treatments(id),
  treatment_name TEXT NOT NULL, -- Store name in case treatment is deleted
  tooth_numbers INTEGER[], -- Which teeth were treated
  description TEXT,
  diagnosis TEXT,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  price DECIMAL(10,2),
  cabinet_id INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patient documents/radiographs table
CREATE TABLE public.patient_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('radiograph', 'photo', 'consent', 'prescription', 'lab_result', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (for now allow all - will add auth later)
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dental_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- Create permissive policies for all operations (temporary - no auth yet)
CREATE POLICY "Allow all access to patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to dental_status" ON public.dental_status FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to treatments" ON public.treatments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to treatment_records" ON public.treatment_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to patient_documents" ON public.patient_documents FOR ALL USING (true) WITH CHECK (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for updated_at
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dental_status_updated_at
  BEFORE UPDATE ON public.dental_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default treatments
INSERT INTO public.treatments (name, description, default_duration, default_price, category) VALUES
  ('Consultație', 'Consultație de rutină și examinare', 30, 100, 'General'),
  ('Detartraj', 'Curățare profesională și detartraj', 45, 200, 'Igienă'),
  ('Obturație simplă', 'Plombare cavitate simplă', 30, 150, 'Restaurări'),
  ('Obturație complexă', 'Plombare cavitate complexă', 45, 250, 'Restaurări'),
  ('Extracție simplă', 'Extracție dinte simplu', 30, 200, 'Chirurgie'),
  ('Extracție complexă', 'Extracție dinte complex/molar de minte', 60, 400, 'Chirurgie'),
  ('Tratament de canal', 'Tratament endodontic', 90, 500, 'Endodonție'),
  ('Albire dentară', 'Albire profesională în cabinet', 60, 800, 'Estetică'),
  ('Coroană dentară', 'Coroană ceramică sau metalo-ceramică', 60, 1200, 'Protetică'),
  ('Implant dentar', 'Inserție implant dentar', 90, 2500, 'Implantologie'),
  ('Igienizare', 'Igienizare completă', 30, 150, 'Igienă'),
  ('Radiografie panoramică', 'Radiografie OPG', 15, 100, 'Diagnostic'),
  ('Radiografie retroalveolară', 'Radiografie periapicală', 10, 50, 'Diagnostic'),
  ('Control periodic', 'Control de rutină', 20, 0, 'General'),
  ('Sigilare', 'Sigilare șanțuri și fosete', 20, 100, 'Prevenție');