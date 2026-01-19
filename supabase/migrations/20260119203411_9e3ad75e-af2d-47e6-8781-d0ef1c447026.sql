-- Create a table for custom tooth statuses with colors
CREATE TABLE public.tooth_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tooth_statuses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view tooth_statuses" 
ON public.tooth_statuses 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert tooth_statuses" 
ON public.tooth_statuses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update tooth_statuses" 
ON public.tooth_statuses 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete tooth_statuses" 
ON public.tooth_statuses 
FOR DELETE 
USING (true);

-- Insert default statuses based on the image
INSERT INTO public.tooth_statuses (name, color, sort_order) VALUES
  ('Sănătos', '#22C55E', 1),
  ('Carie', '#EF4444', 2),
  ('Plombat', '#F97316', 3),
  ('Coroană', '#EAB308', 4),
  ('Lipsă', '#6B7280', 5),
  ('Implant', '#3B82F6', 6),
  ('Canal', '#8B5CF6', 7),
  ('De extras', '#EC4899', 8);

-- Add trigger for updated_at
CREATE TRIGGER update_tooth_statuses_updated_at
BEFORE UPDATE ON public.tooth_statuses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();