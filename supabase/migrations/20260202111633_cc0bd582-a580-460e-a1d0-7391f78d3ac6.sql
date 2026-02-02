-- Add notification_email to profiles (can be shared across users)
ALTER TABLE public.profiles 
ADD COLUMN notification_email text DEFAULT NULL;

-- Add comment explaining the field
COMMENT ON COLUMN public.profiles.notification_email IS 'Shared email for notifications (e.g., office email). Can be the same for multiple users.';