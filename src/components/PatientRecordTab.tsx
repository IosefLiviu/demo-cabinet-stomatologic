import { useState, useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  Loader2,
  FileText,
  Stethoscope,
  Banknote,
  AlertCircle,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Maximize2,
  Minimize2,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { cleanDentalNotes } from '@/lib/cleanDentalNotes';
import { toast } from '@/hooks/use-toast';
import { CompleteAppointmentDialog, PaymentData } from './CompleteAppointmentDialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface PatientRecordTabProps {
  patientId: string;
  patientName: string;
}

interface AppointmentTreatment {
  name: string;
  price: number;
  cas: number;
  discount: number;
}

interface AppointmentHistoryEntry {
  id: string;
  appointment_date: string;
  start_time: string;
  status: string;
  doctor_name: string | null;
  treatments: AppointmentTreatment[];
  cancellation_reason: string | null;
  notes: string | null;
}

interface MonthGroup {
  key: string;         // 'yyyy-MM'
  label: string;       // 'Februarie 2026'
  appointments: AppointmentHistoryEntry[];
  completedCount: number;
  cancelledCount: number;
  scheduledCount: number;
  totalRevenue: number;
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

type StatusFilter = 'all' | 'completed' | 'cancelled' | 'scheduled';

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: 'Toate',
  completed: 'Finalizate',
  cancelled: 'Anulate',
  scheduled: 'Programate',
};

// ── Pure helpers (defined outside component — no re-creation on render) ───────

function getNetPrice(apt: AppointmentHistoryEntry): number {
  return apt.treatments.reduce(
    (sum, t) => sum + (t.price - t.cas) * (1 - t.discount / 100),
    0,
  );
}

function getTotalCas(apt: AppointmentHistoryEntry): number {
  return apt.treatments.reduce((sum, t) => sum + t.cas, 0);
}

function aptIsCompleted(apt: AppointmentHistoryEntry): boolean {
  return apt.status === 'completed' || apt.status === 'in_progress';
}

function aptIsCancelled(apt: AppointmentHistoryEntry): boolean {
  return apt.status === 'cancelled' || apt.status === 'no_show';
}

function aptIsScheduled(apt: AppointmentHistoryEntry): boolean {
  return apt.status === 'scheduled' || apt.status === 'confirmed';
}

function cleanNotes(raw: string | null): string {
  if (!raw) return '';
  return cleanDentalNotes(raw)
    .replace(/\[Plată:.*?\]/g, '')
    .replace(/\[Restanță:.*?\]/g, '')
    .trim();
}

// ── Component ─────────────────────────────────────────────────────────────────

