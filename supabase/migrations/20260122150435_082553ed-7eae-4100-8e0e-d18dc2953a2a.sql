-- Create login_logs table for authentication auditing
CREATE TABLE public.login_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  success BOOLEAN NOT NULL DEFAULT false,
  ip_address TEXT,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.login_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view login logs
CREATE POLICY "Admins can view login logs"
ON public.login_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow edge function to insert logs (via service role, no RLS needed for inserts from service role)
-- Service role bypasses RLS, so no insert policy needed

-- Create index for faster queries
CREATE INDEX idx_login_logs_created_at ON public.login_logs(created_at DESC);
CREATE INDEX idx_login_logs_username ON public.login_logs(username);
CREATE INDEX idx_login_logs_user_id ON public.login_logs(user_id);