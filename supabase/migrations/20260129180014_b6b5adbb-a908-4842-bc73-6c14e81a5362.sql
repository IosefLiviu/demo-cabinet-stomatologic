-- Create table for WhatsApp messages
CREATE TABLE public.whatsapp_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_phone text NOT NULL,
  patient_name text,
  message_body text NOT NULL,
  message_sid text,
  direction text NOT NULL DEFAULT 'inbound',
  status text DEFAULT 'unread',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  read_at timestamp with time zone,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Authenticated users can view whatsapp_messages"
ON public.whatsapp_messages
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert whatsapp_messages"
ON public.whatsapp_messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Authenticated users can update whatsapp_messages"
ON public.whatsapp_messages
FOR UPDATE
USING (true);

CREATE POLICY "Authenticated users can delete whatsapp_messages"
ON public.whatsapp_messages
FOR DELETE
USING (true);

-- Create index for faster queries
CREATE INDEX idx_whatsapp_messages_phone ON public.whatsapp_messages(patient_phone);
CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_messages(status);
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at DESC);