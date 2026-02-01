-- Create app_settings table for global configuration
CREATE TABLE public.app_settings (
  setting_key text PRIMARY KEY,
  setting_value text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read settings
CREATE POLICY "Authenticated users can view app_settings"
ON public.app_settings
FOR SELECT
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can insert app_settings"
ON public.app_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update app_settings"
ON public.app_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete app_settings"
ON public.app_settings
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default setting for WhatsApp reminders (disabled by default)
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES ('whatsapp_reminders_enabled', 'false', 'Enable/disable automated WhatsApp appointment reminders 24h before');