export function PatientRecordTab({ patientId, patientName }: PatientRecordTabProps) {
  const [loading, setLoading] = useState(true);
  const [appointmentHistory, setAppointmentHistory] = useState<AppointmentHistoryEntry[]>([]);
  const [unpaidAppointments, setUnpaidAppointments] = useState<UnpaidAppointment[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  // Set of month keys ('yyyy-MM') that are currently expanded
  const [openMonths, setOpenMonths] = useState<Set<string>>(new Set());

  // Payment dialog
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [selectedUnpaid, setSelectedUnpaid] = useState<UnpaidAppointment | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => { loadAllData(); }, [patientId]);

  // Open the most recent month when data first loads
  useEffect(() => {
    if (appointmentHistory.length > 0) {
      const mostRecent = appointmentHistory[0].appointment_date.slice(0, 7);
      setOpenMonths(new Set([mostRecent]));
    }
  }, [appointmentHistory]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && fullscreen) setFullscreen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [fullscreen]);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadAllData = async () => {
    setLoading(true);
    await Promise.all([loadAppointmentHistory(), loadUnpaidAppointments()]);
    setLoading(false);
  };

  const loadAppointmentHistory = async () => {
    try {
      const { data } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          status,
          cancellation_reason,
          notes,
          doctors(name),
          appointment_treatments(treatment_name, price, decont, discount_percent)
        `)
        .eq('patient_id', patientId)
        .not('status', 'eq', 'deleted')
        .order('appointment_date', { ascending: false });

      const history: AppointmentHistoryEntry[] = (data || []).map((apt: any) => ({
        id: apt.id,
        appointment_date: apt.appointment_date,
        start_time: apt.start_time,
        status: apt.status,
        doctor_name: apt.doctors?.name || null,
        treatments: (apt.appointment_treatments || []).map((t: any) => ({
          name: t.treatment_name,
          price: t.price || 0,
          cas: t.decont || 0,
          discount: t.discount_percent || 0,
        })),
        cancellation_reason: apt.cancellation_reason || null,
        notes: apt.notes || null,
      }));

      setAppointmentHistory(history);
    } catch (error) {
      console.error('Error loading appointment history:', error);
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

  const handlePaymentConfirm = async (paymentData: PaymentData) => {
    if (!selectedUnpaid) return;
    setUpdatingPayment(true);
    try {
      const currentPaid = selectedUnpaid.paid_amount;
      const remainingAmount = selectedUnpaid.remaining;

      let amountPayingNow: number;
      if (paymentData.method === 'unpaid') {
        amountPayingNow = 0;
      } else if (paymentData.method === 'partial_card' || paymentData.method === 'partial_cash') {
        amountPayingNow = paymentData.paidAmount ?? 0;
      } else {
        amountPayingNow = remainingAmount;
      }

      const newTotalPaid = currentPaid + amountPayingNow;
      const isFullyPaid = newTotalPaid >= selectedUnpaid.price;

      let storedMethod = paymentData.method;
      if ((storedMethod === 'card' || storedMethod === 'cash') && !isFullyPaid) {
        storedMethod = storedMethod === 'card' ? 'partial_card' : 'partial_cash';
      }

      const { error } = await supabase
        .from('appointments')
        .update({
          paid_amount: newTotalPaid,
          is_paid: isFullyPaid,
          payment_method: storedMethod,
          ...(amountPayingNow > 0 ? {
            debt_paid_at: new Date().toISOString(),
            debt_amount: amountPayingNow,
          } : {}),
        })
        .eq('id', selectedUnpaid.id);

      if (error) throw error;

      toast({
        title: 'Plată actualizată',
        description: isFullyPaid
          ? 'Programarea a fost achitată complet.'
          : `Sumă achitată: ${amountPayingNow.toLocaleString()} RON. Rest: ${(remainingAmount - amountPayingNow).toLocaleString()} RON`,
      });
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

  // ── Stable toggle ───────────────────────────────────────────────────────────

  const toggleMonth = useCallback((key: string) => {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // ── Memoised derivations ────────────────────────────────────────────────────

  // Overall stats always derived from full history (unaffected by filter)
  const completedApts  = useMemo(() => appointmentHistory.filter(aptIsCompleted),  [appointmentHistory]);
  const cancelledApts  = useMemo(() => appointmentHistory.filter(aptIsCancelled),  [appointmentHistory]);
  const scheduledApts  = useMemo(() => appointmentHistory.filter(aptIsScheduled),  [appointmentHistory]);

  const totalTreatments = useMemo(() => completedApts.reduce((s, a) => s + a.treatments.length, 0), [completedApts]);
  const totalSpent      = useMemo(() => completedApts.reduce((s, a) => s + getNetPrice(a), 0), [completedApts]);
  const totalCas        = useMemo(() => completedApts.reduce((s, a) => s + getTotalCas(a), 0), [completedApts]);
  const totalDebt       = useMemo(() => unpaidAppointments.reduce((s, a) => s + a.remaining, 0), [unpaidAppointments]);

  // Filter applied before grouping
  const filteredHistory = useMemo(() =>
    appointmentHistory.filter((apt) => {
      if (statusFilter === 'completed') return aptIsCompleted(apt);
      if (statusFilter === 'cancelled') return aptIsCancelled(apt);
      if (statusFilter === 'scheduled') return aptIsScheduled(apt);
      return true;
    }),
    [appointmentHistory, statusFilter],
  );

  // Group filtered appointments into months (newest month first, newest appt first within)
  const groupedByMonth = useMemo((): MonthGroup[] => {
    const map: Record<string, AppointmentHistoryEntry[]> = {};
    for (const apt of filteredHistory) {
      const key = apt.appointment_date.slice(0, 7); // fast 'yyyy-MM' slice
      if (!map[key]) map[key] = [];
      map[key].push(apt);
    }
    return Object.entries(map)
      .sort(([a], [b]) => b.localeCompare(a)) // newest month first
      .map(([key, apts]) => {
        const [y, m] = key.split('-').map(Number);
        const raw = format(new Date(y, m - 1, 1), 'MMMM yyyy', { locale: ro });
        const label = raw.charAt(0).toUpperCase() + raw.slice(1);
        const completedCount  = apts.filter(aptIsCompleted).length;
        const cancelledCount  = apts.filter(aptIsCancelled).length;
        const scheduledCount  = apts.filter(aptIsScheduled).length;
        const totalRevenue    = apts.filter(aptIsCompleted).reduce((s, a) => s + getNetPrice(a), 0);
        return { key, label, appointments: apts, completedCount, cancelledCount, scheduledCount, totalRevenue };
      });
  }, [filteredHistory]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  const content = (
    <div className={cn('space-y-8', fullscreen && 'h-full overflow-y-auto')}>

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground tracking-tight">{patientName}</h2>
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

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border bg-card/50 p-4 space-y-2 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Tratamente</span>
          </div>
          <p className="text-2xl font-bold text-foreground pl-10">{totalTreatments}</p>
        </div>

        <div className="rounded-2xl border bg-card/50 p-4 space-y-2 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total</span>
          </div>
          <p className="text-2xl font-bold text-foreground pl-10">
            {totalSpent.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">RON</span>
          </p>
        </div>

        <div className="rounded-2xl border bg-card/50 p-4 space-y-2 hover:shadow-sm transition-shadow">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-100 dark:bg-cyan-900/30">
              <Badge variant="outline" className="h-4 w-4 p-0 flex items-center justify-center text-[8px] border-cyan-500 text-cyan-600">C</Badge>
            </div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-cyan-600">CAS</span>
          </div>
          <p className="text-2xl font-bold text-cyan-600 pl-10">
            {totalCas.toLocaleString()} <span className="text-sm font-normal opacity-70">RON</span>
          </p>
        </div>

        <div className={cn(
          'rounded-2xl border p-4 space-y-2 hover:shadow-sm transition-shadow',
          totalDebt > 0 ? 'border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/10' : 'bg-card/50',
        )}>
          <div className="flex items-center gap-2">
            <div className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl',
              totalDebt > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-muted',
            )}>
              <AlertCircle className={cn('h-4 w-4', totalDebt > 0 ? 'text-orange-500' : 'text-muted-foreground')} />
            </div>
            <span className={cn('text-[11px] font-medium uppercase tracking-wider', totalDebt > 0 ? 'text-orange-600' : 'text-muted-foreground')}>
              Restanțe
            </span>
          </div>
          <p className={cn('text-2xl font-bold pl-10', totalDebt > 0 ? 'text-orange-600' : 'text-muted-foreground')}>
            {totalDebt > 0 ? totalDebt.toLocaleString() : '0'} <span className="text-sm font-normal opacity-70">RON</span>
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className={cn('grid gap-6', fullscreen ? 'md:grid-cols-2' : 'grid-cols-1')}>

        {/* ── Appointment history ─────────────────────────────────────────── */}
        <section className="space-y-4">

          {/* Section header */}
          <div className="flex items-center gap-3 pb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Istoricul programărilor</h3>
            <Badge variant="secondary" className="text-[10px] ml-auto rounded-full">
              {appointmentHistory.length}
            </Badge>
          </div>

          {/* Status summary badges (always based on full history) */}
          <div className="flex flex-wrap gap-2">
            <div className="inline-flex items-center gap-1.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-full px-3 py-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
              <span className="text-xs font-medium text-green-700 dark:text-green-400">{completedApts.length} finalizate</span>
              <span className="text-xs font-bold text-green-700 dark:text-green-400">{totalSpent.toLocaleString()} RON</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-full px-3 py-1.5">
              <XCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-medium text-red-600 dark:text-red-400">{cancelledApts.length} anulate</span>
            </div>
            {scheduledApts.length > 0 && (
              <div className="inline-flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-full px-3 py-1.5">
                <Clock className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-xs font-medium text-blue-600 dark:text-blue-400">{scheduledApts.length} programate</span>
              </div>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 flex-wrap">
            {(['all', 'completed', 'cancelled', 'scheduled'] as StatusFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={cn(
                  'text-[11px] px-3 py-1 rounded-full transition-colors',
                  statusFilter === f
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                )}
              >
                {FILTER_LABELS[f]}
              </button>
            ))}
          </div>

          {/* Month groups */}
          {groupedByMonth.length === 0 ? (
            <div className="text-center py-10 rounded-2xl border border-dashed">
              <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nu există programări pentru filtrul selectat.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {groupedByMonth.map((group) => (
                <Collapsible
                  key={group.key}
                  open={openMonths.has(group.key)}
                  onOpenChange={() => toggleMonth(group.key)}
                >
                  {/* Month header trigger */}
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between rounded-xl px-4 py-3 bg-muted/40 hover:bg-muted/60 transition-colors group border border-transparent hover:border-border">
                      <div className="flex items-center gap-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-90" />
                        <span className="text-sm font-semibold text-foreground">{group.label}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-full">
                          {group.appointments.length}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.completedCount > 0 && (
                          <span className="text-[10px] font-medium text-green-600 bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full">
                            {group.completedCount} fin.
                          </span>
                        )}
                        {group.cancelledCount > 0 && (
                          <span className="text-[10px] font-medium text-red-500 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
                            {group.cancelledCount} ann.
                          </span>
                        )}
                        {group.scheduledCount > 0 && (
                          <span className="text-[10px] font-medium text-blue-500 bg-blue-50 dark:bg-blue-950/30 px-2 py-0.5 rounded-full">
                            {group.scheduledCount} prog.
                          </span>
                        )}
                        {group.totalRevenue > 0 && (
                          <span className="text-xs font-semibold text-foreground ml-1">
                            {group.totalRevenue.toLocaleString()} RON
                          </span>
                        )}
                      </div>
                    </button>
                  </CollapsibleTrigger>

                  {/* Appointment rows */}
                  <CollapsibleContent>
                    <div className="mt-1.5 ml-4 pl-4 border-l-2 border-muted space-y-1.5 pb-2">
                      {group.appointments.map((apt) => {
                        const netPrice       = getNetPrice(apt);
                        const treatmentLabel = apt.treatments.length > 0
                          ? apt.treatments.map((t) => t.name).join(', ')
                          : 'N/A';
                        const completed = aptIsCompleted(apt);
                        const cancelled = aptIsCancelled(apt);
                        const scheduled = aptIsScheduled(apt);
                        const comment   = cleanNotes(apt.notes);

                        return (
                          <div
                            key={apt.id}
                            className={cn(
                              'rounded-xl px-4 py-3 transition-colors',
                              completed && 'bg-green-50/40 dark:bg-green-950/10 hover:bg-green-50/60',
                              cancelled && 'bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30',
                              scheduled && 'bg-muted/30 hover:bg-muted/50 border border-transparent',
                            )}
                          >
                            <div className="flex items-start gap-3">
                              {/* Status icon */}
                              <div className="mt-0.5 shrink-0">
                                {completed && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                {cancelled && <XCircle className="h-4 w-4 text-red-500" />}
                                {scheduled && <Clock className="h-4 w-4 text-blue-400" />}
                              </div>

                              {/* Info block */}
                              <div className="flex-1 min-w-0">
                                {/* First line: date · treatment · doctor */}
                                <div className="flex items-center gap-x-2 flex-wrap text-sm">
                                  <span className="font-medium">
                                    {format(new Date(apt.appointment_date), 'd MMM yyyy', { locale: ro })}
                                  </span>
                                  {apt.start_time && (
                                    <span className="text-muted-foreground text-[11px]">
                                      {apt.start_time.slice(0, 5)}
                                    </span>
                                  )}
                                  <span className="text-muted-foreground/40">·</span>
                                  <span className={cn('truncate', cancelled ? 'text-muted-foreground' : 'text-foreground')}>
                                    {treatmentLabel}
                                  </span>
                                  {apt.doctor_name && (
                                    <>
                                      <span className="text-muted-foreground/40">·</span>
                                      <span className="text-primary/80 shrink-0">Dr. {apt.doctor_name}</span>
                                    </>
                                  )}
                                </div>

                                {/* Cancellation reason */}
                                {cancelled && apt.cancellation_reason && (
                                  <p className="text-[11px] text-red-600 dark:text-red-400 mt-0.5 font-medium">
                                    Motiv anulare: {apt.cancellation_reason}
                                  </p>
                                )}

                                {/* Comment */}
                                {comment && (
                                  <div className="flex items-start gap-1.5 mt-1">
                                    <MessageSquare className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/50" />
                                    <span className="text-[11px] text-muted-foreground italic">{comment}</span>
                                  </div>
                                )}
                              </div>

                              {/* Price */}
                              <span className={cn(
                                'text-sm font-semibold shrink-0 mt-0.5',
                                cancelled ? 'text-muted-foreground' : 'text-foreground',
                              )}>
                                {netPrice.toLocaleString()} RON
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          )}
        </section>

        {/* ── Restanțe de plată ────────────────────────────────────────────── */}
        <div className="space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-3 pb-3">
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl',
                unpaidAppointments.length > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-muted',
              )}>
                <AlertCircle className={cn('h-4 w-4', unpaidAppointments.length > 0 ? 'text-orange-500' : 'text-muted-foreground')} />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Restanțe de plată</h3>
              {unpaidAppointments.length > 0 && (
                <Badge className="bg-orange-500 text-white text-[10px] ml-auto rounded-full">
                  {unpaidAppointments.length}
                </Badge>
              )}
            </div>

            {unpaidAppointments.length === 0 ? (
              <div className="text-center py-8 rounded-2xl border border-dashed">
                <div className="inline-flex items-center gap-2 text-sm text-green-600 bg-green-50 dark:bg-green-950/20 rounded-full px-5 py-2.5">
                  <span>✓</span> Fără restanțe
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {unpaidAppointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-2xl border border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/10 hover:border-orange-300 dark:hover:border-orange-700 transition-all hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 min-w-0">
                        <div className="text-sm font-medium">
                          {format(new Date(apt.appointment_date), 'd MMM yyyy', { locale: ro })}
                          <span className="text-muted-foreground font-normal"> · {apt.start_time.slice(0, 5)}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {apt.treatments.join(', ')}
                          {apt.doctor_name && ` · Dr. ${apt.doctor_name}`}
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
                          onClick={() => { setSelectedUnpaid(apt); setEditPaymentOpen(true); }}
                        >
                          <Banknote className="h-3 w-3" />
                          Achită
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between bg-orange-100 dark:bg-orange-950/30 rounded-2xl px-5 py-3.5 mt-3">
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

      {/* Payment dialog */}
      {selectedUnpaid && (
        <CompleteAppointmentDialog
          open={editPaymentOpen}
          onOpenChange={(open) => {
            setEditPaymentOpen(open);
            if (!open) setSelectedUnpaid(null);
          }}
          onConfirm={handlePaymentConfirm}
          patientName={patientName}
          totalPrice={selectedUnpaid.price}
          payableAmount={selectedUnpaid.remaining}
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
