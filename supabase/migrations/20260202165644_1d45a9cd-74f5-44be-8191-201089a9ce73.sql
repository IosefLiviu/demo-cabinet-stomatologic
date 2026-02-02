-- Add columns for media attachments to whatsapp_messages
ALTER TABLE public.whatsapp_messages 
ADD COLUMN IF NOT EXISTS media_urls text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS media_types text[] DEFAULT NULL;