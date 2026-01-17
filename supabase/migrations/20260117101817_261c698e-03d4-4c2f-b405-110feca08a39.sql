-- Create a table to store monthly CAS budget settings
CREATE TABLE public.cas_budget (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_year text NOT NULL UNIQUE, -- Format: YYYY-MM
  initial_budget numeric NOT NULL DEFAULT 0,
  used_budget numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cas_budget ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can view cas_budget" 
ON public.cas_budget 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert cas_budget" 
ON public.cas_budget 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update cas_budget" 
ON public.cas_budget 
FOR UPDATE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_cas_budget_updated_at
BEFORE UPDATE ON public.cas_budget
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();