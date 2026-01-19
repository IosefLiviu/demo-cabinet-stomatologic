-- Add column to track original file size before compression
ALTER TABLE public.patient_radiographs 
ADD COLUMN original_file_size integer NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.patient_radiographs.original_file_size IS 'Original file size before compression, in bytes';