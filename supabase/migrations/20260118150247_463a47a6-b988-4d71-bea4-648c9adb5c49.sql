
-- Create table for monthly expenses
CREATE TABLE public.monthly_expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month_year text NOT NULL,
  expense_name text NOT NULL,
  amount numeric DEFAULT 0,
  is_paid boolean DEFAULT false,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(month_year, expense_name)
);

-- Enable RLS
ALTER TABLE public.monthly_expenses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view monthly_expenses" 
ON public.monthly_expenses 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can insert monthly_expenses" 
ON public.monthly_expenses 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update monthly_expenses" 
ON public.monthly_expenses 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete monthly_expenses" 
ON public.monthly_expenses 
FOR DELETE 
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_monthly_expenses_updated_at
BEFORE UPDATE ON public.monthly_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
