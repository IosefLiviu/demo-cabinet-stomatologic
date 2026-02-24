import { useState, useEffect, useCallback } from "react";
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
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  appointment_date: string;
  start_time: string;
  status: string;
  cabinet_id: number;
  doctor_id: string | null;
  patient_name: string;
  treatment_names: string[];
}

interface AppointmentSearchProps {
  onAppointmentSelect: (date: Date, appointmentId: string, cabinetId: number, doctorId?: string) => void;
}

export function AppointmentSearch({ onAppointmentSelect }: AppointmentSearchProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const searchAppointments = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      // Split search into words for flexible matching
      const words = query.trim().toLowerCase().split(/\s+/);

      // Build ilike filters for patient name matching (first_name, last_name)
      // We search where the concatenated name matches all words
      let dbQuery = supabase
        .from('appointments')
        .select(`
          id, appointment_date, start_time, status, cabinet_id, doctor_id,
          patients!inner (first_name, last_name),
          appointment_treatments (treatment_name)
        `)
        .neq('status', 'deleted')
        .order('appointment_date', { ascending: false })
        .order('start_time', { ascending: false })
        .limit(50);

      // For each word, add an or filter matching first_name or last_name
      for (const word of words) {
        const pattern = `%${word}%`;
        dbQuery = dbQuery.or(`first_name.ilike.${pattern},last_name.ilike.${pattern}`, { referencedTable: 'patients' });
      }

      const { data, error } = await dbQuery;

      if (error) {
        console.error('Search error:', error);
        setResults([]);
        return;
      }

      // Post-filter: ensure ALL words match the full name
      const mapped: SearchResult[] = (data || [])
        .map((apt: any) => {
          const fullName = `${apt.patients?.first_name || ''} ${apt.patients?.last_name || ''}`.trim();
          return {
            id: apt.id,
            appointment_date: apt.appointment_date,
            start_time: apt.start_time,
            status: apt.status,
            cabinet_id: apt.cabinet_id,
            doctor_id: apt.doctor_id,
            patient_name: fullName,
            treatment_names: (apt.appointment_treatments || []).map((t: any) => t.treatment_name),
          };
        })
        .filter((r: SearchResult) => {
          const nameLower = r.patient_name.toLowerCase();
          return words.every(w => nameLower.includes(w));
        });

      setResults(mapped);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchAppointments(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, searchAppointments]);

  const handleSelect = (apt: SearchResult) => {
    const date = new Date(apt.appointment_date);
    onAppointmentSelect(date, apt.id, apt.cabinet_id, apt.doctor_id || undefined);
    setOpen(false);
    setSearchQuery("");
    setResults([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-500">Finalizată</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Anulată</Badge>;
      case "confirmed":
        return <Badge variant="secondary">Confirmată</Badge>;
      case "in_progress":
        return <Badge variant="default" className="bg-blue-500">În curs</Badge>;
      case "no_show":
        return <Badge variant="destructive">Neprezentare</Badge>;
      case "scheduled":
      default:
        return <Badge variant="secondary">Programată</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setSearchQuery(""); setResults([]); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" size="sm">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Căutare programare</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] bg-card border-border">
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
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Se caută...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nu s-au găsit programări pentru "{searchQuery}"</p>
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {results.map((apt) => (
                    <button
                      key={apt.id}
                      onClick={() => handleSelect(apt)}
                      className="w-full text-left p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span className="font-medium truncate">{apt.patient_name}</span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span>{format(new Date(apt.appointment_date), "d MMMM yyyy", { locale: ro })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5 shrink-0" />
                              <span>{apt.start_time?.substring(0, 5)}</span>
                            </div>
                          </div>
                          {apt.treatment_names.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {apt.treatment_names.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 mt-0.5">
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
