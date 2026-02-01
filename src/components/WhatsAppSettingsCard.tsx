import { MessageSquare } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";

export function WhatsAppSettingsCard() {
  const { isWhatsAppRemindersEnabled, updateSettingAsync, isUpdating, isLoading } = useAppSettings();
  const { toast } = useToast();

  const handleToggle = async (enabled: boolean) => {
    try {
      await updateSettingAsync({ 
        key: "whatsapp_reminders_enabled", 
        value: enabled ? "true" : "false" 
      });
      toast({
        title: enabled ? "Activat" : "Dezactivat",
        description: enabled 
          ? "Reminder-ele WhatsApp au fost activate" 
          : "Reminder-ele WhatsApp au fost dezactivate",
      });
    } catch (error) {
      // Error is handled in the hook
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-green-600" />
          Setări WhatsApp
        </CardTitle>
        <CardDescription>
          Configurează mesajele automate WhatsApp pentru pacienți
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="whatsapp-reminders" className="text-base">
              Reminder-uri automate
            </Label>
            <p className="text-sm text-muted-foreground">
              Trimite automat mesaje WhatsApp cu 24h înainte de programări
            </p>
          </div>
          <Switch
            id="whatsapp-reminders"
            checked={isWhatsAppRemindersEnabled}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
          />
        </div>
        
        {isWhatsAppRemindersEnabled && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm">
            <p className="font-medium mb-1">Mesaj trimis:</p>
            <p className="text-muted-foreground italic">
              "Bună ziua, vă așteptăm mâine, [data], la ora [ora], la Perfect Smile Glim. 
              Adresa: Strada București 68–70. Dacă nu puteți ajunge, vă rugăm să ne contactați pentru reprogramare."
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
