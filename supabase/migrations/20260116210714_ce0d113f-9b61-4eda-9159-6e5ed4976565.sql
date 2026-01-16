-- Create doctors table with color codes
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  specialization TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;

-- Create policy for doctors
CREATE POLICY "Allow all access to doctors"
ON public.doctors
FOR ALL
USING (true)
WITH CHECK (true);

-- Add doctor_id column to appointments
ALTER TABLE public.appointments 
ADD COLUMN doctor_id UUID REFERENCES public.doctors(id);

-- Insert some default doctors with colors
INSERT INTO public.doctors (name, color, specialization) VALUES
('Dr. Popescu', '#3B82F6', 'Stomatologie generală'),
('Dr. Ionescu', '#10B981', 'Ortodonție'),
('Dr. Georgescu', '#F59E0B', 'Endodonție'),
('Dr. Marinescu', '#EF4444', 'Chirurgie orală'),
('Dr. Vasilescu', '#8B5CF6', 'Parodontologie');