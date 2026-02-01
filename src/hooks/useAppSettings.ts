import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AppSetting {
  setting_key: string;
  setting_value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useAppSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("*");

      if (error) throw error;
      return data as AppSetting[];
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from("app_settings")
        .update({ setting_value: value, updated_at: new Date().toISOString() })
        .eq("setting_key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
    },
    onError: (error: Error) => {
      console.error("Error updating setting:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut actualiza setarea",
        variant: "destructive",
      });
    },
  });

  const getSetting = (key: string): string | null => {
    const setting = settings.find(s => s.setting_key === key);
    return setting?.setting_value ?? null;
  };

  const isWhatsAppRemindersEnabled = getSetting("whatsapp_reminders_enabled") === "true";

  return {
    settings,
    isLoading,
    getSetting,
    updateSetting: updateSettingMutation.mutate,
    updateSettingAsync: updateSettingMutation.mutateAsync,
    isUpdating: updateSettingMutation.isPending,
    isWhatsAppRemindersEnabled,
  };
}
