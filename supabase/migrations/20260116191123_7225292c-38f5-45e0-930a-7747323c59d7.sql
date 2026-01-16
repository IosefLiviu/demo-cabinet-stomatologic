-- Create cabinets table
CREATE TABLE public.cabinets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  doctor TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cabinets ENABLE ROW LEVEL SECURITY;

-- Create policy for all access
CREATE POLICY "Allow all access to cabinets" 
ON public.cabinets 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Insert default cabinets
INSERT INTO public.cabinets (id, name, doctor) VALUES
  (1, 'Cabinet 1', 'Dr. Maria Popescu'),
  (2, 'Cabinet 2', 'Dr. Andrei Ionescu'),
  (3, 'Cabinet 3', 'Dr. Elena Dumitrescu'),
  (4, 'Cabinet 4', 'Dr. Alexandru Popa'),
  (5, 'Cabinet 5', 'Dr. Cristina Moldovan');

-- Create trigger for updated_at
CREATE TRIGGER update_cabinets_updated_at
BEFORE UPDATE ON public.cabinets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();