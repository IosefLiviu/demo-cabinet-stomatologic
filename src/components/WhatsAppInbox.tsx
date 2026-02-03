import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { MessageSquare, Check, Trash2, User, Phone, ExternalLink, Reply, ChevronDown, ChevronUp, Image, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Conversation {
  patientPhone: string;
  patientName: string | null;
  patientId: string | null;
  messages: WhatsAppMessage[];
  unreadCount: number;
  lastMessageAt: string;
}

export function WhatsAppInbox() {
  const navigate = useNavigate();
  const { messages, isLoading, unreadCount, markAsRead, deleteMessage, isDeleting } = useWhatsAppMessages();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTo, setReplyTo] = useState<Conversation | null>(null);
  const [expandedConversations, setExpandedConversations] = useState<Set<string>>(new Set());

  // Group messages into conversations by patient phone
  const conversations = useMemo(() => {
    const grouped = new Map<string, Conversation>();
    
    messages.forEach((message) => {
      const phone = message.patient_phone;
      
      if (!grouped.has(phone)) {
        grouped.set(phone, {
          patientPhone: phone,
          patientName: message.patient_name,
          patientId: message.patient_id,
          messages: [],
          unreadCount: 0,
          lastMessageAt: message.created_at,
        });
      }
      
      const conv = grouped.get(phone)!;
      conv.messages.push(message);
      
      if (message.status === "unread") {
        conv.unreadCount++;
      }
      
      // Update patient info from most recent message with data
      if (message.patient_name && !conv.patientName) {
        conv.patientName = message.patient_name;
      }
      if (message.patient_id && !conv.patientId) {
        conv.patientId = message.patient_id;
      }
    });
    
    // Sort conversations by last message time
    return Array.from(grouped.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
  }, [messages]);

  // Filter conversations by search query and read status
  const filteredConversations = useMemo(() => {
    let result = conversations;
    
    // Filter by search query
    if (searchQuery.trim()) {
      const searchTerms = searchQuery.toLowerCase().trim().split(/\s+/);
      result = result.filter(c => {
        const name = (c.patientName || "").toLowerCase();
        const phone = c.patientPhone.replace("whatsapp:", "").toLowerCase();
        return searchTerms.every(term => name.includes(term) || phone.includes(term));
      });
    }
    
    // Filter by read status
    if (filter === "unread") {
      result = result.filter(c => c.unreadCount > 0);
    }
    
    return result;
  }, [conversations, searchQuery, filter]);

  const toggleConversation = (phone: string) => {
    setExpandedConversations(prev => {
      const next = new Set(prev);
      if (next.has(phone)) {
        next.delete(phone);
      } else {
        next.add(phone);
      }
      return next;
    });
  };

  const handleMarkAllAsRead = (conv: Conversation) => {
    conv.messages.forEach(m => {
      if (m.status === "unread") {
        markAsRead(m.id);
      }
    });
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
              Toate ({conversations.length})
            </Button>
            <Button
              variant={filter === "unread" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("unread")}
            >
              Necitite ({conversations.filter(c => c.unreadCount > 0).length})
            </Button>
          </div>
        </div>
        <div className="relative mt-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută după nume sau telefon..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent>
        {filteredConversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nu există conversații {filter === "unread" ? "necitite" : ""}</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {filteredConversations.map((conv) => {
                const isExpanded = expandedConversations.has(conv.patientPhone);
                const latestMessage = conv.messages[0];
                
                return (
                  <Collapsible
                    key={conv.patientPhone}
                    open={isExpanded}
                    onOpenChange={() => toggleConversation(conv.patientPhone)}
                  >
                    <div
                      className={`rounded-lg border transition-colors ${
                        conv.unreadCount > 0
                          ? "bg-primary/5 border-primary/20"
                          : "bg-muted/30"
                      }`}
                    >
                      {/* Conversation Header */}
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                {conv.patientName || "Necunoscut"}
                              </span>
                              {conv.unreadCount > 0 && (
                                <Badge variant="default" className="text-xs">
                                  {conv.unreadCount} {conv.unreadCount === 1 ? "nou" : "noi"}
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {conv.messages.length} {conv.messages.length === 1 ? "mesaj" : "mesaje"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                              <Phone className="h-3 w-3" />
                              <span>{conv.patientPhone.replace("whatsapp:", "")}</span>
                            </div>
                            
                            {/* Preview of latest message */}
                            <div className="flex items-center gap-2">
                              {latestMessage.direction === "outbound" && (
                                <span className="text-xs text-muted-foreground">Tu:</span>
                              )}
                              {latestMessage.media_urls && latestMessage.media_urls.length > 0 ? (
                                <p className="text-sm text-muted-foreground flex items-center gap-1">
                                  <Image className="h-3 w-3" />
                                  {latestMessage.media_urls.length} {latestMessage.media_urls.length === 1 ? "imagine" : "imagini"}
                                  {latestMessage.message_body && ` - ${latestMessage.message_body.substring(0, 30)}...`}
                                </p>
                              ) : (
                                <p className="text-sm text-muted-foreground truncate max-w-[300px]">
                                  {latestMessage.message_body || "(mesaj gol)"}
                                </p>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(conv.lastMessageAt), "d MMMM yyyy, HH:mm", { locale: ro })}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReplyTo(conv);
                              }}
                              title="Răspunde"
                              className="text-green-600 hover:text-green-700"
                            >
                              <Reply className="h-4 w-4" />
                            </Button>
                            {conv.unreadCount > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAllAsRead(conv);
                                }}
                                title="Marchează toate ca citite"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            )}
                            {conv.patientId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  goToPatient(conv.patientId!);
                                }}
                                title="Vezi pacientul"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            )}
                            <CollapsibleTrigger asChild>
                              <Button size="sm" variant="ghost" title="Extinde conversația">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Messages */}
                      <CollapsibleContent>
                        <div className="border-t px-4 py-3 space-y-3 bg-background/50">
                          {conv.messages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex ${message.direction === "outbound" ? "justify-end" : "justify-start"}`}
                            >
                              <div
                                className={`max-w-[80%] rounded-lg p-3 ${
                                  message.direction === "outbound"
                                    ? "bg-primary text-primary-foreground"
                                    : message.status === "unread"
                                    ? "bg-primary/10 border border-primary/20"
                                    : "bg-muted"
                                }`}
                              >
                                {/* Display media if present */}
                                {message.media_urls && message.media_urls.length > 0 && (
                                  <div className="mb-2 space-y-2">
                                    {message.media_urls.map((url, idx) => {
                                      const mediaType = message.media_types?.[idx] || "";
                                      const isImage = mediaType.startsWith("image/");
                                      
                                      return isImage ? (
                                        <a
                                          key={idx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="block"
                                        >
                                          <img
                                            src={url}
                                            alt={`Media ${idx + 1}`}
                                            className="max-w-full max-h-48 rounded-lg object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                            onError={(e) => {
                                              // If image fails to load, show a placeholder
                                              e.currentTarget.style.display = "none";
                                              e.currentTarget.nextElementSibling?.classList.remove("hidden");
                                            }}
                                          />
                                          <div className="hidden flex items-center gap-2 text-xs text-muted-foreground py-2">
                                            <Image className="h-4 w-4" />
                                            <span>Imagine (click pentru a deschide)</span>
                                          </div>
                                        </a>
                                      ) : (
                                        <a
                                          key={idx}
                                          href={url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 text-xs underline hover:no-underline"
                                        >
                                          <ExternalLink className="h-3 w-3" />
                                          Fișier atașat ({mediaType.split("/")[1] || "unknown"})
                                        </a>
                                      );
                                    })}
                                  </div>
                                )}
                                {message.message_body && (
                                  <p className="text-sm whitespace-pre-wrap break-words">
                                    {message.message_body}
                                  </p>
                                )}
                                <div className="flex items-center justify-between gap-2 mt-1">
                                  <p className={`text-xs ${
                                    message.direction === "outbound" 
                                      ? "text-primary-foreground/70" 
                                      : "text-muted-foreground"
                                  }`}>
                                    {format(new Date(message.created_at), "HH:mm", { locale: ro })}
                                  </p>
                                  {message.direction === "inbound" && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                      onClick={() => setDeleteConfirmId(message.id)}
                                      title="Șterge mesajul"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                                {message.direction === "outbound" && message.status && (
                                  <p className={`text-xs mt-1 ${
                                    message.status.includes("delivered") 
                                      ? "text-primary-foreground/70" 
                                      : message.status.includes("failed") || message.status.includes("undelivered")
                                      ? "text-red-300"
                                      : "text-primary-foreground/50"
                                  }`}>
                                    {message.status.includes("delivered") ? "✓✓ Livrat" 
                                      : message.status.includes("sent") ? "✓ Trimis"
                                      : message.status.includes("failed") || message.status.includes("undelivered") ? "❌ Eșuat"
                                      : message.status}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
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
        patientPhone={replyTo?.patientPhone || ""}
        patientName={replyTo?.patientName || null}
        patientId={replyTo?.patientId || null}
      />
    </Card>
  );
}
