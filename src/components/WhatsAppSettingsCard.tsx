import { MessageSquare, Pencil, Save, X } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAppSettings } from "@/hooks/useAppSettings";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_REMINDER_MESSAGE = "Bună ziua, vă așteptăm mâine, {data}, la ora {ora}, la Perfect Smile Glim. Adresa: Strada București 68–70. Dacă nu puteți ajunge, vă rugăm să ne contactați pentru reprogramare.";
const DEFAULT_DIRECT_MESSAGE = "Bună ziua, {nume}! Vă contactăm de la Perfect Smile Glim. Cum vă putem ajuta?";

export function WhatsAppSettingsCard() {
  const { isWhatsAppRemindersEnabled, getSetting, updateSettingAsync, isUpdating, isLoading } = useAppSettings();
  const { toast } = useToast();
  
  // Reminder message editing state
  const [isEditingReminder, setIsEditingReminder] = useState(false);
  const [editedReminderMessage, setEditedReminderMessage] = useState("");
  
  // Direct message editing state
  const [isEditingDirect, setIsEditingDirect] = useState(false);
  const [editedDirectMessage, setEditedDirectMessage] = useState("");

  const currentReminderMessage = getSetting("whatsapp_reminder_message") || DEFAULT_REMINDER_MESSAGE;
  const currentDirectMessage = getSetting("whatsapp_direct_message_template") || DEFAULT_DIRECT_MESSAGE;

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

  // Reminder message handlers
  const handleReminderEditStart = () => {
    setEditedReminderMessage(currentReminderMessage);
    setIsEditingReminder(true);
  };

  const handleReminderEditCancel = () => {
    setIsEditingReminder(false);
    setEditedReminderMessage("");
  };

  const handleReminderEditSave = async () => {
    try {
      await updateSettingAsync({ 
        key: "whatsapp_reminder_message", 
        value: editedReminderMessage 
      });
      toast({
        title: "Salvat",
        description: "Mesajul de reminder a fost actualizat cu succes",
      });
      setIsEditingReminder(false);
    } catch (error) {
      // Error is handled in the hook
    }
  };

  // Direct message handlers
  const handleDirectEditStart = () => {
    setEditedDirectMessage(currentDirectMessage);
    setIsEditingDirect(true);
  };

  const handleDirectEditCancel = () => {
    setIsEditingDirect(false);
    setEditedDirectMessage("");
  };

  const handleDirectEditSave = async () => {
    try {
      await updateSettingAsync({ 
        key: "whatsapp_direct_message_template", 
        value: editedDirectMessage 
      });
      toast({
        title: "Salvat",
        description: "Șablonul de mesaj direct a fost actualizat cu succes",
      });
      setIsEditingDirect(false);
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
          Configurează mesajele automate și șabloanele WhatsApp pentru pacienți
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reminder Settings */}
        <div className="space-y-4">
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
                <p className="font-medium">Mesaj reminder:</p>
                {!isEditingReminder && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReminderEditStart}
                    className="h-7 px-2"
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Editează
                  </Button>
                )}
              </div>
              
              {isEditingReminder ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedReminderMessage}
                    onChange={(e) => setEditedReminderMessage(e.target.value)}
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
                      onClick={handleReminderEditCancel}
                      disabled={isUpdating}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Anulează
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleReminderEditSave}
                      disabled={isUpdating || !editedReminderMessage.trim()}
                    >
                      <Save className="h-3 w-3 mr-1" />
                      Salvează
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground italic">
                  "{currentReminderMessage}"
                </p>
              )}
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="border-t" />

        {/* Direct Message Template */}
        <div className="space-y-4">
          <div className="space-y-0.5">
            <Label className="text-base">
              Șablon mesaj direct
            </Label>
            <p className="text-sm text-muted-foreground">
              Mesajul pre-completat când trimiți un mesaj din lista de pacienți
            </p>
          </div>
          
          <div className="rounded-lg bg-muted/50 p-3 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <p className="font-medium">Mesaj șablon:</p>
              {!isEditingDirect && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDirectEditStart}
                  className="h-7 px-2"
                >
                  <Pencil className="h-3 w-3 mr-1" />
                  Editează
                </Button>
              )}
            </div>
            
            {isEditingDirect ? (
              <div className="space-y-2">
                <Textarea
                  value={editedDirectMessage}
                  onChange={(e) => setEditedDirectMessage(e.target.value)}
                  className="min-h-[100px] text-sm"
                  placeholder="Introduceți mesajul..."
                />
                <p className="text-xs text-muted-foreground">
                  Folosește <code className="bg-muted px-1 rounded">{"{nume}"}</code> pentru numele pacientului.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDirectEditCancel}
                    disabled={isUpdating}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Anulează
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleDirectEditSave}
                    disabled={isUpdating || !editedDirectMessage.trim()}
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Salvează
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground italic">
                "{currentDirectMessage}"
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
