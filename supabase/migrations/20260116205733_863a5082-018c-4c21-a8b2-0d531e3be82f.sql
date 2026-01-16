-- Create table for storing multiple treatments per appointment
CREATE TABLE public.appointment_treatments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  treatment_id UUID REFERENCES public.treatments(id),
  treatment_name TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  decont NUMERIC DEFAULT 0,
  co_plata NUMERIC DEFAULT 0,
  duration INTEGER DEFAULT 30,
  tooth_numbers INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.appointment_treatments ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment_treatments (same access as appointments - public for now since no auth)
CREATE POLICY "Allow all operations on appointment_treatments"
ON public.appointment_treatments
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_appointment_treatments_appointment_id ON public.appointment_treatments(appointment_id);