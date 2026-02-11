import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  Loader2,
  FileText,
  Stethoscope,
  MessageSquare,
  Banknote,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Calendar,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { cleanDentalNotes } from '@/lib/cleanDentalNotes';
import { STATUS_ENUM_TO_NAME, getStatusHexColor } from '@/constants/toothStatuses';
import { EditPaymentDialog } from './EditPaymentDialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface PatientRecordTabProps {
  patientId: string;
  patientName: string;
}

interface ToothComment {
  tooth_number: number;
  notes: string;
  source: 'dental_status' | 'intervention';
  date: string;
  status?: string;
  treatment_name?: string;
  doctor_name?: string;
}

interface TreatmentEntry {
  id: string;
  appointment_id: string;
  treatment_name: string;
  price: number;
  cas: number;
  tooth_numbers: number[] | null;
  duration: number | null;
  appointment_date: string;
  start_time: string;
  doctor_name: string | null;
  appointment_notes: string | null;
}

interface UnpaidAppointment {
  id: string;
  appointment_date: string;
  start_time: string;
  price: number;
  paid_amount: number;
  payment_method: string | null;
  doctor_name: string | null;
  treatments: string[];
  remaining: number;
}

export function PatientRecordTab({ patientId, patientName }: PatientRecordTabProps) {
  const [loading, setLoading] = useState(true);
  const [toothComments, setToothComments] = useState<ToothComment[]>([]);
  const [treatments, setTreatments] = useState<TreatmentEntry[]>([]);
  const [unpaidAppointments, setUnpaidAppointments] = useState<UnpaidAppointment[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  
  // Payment dialog
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [selectedUnpaid, setSelectedUnpaid] = useState<UnpaidAppointment | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [patientId]);

  // Close fullscreen on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) setFullscreen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fullscreen]);

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([
      loadToothComments(),
      loadTreatments(),
      loadUnpaidAppointments(),
    ]);
    setLoading(false);
  };

  const loadToothComments = async () => {
    try {
      const { data: statusData } = await supabase
        .from('dental_status')
        .select('tooth_number, status, notes, updated_at')
        .eq('patient_id', patientId)
        .not('notes', 'is', null);

      const statusComments: ToothComment[] = (statusData || [])
        .filter(d => d.notes && d.notes.trim())
        .map(d => ({
          tooth_number: d.tooth_number,
          notes: d.notes!,
          source: 'dental_status' as const,
          date: d.updated_at,
          status: STATUS_ENUM_TO_NAME[d.status] || d.status,
        }));

      const { data: historyData } = await supabase
        .from('dental_status_history')
        .select('tooth_number, new_status, notes, changed_at, changed_by')
        .eq('patient_id', patientId)
        .not('notes', 'is', null)
        .order('changed_at', { ascending: false });

      const historyComments: ToothComment[] = (historyData || [])
        .filter(d => d.notes && d.notes.trim())
        .map(d => ({
          tooth_number: d.tooth_number,
          notes: d.notes!,
          source: 'dental_status' as const,
          date: d.changed_at,
          status: STATUS_ENUM_TO_NAME[d.new_status] || d.new_status,
        }));

      const { data: interventionData } = await supabase
        .from('appointment_treatments')
        .select(`
          treatment_name,
          tooth_data,
          tooth_numbers,
          appointments!inner(appointment_date, status, doctors(name))
        `)
        .eq('appointments.patient_id', patientId)
        .eq('appointments.status', 'completed');

      const interventionComments: ToothComment[] = [];
      (interventionData || []).forEach((t: any) => {
        const toothData = t.tooth_data as any[] || [];
        toothData.forEach((td: any) => {
          if (td.notes && td.notes.trim()) {
            interventionComments.push({
              tooth_number: td.toothNumber,
              notes: td.notes,
              source: 'intervention',
              date: t.appointments?.appointment_date || '',
              treatment_name: t.treatment_name,
              doctor_name: t.appointments?.doctors?.name || null,
            });
          }
        });
      });

      const all = [...statusComments, ...historyComments, ...interventionComments];
      setToothComments(all);
    } catch (error) {
      console.error('Error loading tooth comments:', error);
    }
  };

  const loadTreatments = async () => {
    try {
      const { data } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          notes,
          doctors(name),
          appointment_treatments(id, treatment_name, price, decont, tooth_numbers, duration)
        `)
        .eq('patient_id', patientId)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false });

      const records: TreatmentEntry[] = [];
      (data || []).forEach((apt: any) => {
        (apt.appointment_treatments || []).forEach((t: any) => {
          records.push({
            id: t.id,
            appointment_id: apt.id,
            treatment_name: t.treatment_name,
            price: t.price || 0,
            cas: t.decont || 0,
            tooth_numbers: t.tooth_numbers,
            duration: t.duration,
            appointment_date: apt.appointment_date,
            start_time: apt.start_time,
            doctor_name: apt.doctors?.name || null,
            appointment_notes: apt.notes || null,
          });
        });
      });
      setTreatments(records);
    } catch (error) {
      console.error('Error loading treatments:', error);
    }
  };

  const loadUnpaidAppointments = async () => {
    try {
      const { data } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          price,
          paid_amount,
          payment_method,
          doctors(name),
          appointment_treatments(treatment_name, price, decont, discount_percent)
        `)
        .eq('patient_id', patientId)
        .eq('status', 'completed')
        .order('appointment_date', { ascending: false });

      const unpaid: UnpaidAppointment[] = [];
      (data || []).forEach((apt: any) => {
        const totalPayable = (apt.appointment_treatments || []).reduce((sum: number, t: any) => {
          const p = t.price || 0;
          const cas = t.decont || 0;
          const disc = t.discount_percent || 0;
          return sum + (p - cas) * (1 - disc / 100);
        }, 0);
        const paidAmount = apt.paid_amount || 0;
        const remaining = Math.max(0, totalPayable - paidAmount);

        if (remaining > 0) {
          unpaid.push({
            id: apt.id,
            appointment_date: apt.appointment_date,
            start_time: apt.start_time,
            price: totalPayable,
            paid_amount: paidAmount,
            payment_method: apt.payment_method,
            doctor_name: apt.doctors?.name || null,
            treatments: (apt.appointment_treatments || []).map((t: any) => t.treatment_name),
            remaining,
          });
        }
      });
      setUnpaidAppointments(unpaid);
    } catch (error) {
      console.error('Error loading unpaid appointments:', error);
    }
  };

  const handlePaymentConfirm = async (newPaidAmount: number) => {
    if (!selectedUnpaid) return;
    setUpdatingPayment(true);
    try {
      const isFullyPaid = newPaidAmount >= selectedUnpaid.price;
      const paymentMethod = isFullyPaid ? 'cash' : 'partial_cash';

      const { error } = await supabase
        .from('appointments')
        .update({
          paid_amount: newPaidAmount,
          is_paid: isFullyPaid,
          payment_method: paymentMethod,
          ...(isFullyPaid ? { debt_paid_at: new Date().toISOString(), debt_amount: selectedUnpaid.price } : {}),
        })
        .eq('id', selectedUnpaid.id);

      if (error) throw error;

      toast({ title: 'Plată actualizată', description: isFullyPaid ? 'Programarea a fost achitată complet.' : `Sumă achitată: ${newPaidAmount} RON` });
      setEditPaymentOpen(false);
      setSelectedUnpaid(null);
      await loadUnpaidAppointments();
    } catch (error) {
      console.error('Error updating payment:', error);
      toast({ title: 'Eroare', description: 'Nu s-a putut actualiza plata.', variant: 'destructive' });
    } finally {
      setUpdatingPayment(false);
    }
  };

  // Group tooth comments by date
  const commentsByDate = toothComments.reduce((acc, c) => {
    const dateKey = c.date ? format(new Date(c.date), 'yyyy-MM-dd') : 'unknown';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(c);
    return acc;
  }, {} as Record<string, ToothComment[]>);

  // Group treatments by date
  const treatmentsByDate = treatments.reduce((acc, t) => {
    const dateKey = t.appointment_date;
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(t);
    return acc;
  }, {} as Record<string, TreatmentEntry[]>);

  // Stats
  const totalTreatments = treatments.length;
  const totalSpent = treatments.reduce((s, t) => s + t.price, 0);
  const totalCas = treatments.reduce((s, t) => s + t.cas, 0);
  const totalDebt = unpaidAppointments.reduce((s, a) => s + a.remaining, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  const content = (
    <div className={cn(
      "space-y-6",
      fullscreen && "h-full overflow-y-auto"
    )}>
      {/* Header with patient name and fullscreen toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">{patientName}</h2>
          <p className="text-xs text-muted-foreground">Fișă pacient consolidată</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setFullscreen(!fullscreen)}
          title={fullscreen ? 'Ieși din ecran complet' : 'Ecran complet'}
        >
          {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="rounded-xl border bg-card p-3 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Stethoscope className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium uppercase tracking-wide">Tratamente</span>
          </div>
          <p className="text-xl font-bold text-foreground">{totalTreatments}</p>
        </div>
        <div className="rounded-xl border bg-card p-3 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium uppercase tracking-wide">Total</span>
          </div>
          <p className="text-xl font-bold text-foreground">{totalSpent.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">RON</span></p>
        </div>
        <div className="rounded-xl border bg-card p-3 space-y-1">
          <div className="flex items-center gap-2 text-cyan-600">
            <Badge variant="outline" className="h-4 w-4 p-0 flex items-center justify-center text-[8px] border-cyan-500 text-cyan-600">C</Badge>
            <span className="text-[11px] font-medium uppercase tracking-wide">CAS</span>
          </div>
          <p className="text-xl font-bold text-cyan-600">{totalCas.toLocaleString()} <span className="text-sm font-normal opacity-70">RON</span></p>
        </div>
        <div className={cn(
          "rounded-xl border p-3 space-y-1",
          totalDebt > 0 ? "border-orange-300 dark:border-orange-700 bg-orange-50/50 dark:bg-orange-950/20" : "bg-card"
        )}>
          <div className="flex items-center gap-2 text-orange-600">
            <AlertCircle className="h-3.5 w-3.5" />
            <span className="text-[11px] font-medium uppercase tracking-wide">Restanțe</span>
          </div>
          <p className={cn("text-xl font-bold", totalDebt > 0 ? "text-orange-600" : "text-muted-foreground")}>
            {totalDebt > 0 ? totalDebt.toLocaleString() : '0'} <span className="text-sm font-normal opacity-70">RON</span>
          </p>
        </div>
      </div>

      {/* Main Content - 2 column layout on larger screens */}
      <div className={cn(
        "grid gap-6",
        fullscreen ? "md:grid-cols-2" : "grid-cols-1"
      )}>
        {/* Left Column: Treatments */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b">
            <Stethoscope className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Tratamente efectuate</h3>
            <Badge variant="secondary" className="text-[10px] ml-auto">{treatments.length}</Badge>
          </div>
          {treatments.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Nu există tratamente înregistrate.</p>
          ) : (
            <div className="space-y-1">
              {Object.entries(treatmentsByDate)
                .sort(([a], [b]) => b.localeCompare(a))
                .map(([dateKey, entries]) => {
                  const totalPrice = entries.reduce((sum, e) => sum + e.price, 0);
                  const totalDateCas = entries.reduce((sum, e) => sum + e.cas, 0);
                  return (
                    <Collapsible key={dateKey} defaultOpen={false}>
                      <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center justify-between bg-muted/40 hover:bg-muted/70 rounded-lg px-3 py-2.5 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-90" />
                            <Calendar className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium">
                              {format(new Date(dateKey), 'd MMM yyyy', { locale: ro })}
                            </span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{entries.length}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {totalDateCas > 0 && (
                              <span className="text-[10px] text-cyan-600 font-medium">CAS {totalDateCas}</span>
                            )}
                            <Badge className="bg-primary/10 text-primary hover:bg-primary/20 text-xs border-0">
                              {totalPrice.toLocaleString()} RON
                            </Badge>
                          </div>
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-primary/20 pl-3 pb-2">
                          {entries.map((entry) => {
                            const cleanedNotes = entry.appointment_notes
                              ? cleanDentalNotes(entry.appointment_notes)
                                  .replace(/\[Plată:.*?\]/g, '')
                                  .replace(/\[Restanță:.*?\]/g, '')
                                  .trim()
                              : '';
                            return (
                              <div key={entry.id} className="py-2 hover:bg-muted/30 rounded px-2 -mx-2 transition-colors">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="space-y-0.5 min-w-0">
                                    <div className="text-sm font-medium text-foreground">{entry.treatment_name}</div>
                                    <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                      <span>{entry.start_time.slice(0, 5)}</span>
                                      {entry.duration && <span>{entry.duration} min</span>}
                                      {entry.doctor_name && <span>Dr. {entry.doctor_name}</span>}
                                      {entry.tooth_numbers && entry.tooth_numbers.length > 0 && (
                                        <span className="font-mono">#{entry.tooth_numbers.join(', ')}</span>
                                      )}
                                    </div>
                                    {cleanedNotes && (
                                      <div className="flex items-start gap-1 mt-1">
                                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/50" />
                                        <span className="text-[11px] text-muted-foreground italic">{cleanedNotes}</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                                    {entry.cas > 0 && (
                                      <span className="text-[10px] text-cyan-600 font-medium">CAS: {entry.cas}</span>
                                    )}
                                    <span className="text-xs font-semibold text-foreground">
                                      {entry.cas > 0 ? `${entry.price - entry.cas}` : entry.price} RON
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
            </div>
          )}
        </section>

        <div className="space-y-6">

          {/* Unpaid Appointments */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-orange-200 dark:border-orange-800">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <h3 className="text-sm font-semibold text-foreground">Restanțe de plată</h3>
              {unpaidAppointments.length > 0 && (
                <Badge className="bg-orange-500 text-white text-[10px] ml-auto">{unpaidAppointments.length}</Badge>
              )}
            </div>
            {unpaidAppointments.length === 0 ? (
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 rounded-full px-4 py-2">
                  <span>✓</span> Fără restanțe
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {unpaidAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20 hover:border-orange-300 dark:hover:border-orange-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="text-sm font-medium">
                          {format(new Date(apt.appointment_date), 'd MMM yyyy', { locale: ro })}
                          <span className="text-muted-foreground font-normal"> • {apt.start_time.slice(0, 5)}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {apt.treatments.join(', ')}
                          {apt.doctor_name && ` • Dr. ${apt.doctor_name}`}
                        </div>
                        <div className="text-[11px] space-x-3">
                          <span>Total: <strong>{apt.price.toLocaleString()} RON</strong></span>
                          {apt.paid_amount > 0 && (
                            <span className="text-green-600">Achitat: {apt.paid_amount.toLocaleString()} RON</span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-xs">
                          {apt.remaining.toLocaleString()} RON
                        </Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs gap-1 border-orange-300 hover:bg-orange-100 dark:border-orange-700 dark:hover:bg-orange-900/30"
                          onClick={() => {
                            setSelectedUnpaid(apt);
                            setEditPaymentOpen(true);
                          }}
                        >
                          <Banknote className="h-3 w-3" />
                          Achită
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between bg-orange-100 dark:bg-orange-950/30 rounded-xl px-4 py-3 mt-2">
                  <span className="font-medium text-sm text-orange-700 dark:text-orange-400">Total restanțe</span>
                  <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm px-3">
                    {totalDebt.toLocaleString()} RON
                  </Badge>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Payment Dialog */}
      {selectedUnpaid && (
        <EditPaymentDialog
          open={editPaymentOpen}
          onOpenChange={(open) => {
            setEditPaymentOpen(open);
            if (!open) setSelectedUnpaid(null);
          }}
          onConfirm={handlePaymentConfirm}
          patientName={patientName}
          totalPrice={selectedUnpaid.price}
          currentPaidAmount={selectedUnpaid.paid_amount}
          isLoading={updatingPayment}
        />
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
