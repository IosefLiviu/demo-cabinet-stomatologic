import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface WhatsAppMessage {
  id: string;
  patient_phone: string;
  patient_name: string | null;
  message_body: string;
  message_sid: string | null;
  direction: string;
  status: string | null;
  created_at: string;
  read_at: string | null;
  patient_id: string | null;
}

export function useWhatsAppMessages() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: messages = [], isLoading, error } = useQuery({
    queryKey: ["whatsapp-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as WhatsAppMessage[];
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("whatsapp_messages")
        .update({ 
          status: "read",
          read_at: new Date().toISOString()
        })
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
    },
    onError: (error) => {
      console.error("Error marking message as read:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut marca mesajul ca citit",
        variant: "destructive",
      });
    },
  });

  const deleteMessageMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("whatsapp_messages")
        .delete()
        .eq("id", messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["whatsapp-messages"] });
      toast({
        title: "Șters",
        description: "Mesajul a fost șters",
      });
    },
    onError: (error) => {
      console.error("Error deleting message:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge mesajul",
        variant: "destructive",
      });
    },
  });

  const unreadCount = messages.filter(m => m.status === "unread").length;

  return {
    messages,
    isLoading,
    error,
    unreadCount,
    markAsRead: markAsReadMutation.mutate,
    deleteMessage: deleteMessageMutation.mutate,
    isMarkingAsRead: markAsReadMutation.isPending,
    isDeleting: deleteMessageMutation.isPending,
  };
}
