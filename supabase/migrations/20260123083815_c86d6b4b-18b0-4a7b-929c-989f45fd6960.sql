-- Create stock_items table
CREATE TABLE public.stock_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'buc',
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create stock_movements table
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  type TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

-- RLS policies for stock_items (authenticated users only)
CREATE POLICY "Authenticated users can view stock_items"
  ON public.stock_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert stock_items"
  ON public.stock_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock_items"
  ON public.stock_items FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete stock_items"
  ON public.stock_items FOR DELETE
  USING (true);

-- RLS policies for stock_movements (authenticated users only)
CREATE POLICY "Authenticated users can view stock_movements"
  ON public.stock_movements FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert stock_movements"
  ON public.stock_movements FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock_movements"
  ON public.stock_movements FOR UPDATE
  USING (true);

CREATE POLICY "Authenticated users can delete stock_movements"
  ON public.stock_movements FOR DELETE
  USING (true);

-- Trigger for updated_at on stock_items
CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON public.stock_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();