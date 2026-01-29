-- Add source_cabinet_id column to track where items come FROM (for cabinet exits)
ALTER TABLE public.stock_movements 
ADD COLUMN IF NOT EXISTS source_cabinet_id integer REFERENCES public.cabinets(id);

-- Add comment to clarify the columns
COMMENT ON COLUMN public.stock_movements.cabinet_id IS 'Destination cabinet (for company_out/cabinet_in movements)';
COMMENT ON COLUMN public.stock_movements.source_cabinet_id IS 'Source cabinet (for cabinet_out/consumed movements)';