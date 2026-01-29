-- Create doctor shifts table for daily schedules
CREATE TABLE public.doctor_shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  shift_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  cabinet_id integer REFERENCES public.cabinets(id),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(doctor_id, shift_date, start_time)
);

-- Create time off requests table (vacations, free periods)
CREATE TABLE public.doctor_time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  time_off_type text NOT NULL DEFAULT 'vacation', -- vacation, sick_leave, personal, other
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_time_off ENABLE ROW LEVEL SECURITY;

-- RLS Policies for doctor_shifts
CREATE POLICY "Authenticated users can view doctor_shifts"
  ON public.doctor_shifts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert doctor_shifts"
  ON public.doctor_shifts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update doctor_shifts"
  ON public.doctor_shifts FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete doctor_shifts"
  ON public.doctor_shifts FOR DELETE
  USING (true);

-- RLS Policies for doctor_time_off
CREATE POLICY "Authenticated users can view doctor_time_off"
  ON public.doctor_time_off FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert doctor_time_off"
  ON public.doctor_time_off FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can update doctor_time_off"
  ON public.doctor_time_off FOR UPDATE
  USING (true);

CREATE POLICY "Admins can delete doctor_time_off"
  ON public.doctor_time_off FOR DELETE
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at
CREATE TRIGGER update_doctor_shifts_updated_at
  BEFORE UPDATE ON public.doctor_shifts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_doctor_time_off_updated_at
  BEFORE UPDATE ON public.doctor_time_off
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();