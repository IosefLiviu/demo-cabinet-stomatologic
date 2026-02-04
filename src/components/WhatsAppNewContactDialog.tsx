import { useState } from "react";
import { Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSendWhatsApp } from "@/hooks/useSendWhatsApp";

export function WhatsAppNewContactDialog() {
  const [open, setOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [contactName, setContactName] = useState("");
  const [message, setMessage] = useState("");
  const { sendMessageAsync, isSending } = useSendWhatsApp();

  const handleSend = async () => {
    if (!phoneNumber.trim() || !message.trim()) return;

    try {
      await sendMessageAsync({
        to: phoneNumber.trim(),
        message: message.trim(),
        patientName: contactName.trim() || undefined,
      });
      setPhoneNumber("");
      setContactName("");
      setMessage("");
      setOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setContactName("");
    setMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Contact nou
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Trimite mesaj WhatsApp</DialogTitle>
          <DialogDescription>
            Trimite un mesaj către un număr de telefon care nu este în lista de pacienți
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Număr de telefon *</Label>
            <Input
              id="phone"
              placeholder="ex: 0731234567 sau +40731234567"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Numărul va fi formatat automat pentru România (+40)
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nume (opțional)</Label>
            <Input
              id="name"
              placeholder="ex: Ion Popescu"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">Mesaj *</Label>
            <Textarea
              id="message"
              placeholder="Scrie mesajul tău..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSending}
          >
            Anulează
          </Button>
          <Button
            onClick={handleSend}
            disabled={!phoneNumber.trim() || !message.trim() || isSending}
            className="gap-2"
          >
            <Send className="h-4 w-4" />
            {isSending ? "Se trimite..." : "Trimite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
