-- Create a storage bucket for WhatsApp media files
INSERT INTO storage.buckets (id, name, public)
VALUES ('whatsapp-media', 'whatsapp-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to WhatsApp media
CREATE POLICY "WhatsApp media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'whatsapp-media');

-- Allow authenticated users to upload media (for the service role)
CREATE POLICY "Service role can upload WhatsApp media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'whatsapp-media');