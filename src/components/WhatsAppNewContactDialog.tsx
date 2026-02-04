import { useState } from "react";
import { Send, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const { sendMessageAsync, isSending } = useSendWhatsApp();

  const handleSend = async () => {
    if (!phoneNumber.trim() || !contactName.trim()) return;

    try {
      await sendMessageAsync({
        to: phoneNumber.trim(),
        patientName: contactName.trim(),
        templateType: "direct",
        templateVariables: {
          name: contactName.trim(),
        },
      });
      setPhoneNumber("");
      setContactName("");
      setOpen(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const resetForm = () => {
    setPhoneNumber("");
    setContactName("");
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
            Trimite un mesaj către un număr de telefon care nu este în lista de pacienți.
            Se va folosi șablonul pre-aprobat pentru mesaje directe.
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
            <Label htmlFor="name">Nume contact *</Label>
            <Input
              id="name"
              placeholder="ex: Ion Popescu"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Numele va fi folosit în șablonul mesajului
            </p>
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
            disabled={!phoneNumber.trim() || !contactName.trim() || isSending}
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
