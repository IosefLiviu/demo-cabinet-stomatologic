-- Create expense_entries table for sub-entries
CREATE TABLE public.expense_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id uuid NOT NULL REFERENCES public.monthly_expenses(id) ON DELETE CASCADE,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  is_paid boolean DEFAULT false,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expense_entries ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view expense_entries"
ON public.expense_entries
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert expense_entries"
ON public.expense_entries
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update expense_entries"
ON public.expense_entries
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete expense_entries"
ON public.expense_entries
FOR DELETE
TO authenticated
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_expense_entries_updated_at
BEFORE UPDATE ON public.expense_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();