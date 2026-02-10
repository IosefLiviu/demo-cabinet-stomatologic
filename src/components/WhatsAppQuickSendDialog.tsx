import { useState, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSendWhatsApp } from "@/hooks/useSendWhatsApp";

interface WhatsAppQuickSendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientPhone: string;
  patientName: string;
  patientId: string;
}

export function WhatsAppQuickSendDialog({
  open,
  onOpenChange,
  patientPhone,
  patientName,
  patientId,
}: WhatsAppQuickSendDialogProps) {
  const [message, setMessage] = useState("");
  const { sendMessageAsync, isSending } = useSendWhatsApp();

  useEffect(() => {
    if (open && patientName) {
      const lastName = patientName.split(" ")[0] || patientName;
      setMessage(
        `Bună ziua, ${lastName}! Vă contactăm de la Perfect Smile Glim.\nCum vă putem ajuta?`
      );
    }
  }, [open, patientName]);

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      await sendMessageAsync({
        to: patientPhone,
        message: message.trim(),
        patientId,
        patientName,
      });
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-green-600" />
            Trimite mesaj WhatsApp
          </DialogTitle>
          <DialogDescription>
            Către: <span className="font-medium">{patientName}</span>
            <br />
            Telefon: <span className="font-medium">{patientPhone}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Anulează
          </Button>
          <Button
            onClick={handleSend}
            disabled={isSending || !message.trim()}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            <Send className="h-4 w-4" />
            {isSending ? "Se trimite..." : "Trimite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
