import { useState, useMemo, useRef, useEffect } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  MessageSquare, Check, CheckCheck, Trash2, User, Phone, ExternalLink,
  Send, ChevronLeft, Image, Search, UserPlus, ArrowDown, Clock, Mail, MailOpen, FileText, Download, Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWhatsAppMessages, WhatsAppMessage } from "@/hooks/useWhatsAppMessages";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useNavigate } from "react-router-dom";
import { WhatsAppNewContactDialog } from "./WhatsAppNewContactDialog";
import { useSendWhatsApp } from "@/hooks/useSendWhatsApp";
import { cn } from "@/lib/utils";

interface Conversation {
  patientPhone: string;
  patientName: string | null;
  patientId: string | null;
  messages: WhatsAppMessage[];
  unreadCount: number;
  lastMessageAt: string;
}

function FileDownloadButton({ url, mediaType }: { url: string; mediaType: string }) {
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const label = mediaType.split("/")[1] || "atașament";
  const isPdf = mediaType === "application/pdf";

  const handleOpen = async () => {
    setLoading(true);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setBlobUrl(objectUrl);
    } catch (err) {
      console.error("Error opening file:", err);
      // Last resort fallback
      setBlobUrl(url);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (blobUrl && blobUrl.startsWith("blob:")) {
      URL.revokeObjectURL(blobUrl);
    }
    setBlobUrl(null);
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `document.${label}`;
    a.click();
  };

  return (
    <>
      <button
        onClick={handleOpen}
        disabled={loading}
        className="flex items-center gap-2 text-xs underline hover:no-underline text-blue-600 dark:text-blue-400 disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
        {label.toUpperCase()} ({loading ? "se încarcă..." : "deschide"})
      </button>

      {blobUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex flex-col items-center justify-center" onClick={handleClose}>
          <div className="bg-card rounded-lg shadow-xl w-[95vw] h-[90vh] max-w-4xl flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-2 border-b border-border">
              <span className="text-sm font-medium">Vizualizare {label.toUpperCase()}</span>
              <div className="flex gap-2">
                <button onClick={handleDownload} className="text-xs px-3 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90">
                  <Download className="h-3 w-3 inline mr-1" /> Descarcă
                </button>
                <button onClick={handleClose} className="text-xs px-3 py-1 rounded bg-muted hover:bg-muted/80 text-foreground">
                  Închide
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              {isPdf ? (
                <iframe src={blobUrl} className="w-full h-full border-0" title="PDF Viewer" />
              ) : (
                <iframe src={blobUrl} className="w-full h-full border-0" title="File Viewer" />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MessageStatusIcon({ status, direction }: { status: string | null; direction: string }) {
  if (direction !== "outbound" || !status) return null;

  if (status.includes("read")) {
    return <CheckCheck className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />;
  }
  if (status.includes("delivered")) {
    return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />;
  }
  if (status.includes("sent") || status === "queued") {
    return <Check className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />;
  }
  if (status.includes("failed") || status.includes("undelivered")) {
    return <span className="text-[10px] text-red-500 flex-shrink-0">!</span>;
  }
  return <Clock className="h-3 w-3 text-muted-foreground/40 flex-shrink-0" />;
}

function getInitials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

function formatMessageDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 86400000;

  if (diff < oneDay && date.getDate() === now.getDate()) {
    return format(date, "HH:mm");
  }
  if (diff < 2 * oneDay) return "Ieri";
  if (diff < 7 * oneDay) return format(date, "EEEE", { locale: ro });
  return format(date, "dd.MM.yyyy");
}

export function WhatsAppInbox() {
  const navigate = useNavigate();
  const { messages, isLoading, unreadCount, markAsRead, markAsUnread, deleteMessage } = useWhatsAppMessages();
  const { sendMessageAsync, isSending } = useSendWhatsApp();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Group messages into conversations
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
      if (message.status === "unread") conv.unreadCount++;
      if (message.patient_name && !conv.patientName) conv.patientName = message.patient_name;
      if (message.patient_id && !conv.patientId) conv.patientId = message.patient_id;
    });
    return Array.from(grouped.values()).sort((a, b) => {
      // Unread conversations first
      if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
      if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
      // Then by most recent message
      return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
    });
  }, [messages]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const terms = searchQuery.toLowerCase().trim().split(/\s+/);
    return conversations.filter((c) => {
      const name = (c.patientName || "").toLowerCase();
      const phone = c.patientPhone.replace("whatsapp:", "").toLowerCase();
      return terms.every((t) => name.includes(t) || phone.includes(t));
    });
  }, [conversations, searchQuery]);

  const activeConv = useMemo(
    () => conversations.find((c) => c.patientPhone === activeConversation) || null,
    [conversations, activeConversation]
  );

  // Scroll to bottom when conversation changes or new messages arrive
  useEffect(() => {
    if (activeConv) {
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    }
  }, [activeConv?.messages.length, activeConversation]);

  // Mark messages as read when opening conversation
  useEffect(() => {
    if (activeConv) {
      activeConv.messages.forEach((m) => {
        if (m.status === "unread" && m.direction === "inbound") markAsRead(m.id);
      });
    }
  }, [activeConversation]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !activeConv) return;
    try {
      await sendMessageAsync({
        to: activeConv.patientPhone.replace("whatsapp:", ""),
        message: replyText.trim(),
        patientId: activeConv.patientId || undefined,
        patientName: activeConv.patientName || undefined,
      });
      setReplyText("");
      textareaRef.current?.focus();
    } catch (error) {
      // handled by hook
    }
  };

  const handleDelete = () => {
    if (deleteConfirmId) {
      deleteMessage(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // Group messages by date for chat view
  const groupedMessages = useMemo(() => {
    if (!activeConv) return [];
    const sorted = [...activeConv.messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    const groups: { date: string; messages: WhatsAppMessage[] }[] = [];
    sorted.forEach((msg) => {
      const dateKey = format(new Date(msg.created_at), "yyyy-MM-dd");
      const last = groups[groups.length - 1];
      if (last && last.date === dateKey) {
        last.messages.push(msg);
      } else {
        groups.push({ date: dateKey, messages: [msg] });
      }
    });
    return groups;
  }, [activeConv]);

  function formatDateLabel(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000 && date.getDate() === now.getDate()) return "Astăzi";
    if (diff < 172800000) return "Ieri";
    return format(date, "d MMMM yyyy", { locale: ro });
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm h-[600px] flex">
        <div className="w-[360px] border-r border-border p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Skeleton className="h-8 w-48" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm flex" style={{ height: "calc(100vh - 200px)", minHeight: "500px" }}>
      {/* ─── Conversation List (Left Panel) ─── */}
      <div
        className={cn(
          "w-full sm:w-[360px] sm:min-w-[300px] flex flex-col border-r border-border bg-card",
          activeConv && "hidden sm:flex"
        )}
      >
        {/* List Header */}
        <div className="bg-[#075E54] dark:bg-[#1F2C33] px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-white" />
            <h2 className="text-white font-semibold text-base">WhatsApp</h2>
            {unreadCount > 0 && (
              <Badge className="bg-[#25D366] text-white border-0 text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <WhatsAppNewContactDialog />
        </div>

        {/* Search */}
        <div className="px-2 py-2 bg-card border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută conversații..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-8 text-sm bg-muted/50 border-0 rounded-lg"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <ScrollArea className="flex-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nu există conversații</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const latestMsg = conv.messages[0];
              const isActive = activeConversation === conv.patientPhone;
              return (
                <div
                  key={conv.patientPhone}
                  className={cn(
                    "w-full text-left px-3 py-3 flex items-center gap-3 border-b border-border/50 hover:bg-muted/50 transition-colors group/conv relative",
                    isActive && "bg-muted",
                    conv.unreadCount > 0 && "border-l-[3px] border-l-[#25D366] bg-[#25D366]/5 dark:bg-[#25D366]/10"
                  )}
                >
                  <button
                    className="absolute inset-0 w-full h-full z-0"
                    onClick={() => setActiveConversation(conv.patientPhone)}
                  />
                  {/* Avatar */}
                  <div className={cn(
                    "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 relative",
                    conv.unreadCount > 0
                      ? "bg-[#25D366]/30 dark:bg-[#25D366]/20 ring-2 ring-[#25D366]"
                      : "bg-[#25D366]/20 dark:bg-[#25D366]/10"
                  )}>
                    <span className="text-sm font-bold text-[#25D366]">
                      {getInitials(conv.patientName)}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#25D366] rounded-full border-2 border-card" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={cn(
                        "text-sm truncate",
                        conv.unreadCount > 0 ? "font-bold text-foreground" : "font-semibold text-foreground"
                      )}>
                        {conv.patientName || conv.patientPhone.replace("whatsapp:", "")}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Mark as unread button - visible on hover when conversation has no unread */}
                        {conv.unreadCount === 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const lastInbound = conv.messages.find(m => m.direction === "inbound");
                              if (lastInbound) markAsUnread(lastInbound.id);
                            }}
                            className="opacity-0 group-hover/conv:opacity-100 transition-opacity z-10 p-0.5 rounded hover:bg-muted"
                            title="Marchează ca necitit"
                          >
                            <MailOpen className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </button>
                        )}
                        <span className={cn(
                          "text-[11px]",
                          conv.unreadCount > 0 ? "text-[#25D366] font-bold" : "text-muted-foreground"
                        )}>
                          {formatMessageDate(conv.lastMessageAt)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 mt-0.5">
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {latestMsg.direction === "outbound" && (
                          <MessageStatusIcon status={latestMsg.status} direction="outbound" />
                        )}
                        <span className={cn(
                          "text-xs truncate",
                          conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"
                        )}>
                          {latestMsg.media_urls?.length
                            ? `📷 ${latestMsg.media_urls.length === 1 ? "Imagine" : `${latestMsg.media_urls.length} imagini`}`
                            : latestMsg.message_body || "(mesaj gol)"}
                        </span>
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="bg-[#25D366] text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0 animate-pulse">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </ScrollArea>
      </div>

      {/* ─── Chat Panel (Right) ─── */}
      <div className={cn("flex-1 flex flex-col", !activeConv && "hidden sm:flex")}>
        {activeConv ? (
          <>
            {/* Chat Header */}
            <div className="bg-[#075E54] dark:bg-[#1F2C33] px-3 py-2.5 flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden h-8 w-8 text-white hover:bg-white/10"
                onClick={() => setActiveConversation(null)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">
                  {getInitials(activeConv.patientName)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">
                  {activeConv.patientName || "Necunoscut"}
                </p>
                <p className="text-white/70 text-xs truncate">
                  {activeConv.patientPhone.replace("whatsapp:", "")}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  className="h-8 text-white hover:bg-white/10 gap-1.5 px-2 text-xs"
                  onClick={() => {
                    activeConv.messages.forEach((m) => {
                      if (m.direction === "inbound" && m.status !== "unread") {
                        markAsUnread(m.id);
                      }
                    });
                    setActiveConversation(null);
                  }}
                  title="Marchează ca necitit"
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Necitit</span>
                </Button>
                {activeConv.patientId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-white hover:bg-white/10"
                    onClick={() => navigate(`/?tab=patients&patientId=${activeConv.patientId}`)}
                    title="Vezi pacientul"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/10"
                  onClick={() => window.open(`tel:${activeConv.patientPhone.replace("whatsapp:", "")}`, "_self")}
                  title="Sună"
                >
                  <Phone className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Chat Messages */}
            <div
              className="flex-1 overflow-y-auto px-3 sm:px-6 py-4"
              style={{
                backgroundColor: "hsl(var(--muted) / 0.3)",
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            >
              {groupedMessages.map((group) => (
                <div key={group.date}>
                  {/* Date separator */}
                  <div className="flex justify-center my-3">
                    <span className="bg-card/90 dark:bg-card/70 text-muted-foreground text-[11px] font-medium px-3 py-1 rounded-lg shadow-sm border border-border/50">
                      {formatDateLabel(group.date)}
                    </span>
                  </div>
                  {/* Messages */}
                  {group.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn("flex mb-1.5 group", msg.direction === "outbound" ? "justify-end" : "justify-start")}
                    >
                      <div
                        className={cn(
                          "relative max-w-[85%] sm:max-w-[65%] rounded-lg px-2.5 py-1.5 shadow-sm",
                          msg.direction === "outbound"
                            ? "bg-[#DCF8C6] dark:bg-[#005C4B] text-foreground dark:text-white rounded-tr-none"
                            : "bg-card dark:bg-[#202C33] text-foreground rounded-tl-none border border-border/30"
                        )}
                      >
                        {/* Media */}
                        {msg.media_urls && msg.media_urls.length > 0 && (
                          <div className="mb-1.5 space-y-1.5">
                            {msg.media_urls.map((url, idx) => {
                              const mediaType = msg.media_types?.[idx] || "";
                              return mediaType.startsWith("image/") ? (
                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block">
                                  <img
                                    src={url}
                                    alt={`Media ${idx + 1}`}
                                    className="max-w-full max-h-52 rounded object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                                  />
                                </a>
                              ) : (
                                <FileDownloadButton key={idx} url={url} mediaType={mediaType} />
                              );
                            })}
                          </div>
                        )}

                        {/* Message text */}
                        {msg.message_body && (
                          <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                            {msg.message_body}
                          </p>
                        )}

                        {/* Timestamp + status */}
                        <div className={cn(
                          "flex items-center gap-1 mt-0.5",
                          msg.direction === "outbound" ? "justify-end" : "justify-end"
                        )}>
                          <span className={cn(
                            "text-[10px]",
                            msg.direction === "outbound"
                              ? "text-foreground/50 dark:text-white/50"
                              : "text-muted-foreground"
                          )}>
                            {format(new Date(msg.created_at), "HH:mm")}
                          </span>
                          <MessageStatusIcon status={msg.status} direction={msg.direction} />
                        </div>

                        {/* Delete button on hover */}
                        <button
                          onClick={() => setDeleteConfirmId(msg.id)}
                          className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-card border border-border rounded-full p-1 shadow-sm hover:bg-destructive/10"
                          title="Șterge"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Reply Input */}
            <div className="bg-card border-t border-border px-3 py-2 flex items-end gap-2">
              <Textarea
                ref={textareaRef}
                placeholder="Scrie un mesaj..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                className="resize-none min-h-[40px] max-h-[120px] text-sm rounded-xl bg-muted/50 border-0 focus-visible:ring-1 focus-visible:ring-[#25D366]"
              />
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white flex-shrink-0"
                onClick={handleSendReply}
                disabled={!replyText.trim() || isSending}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          /* Empty state - no conversation selected */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-muted/20">
            <div className="w-20 h-20 rounded-full bg-[#25D366]/10 flex items-center justify-center mb-4">
              <MessageSquare className="h-10 w-10 text-[#25D366]/60" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-1">WhatsApp Inbox</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Selectează o conversație din lista din stânga pentru a vizualiza mesajele
            </p>
            <p className="text-xs text-muted-foreground mt-4">
              {conversations.length} conversații • {unreadCount} necitite
            </p>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
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
    </div>
  );
}
