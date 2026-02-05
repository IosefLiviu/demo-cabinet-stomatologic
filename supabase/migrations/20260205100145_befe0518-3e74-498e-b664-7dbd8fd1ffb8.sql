-- Add serie_nr column to prescriptions table
ALTER TABLE public.prescriptions 
ADD COLUMN serie_nr text;

-- Create a sequence for prescription numbers starting at 902
CREATE SEQUENCE IF NOT EXISTS prescription_number_seq START WITH 902;

-- Create function to generate next prescription number
CREATE OR REPLACE FUNCTION public.generate_prescription_serie_nr()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_num integer;
BEGIN
  SELECT nextval('prescription_number_seq') INTO next_num;
  RETURN 'PSG ' || LPAD(next_num::text, 5, '0');
END;
$$;