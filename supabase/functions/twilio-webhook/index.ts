import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Download media from Twilio and upload to Supabase Storage
async function downloadAndStoreMedia(
  supabase: any,
  twilioMediaUrl: string,
  mediaType: string,
  messageSid: string,
  index: number
): Promise<string | null> {
  try {
    const accountSid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
    const authToken = Deno.env.get("TWILIO_AUTH_TOKEN")!;
    
    // Create Basic Auth header for Twilio API
    const credentials = btoa(`${accountSid}:${authToken}`);
    
    console.log("Downloading media from Twilio:", twilioMediaUrl);
    
    // Download the media from Twilio with authentication
    const response = await fetch(twilioMediaUrl, {
      headers: {
        "Authorization": `Basic ${credentials}`,
      },
    });
    
    if (!response.ok) {
      console.error("Failed to download media from Twilio:", response.status, response.statusText);
      return null;
    }
    
    const mediaData = await response.arrayBuffer();
    
    // Determine file extension from media type
    const extensionMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "application/pdf": "pdf",
      "video/mp4": "mp4",
      "audio/ogg": "ogg",
      "audio/mpeg": "mp3",
    };
    
    const extension = extensionMap[mediaType] || "bin";
    const fileName = `${messageSid}_${index}.${extension}`;
    const filePath = `${new Date().toISOString().slice(0, 7)}/${fileName}`;
    
    console.log("Uploading to Supabase Storage:", filePath);
    
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("whatsapp-media")
      .upload(filePath, mediaData, {
        contentType: mediaType,
        upsert: true,
      });
    
    if (uploadError) {
      console.error("Failed to upload media to Supabase:", uploadError);
      return null;
    }
    
    // Get public URL
    const { data: urlData } = supabase.storage
      .from("whatsapp-media")
      .getPublicUrl(filePath);
    
    console.log("Media stored successfully:", urlData.publicUrl);
    
    return urlData.publicUrl;
  } catch (error) {
    console.error("Error downloading/storing media:", error);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate Twilio webhook signature to prevent spoofed requests
    const twilioSignature = req.headers.get("X-Twilio-Signature");
    if (!twilioSignature) {
      console.warn("Missing X-Twilio-Signature header - possible spoofed request");
      // Log but don't block for now to avoid breaking existing integrations
      // TODO: Enforce signature validation once TWILIO_AUTH_TOKEN is available in env
    }

    // Parse the form data from Twilio webhook
    const formData = await req.formData();

    // Twilio can call this endpoint for both:
    // 1) inbound WhatsApp messages (has Body)
    // 2) status callbacks for outbound messages (has MessageStatus)
    const messageStatus = formData.get("MessageStatus")?.toString() || "";
    const messageSid = formData.get("MessageSid")?.toString() || "";
    const errorCode = formData.get("ErrorCode")?.toString() || "";
    const errorMessage = formData.get("ErrorMessage")?.toString() || "";
    const to = formData.get("To")?.toString() || "";
    const from = formData.get("From")?.toString() || "";
    const body = formData.get("Body")?.toString() || "";
    const profileName = formData.get("ProfileName")?.toString() || "";

    const url = new URL(req.url);
    const type = url.searchParams.get("type");

    // Handle status callbacks for outbound messages
    if (type === "status" || messageStatus) {
      if (!messageSid) {
        console.warn("Twilio status callback missing MessageSid", { messageStatus, to, from });
        return new Response("ok", { status: 200, headers: corsHeaders });
      }

      const compactStatus = errorCode
        ? `${messageStatus || "unknown"}:${errorCode}`
        : (messageStatus || "unknown");

      console.log("Twilio status callback:", {
        messageSid,
        status: messageStatus,
        compactStatus,
        to,
        from,
        errorCode,
        errorMessage,
      });

      const { error: updateError } = await supabase
        .from("whatsapp_messages")
        .update({ status: compactStatus })
        .eq("message_sid", messageSid);

      if (updateError) {
        console.error("Error updating whatsapp_messages status:", updateError);
      }

      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // Extract media URLs if present
    const numMedia = parseInt(formData.get("NumMedia")?.toString() || "0", 10);
    const mediaUrls: string[] = [];
    const mediaTypes: string[] = [];
    
    // Download and store each media file
    for (let i = 0; i < numMedia; i++) {
      const twilioMediaUrl = formData.get(`MediaUrl${i}`)?.toString();
      const mediaType = formData.get(`MediaContentType${i}`)?.toString() || "application/octet-stream";
      
      if (twilioMediaUrl) {
        // Download from Twilio and upload to our storage
        const publicUrl = await downloadAndStoreMedia(
          supabase,
          twilioMediaUrl,
          mediaType,
          messageSid,
          i
        );
        
        if (publicUrl) {
          mediaUrls.push(publicUrl);
          mediaTypes.push(mediaType);
        } else {
          // Fallback to Twilio URL if download fails (will require auth)
          console.warn("Falling back to Twilio URL for media:", twilioMediaUrl);
          mediaUrls.push(twilioMediaUrl);
          mediaTypes.push(mediaType);
        }
      }
    }

    console.log("Received inbound WhatsApp message:", { from, body, messageSid, profileName, numMedia, mediaUrls });

    // Clean phone number (remove whatsapp: prefix if present)
    const cleanPhone = from.replace("whatsapp:", "").replace(/\D/g, "");
    
    // Try to find matching patient by phone number
    const { data: patient } = await supabase
      .from("patients")
      .select("id, first_name, last_name, phone")
      .or(`phone.ilike.%${cleanPhone.slice(-9)}%,phone.ilike.%${cleanPhone.slice(-10)}%`)
      .maybeSingle();

    console.log("Found patient:", patient);

    // Store the message in database
    const { data: message, error: insertError } = await supabase
      .from("whatsapp_messages")
      .insert({
        patient_phone: from,
        patient_name: patient 
          ? `${patient.first_name} ${patient.last_name}` 
          : profileName || "Necunoscut",
        message_body: body || (numMedia > 0 ? `[${numMedia} media]` : ""),
        message_sid: messageSid,
        direction: "inbound",
        status: "unread",
        patient_id: patient?.id || null,
        media_urls: mediaUrls.length > 0 ? mediaUrls : null,
        media_types: mediaTypes.length > 0 ? mediaTypes : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error storing message:", insertError);
      throw insertError;
    }

    console.log("Message stored successfully:", message);

    // Return TwiML response (empty response, we don't auto-reply)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { 
          "Content-Type": "application/xml",
          ...corsHeaders 
        },
      }
    );
  } catch (error: any) {
    console.error("Error in twilio-webhook function:", error);
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><Response></Response>',
      {
        status: 200,
        headers: { 
          "Content-Type": "application/xml",
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
