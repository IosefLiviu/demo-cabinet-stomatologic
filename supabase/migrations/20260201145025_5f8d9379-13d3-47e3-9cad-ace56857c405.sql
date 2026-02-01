-- Add default message template setting if it doesn't exist
INSERT INTO public.app_settings (setting_key, setting_value, description)
VALUES (
  'whatsapp_reminder_message',
  'Bună ziua, vă așteptăm mâine, {data}, la ora {ora}, la Perfect Smile Glim. Adresa: Strada București 68–70. Dacă nu puteți ajunge, vă rugăm să ne contactați pentru reprogramare.',
  'Template-ul mesajului WhatsApp pentru reminder-uri. Folosește {data} pentru dată și {ora} pentru oră.'
)
ON CONFLICT (setting_key) DO NOTHING;