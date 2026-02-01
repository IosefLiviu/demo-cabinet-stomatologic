import { useState } from "react";
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

interface WhatsAppReplyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientPhone: string;
  patientName: string | null;
  patientId: string | null;
}

export function WhatsAppReplyDialog({
  open,
  onOpenChange,
  patientPhone,
  patientName,
  patientId,
}: WhatsAppReplyDialogProps) {
  const [message, setMessage] = useState("");
  const { sendMessageAsync, isSending } = useSendWhatsApp();

  const handleSend = async () => {
    if (!message.trim()) return;

    try {
      await sendMessageAsync({
        to: patientPhone.replace("whatsapp:", ""),
        message: message.trim(),
        patientId: patientId || undefined,
        patientName: patientName || undefined,
      });
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      // Error handled by hook
    }
  };

  const displayPhone = patientPhone.replace("whatsapp:", "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Răspunde la mesaj</DialogTitle>
          <DialogDescription>
            Trimite un mesaj WhatsApp către{" "}
            <span className="font-medium">{patientName || "pacient"}</span>
            {" "}({displayPhone})
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            placeholder="Scrie mesajul tău..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="resize-none"
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSending}
          >
            Anulează
          </Button>
          <Button
            onClick={handleSend}
            disabled={!message.trim() || isSending}
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
