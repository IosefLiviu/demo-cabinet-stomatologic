-- Add column to track if user has changed their initial password
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT true;

-- Update existing users to not require password change (they already have accounts)
UPDATE public.profiles SET must_change_password = false WHERE must_change_password IS NULL OR must_change_password = true;