-- Create patient_reminders table for callback scheduling
CREATE TABLE public.patient_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  note TEXT,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Enable RLS
ALTER TABLE public.patient_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view patient_reminders"
ON public.patient_reminders FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert patient_reminders"
ON public.patient_reminders FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update patient_reminders"
ON public.patient_reminders FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete patient_reminders"
ON public.patient_reminders FOR DELETE
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_patient_reminders_updated_at
BEFORE UPDATE ON public.patient_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();