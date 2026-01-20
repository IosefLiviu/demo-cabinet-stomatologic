-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE;

-- Create index for faster username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Allow public read access to username for login lookup (email lookup by username)
CREATE POLICY "Anyone can lookup username" 
ON public.profiles 
FOR SELECT 
USING (true);