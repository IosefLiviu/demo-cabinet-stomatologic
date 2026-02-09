import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Search, Calendar, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Appointment } from "@/types/appointment";

interface AppointmentSearchProps {
  appointments: Appointment[];
  onAppointmentSelect: (date: Date, appointmentId: string) => void;
}

export function AppointmentSearch({ appointments, onAppointmentSelect }: AppointmentSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAppointments = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const searchWords = searchQuery.toLowerCase().trim().split(/\s+/);
    
    return appointments
      .filter((apt) => {
        const patientName = apt.patientName.toLowerCase();
        // Word-order agnostic search - each word must match
        return searchWords.every(word => patientName.includes(word));
      })
      .sort((a, b) => {
        // Sort by date descending (most recent first)
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 50); // Limit results
  }, [appointments, searchQuery]);

  const handleSelect = (apt: Appointment) => {
    const date = new Date(apt.date);
    onAppointmentSelect(date, apt.id);
    setOpen(false);
    setSearchQuery("");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Finalizată</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Anulată</Badge>;
      case "scheduled":
      default:
        return <Badge variant="secondary">Programată</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" size="sm">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Căutare programare</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Căutare programare</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Caută după numele pacientului..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {searchQuery.trim() && (
            <ScrollArea className="h-[400px]">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nu s-au găsit programări pentru "{searchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-2 pr-4">
                  {filteredAppointments.map((apt) => (
                    <button
                      key={apt.id}
                      onClick={() => handleSelect(apt)}
                      className="w-full text-left p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">{apt.patientName}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(apt.date), "d MMMM yyyy", { locale: ro })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{apt.time}</span>
                            </div>
                          </div>
                          {apt.treatment && (
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {apt.treatment}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">
                          {getStatusBadge(apt.status)}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          {!searchQuery.trim() && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Introduceți numele pacientului pentru a căuta programări</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
