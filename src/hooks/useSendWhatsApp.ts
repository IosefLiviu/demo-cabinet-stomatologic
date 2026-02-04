import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SendWhatsAppParams {
  to: string;
  message?: string;
  patientId?: string;
  patientName?: string;
  // For template-based messages
  templateType?: "reminder" | "direct";
  templateVariables?: {
    date?: string;
    time?: string;
    name?: string;
  };
}

export function useSendWhatsApp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: async ({ to, message, patientId, patientName, templateType, templateVariables }: SendWhatsAppParams) => {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { to, message, patientId, patientName, templateType, templateVariables },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
      toast({
        title: "Mesaj trimis",
        description: "Mesajul WhatsApp a fost trimis cu succes",
      });
    },
    onError: (error: Error) => {
      console.error("Error sending WhatsApp message:", error);
      toast({
        title: "Eroare",
        description: error.message || "Nu s-a putut trimite mesajul",
        variant: "destructive",
      });
    },
  });

  return {
    sendMessage: mutation.mutate,
    sendMessageAsync: mutation.mutateAsync,
    isSending: mutation.isPending,
  };
}
