-- Add user_id column to doctors table to link doctors to user accounts
ALTER TABLE public.doctors 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_doctors_user_id ON public.doctors(user_id);