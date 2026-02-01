import { MessageSquare, Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_MESSAGE = "Bună ziua, vă așteptăm mâine, {data}, la ora {ora}, la Perfect Smile Glim. Adresa: Strada București 68–70. Dacă nu puteți ajunge, vă rugăm să ne contactați pentru reprogramare.";

export function WhatsAppSettingsCard() {
  const { isWhatsAppRemindersEnabled, getSetting, updateSettingAsync, isUpdating, isLoading } = useAppSettings();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState("");

  const currentMessage = getSetting("whatsapp_reminder_message") || DEFAULT_MESSAGE;

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

  const handleEditStart = () => {
    setEditedMessage(currentMessage);
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditedMessage("");
  };

  const handleEditSave = async () => {
    try {
      await updateSettingAsync({ 
        key: "whatsapp_reminder_message", 
        value: editedMessage 
      });
      toast({
        title: "Salvat",
        description: "Mesajul a fost actualizat cu succes",
      });
      setIsEditing(false);
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
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">Mesaj trimis:</p>
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditStart}
                  className="h-7 px-2"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Editează
                </Button>
              )}
            </div>
            
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  className="min-h-[100px] text-sm"
                  placeholder="Introduceți mesajul..."
                />
                <p className="text-xs text-muted-foreground">
                  Folosește <code className="bg-muted px-1 rounded">{"{data}"}</code> pentru dată și <code className="bg-muted px-1 rounded">{"{ora}"}</code> pentru oră.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditCancel}
                    disabled={isUpdating}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Anulează
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleEditSave}
                    disabled={isUpdating || !editedMessage.trim()}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Salvează
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                "{currentMessage}"
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}