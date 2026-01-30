-- Add deleted_at column to stock_movements for soft-delete functionality
ALTER TABLE public.stock_movements ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for faster filtering of non-deleted movements
CREATE INDEX idx_stock_movements_deleted_at ON public.stock_movements(deleted_at) WHERE deleted_at IS NULL;