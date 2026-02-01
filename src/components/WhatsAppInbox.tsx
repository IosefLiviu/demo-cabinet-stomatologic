import { useState } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { MessageSquare, Check, Trash2, User, Phone, ExternalLink, Reply } from "lucide-react";
import { useWhatsAppMessages, WhatsAppMessage } from "@/hooks/useWhatsAppMessages";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { WhatsAppReplyDialog } from "./WhatsAppReplyDialog";

export function WhatsAppInbox() {
  const navigate = useNavigate();
  const { messages, isLoading, unreadCount, markAsRead, deleteMessage, isDeleting } = useWhatsAppMessages();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [replyTo, setReplyTo] = useState<WhatsAppMessage | null>(null);

  const filteredMessages = filter === "unread" 
    ? messages.filter(m => m.status === "unread")
    : messages;

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteMessage(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const goToPatient = (patientId: string) => {
    navigate(`/?tab=patients&patientId=${patientId}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Inbox WhatsApp
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            Inbox WhatsApp
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} necitite
              </Badge>
            )}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              Toate ({messages.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Necitite ({unreadCount})
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredMessages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nu există mesaje {filter === "unread" ? "necitite" : ""}</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    message.status === "unread"
                      ? "bg-primary/5 border-primary/20"
                      : "bg-muted/30"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {message.patient_name || "Necunoscut"}
                        </span>
                        {message.status === "unread" && (
                          <Badge variant="default" className="text-xs">
                            Nou
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                        <Phone className="h-3 w-3" />
                        <span>{message.patient_phone.replace("whatsapp:", "")}</span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.message_body}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(new Date(message.created_at), "d MMMM yyyy, HH:mm", { locale: ro })}
                      </p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setReplyTo(message)}
                        title="Răspunde"
                        className="text-green-600 hover:text-green-700"
                      >
                        <Reply className="h-4 w-4" />
                      </Button>
                      {message.status === "unread" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleMarkAsRead(message.id)}
                          title="Marchează ca citit"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {message.patient_id && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => goToPatient(message.patient_id!)}
                          title="Vezi pacientul"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteConfirmId(message.id)}
                        title="Șterge mesajul"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge mesajul?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Mesajul va fi șters permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <WhatsAppReplyDialog
        open={!!replyTo}
        onOpenChange={(open) => !open && setReplyTo(null)}
        patientPhone={replyTo?.patient_phone || ""}
        patientName={replyTo?.patient_name || null}
        patientId={replyTo?.patient_id || null}
      />
    </Card>
  );
}
