import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  Loader2,
  FileText,
  Stethoscope,
  MessageSquare,
  CreditCard,
  Banknote,
  AlertCircle,
  ChevronDown,
  Calendar,
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
  
  // Payment dialog
  const [editPaymentOpen, setEditPaymentOpen] = useState(false);
  const [selectedUnpaid, setSelectedUnpaid] = useState<UnpaidAppointment | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);

  useEffect(() => {
    loadAllData();
  }, [patientId]);

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
      // 1. Current dental_status notes
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

      // 2. Dental status history notes
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

      // 3. Tooth data from appointment_treatments (intervention comments)
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

      // Combine and deduplicate
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Tooth Comments */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Observații pe dinți
        </h3>
        {toothComments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nu există observații.</p>
        ) : (
          <div className="space-y-1">
            {Object.entries(commentsByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([dateKey, comments]) => (
                <Collapsible key={dateKey} defaultOpen={false}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between bg-muted/50 hover:bg-muted/70 rounded-lg px-3 py-2 transition-colors cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs font-medium">
                          {dateKey !== 'unknown'
                            ? format(new Date(dateKey), 'd MMMM yyyy', { locale: ro })
                            : 'Dată necunoscută'}{' '}
                          ({comments.length})
                        </span>
                      </div>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="ml-2 mt-1 space-y-1 border-l-2 border-muted pl-3">
                      {comments.map((c, idx) => {
                        const hexColor = c.status ? getStatusHexColor(c.status) : null;
                        return (
                          <div key={idx} className="py-2 flex items-start justify-between gap-2">
                            <div className="flex items-start gap-2 text-sm min-w-0">
                              <span className="text-xs text-muted-foreground font-mono shrink-0">#{c.tooth_number}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {c.status && (
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] px-1.5 py-0"
                                      style={{
                                        backgroundColor: hexColor ? `${hexColor}20` : undefined,
                                        borderColor: hexColor || undefined,
                                        color: hexColor || undefined,
                                      }}
                                    >
                                      {c.status}
                                    </Badge>
                                  )}
                                  {c.treatment_name && (
                                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                      {c.treatment_name}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-foreground/80 mt-0.5">{c.notes}</p>
                              </div>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {c.source === 'intervention' ? 'Intervenție' : 'Status'}
                              {c.doctor_name && ` • Dr. ${c.doctor_name}`}
                            </span>
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

      {/* Section 2: Treatments with observations */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
          <Stethoscope className="h-4 w-4" />
          Tratamente efectuate
        </h3>
        {treatments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nu există tratamente înregistrate.</p>
        ) : (
          <div className="space-y-1">
            {Object.entries(treatmentsByDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([dateKey, entries]) => {
                const totalPrice = entries.reduce((sum, e) => sum + e.price, 0);
                return (
                  <Collapsible key={dateKey} defaultOpen={false}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between bg-muted/50 hover:bg-muted/70 rounded-lg px-3 py-2 transition-colors cursor-pointer">
                        <div className="flex items-center gap-2">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                          <span className="text-xs font-medium">
                            {format(new Date(dateKey), 'd MMMM yyyy', { locale: ro })} ({entries.length})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">{totalPrice} RON</Badge>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="ml-2 mt-1 space-y-1 border-l-2 border-muted pl-3">
                        {entries.map((entry) => {
                          const cleanedNotes = entry.appointment_notes
                            ? cleanDentalNotes(entry.appointment_notes)
                                .replace(/\[Plată:.*?\]/g, '')
                                .replace(/\[Restanță:.*?\]/g, '')
                                .trim()
                            : '';
                          return (
                            <div key={entry.id} className="py-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="text-sm font-medium">{entry.treatment_name}</div>
                                  <div className="text-xs text-muted-foreground">
                                    Ora {entry.start_time.slice(0, 5)}
                                    {entry.duration && ` • ${entry.duration} min`}
                                    {entry.doctor_name && ` • Dr. ${entry.doctor_name}`}
                                    {entry.tooth_numbers && entry.tooth_numbers.length > 0 && (
                                      <> • Dinți: {entry.tooth_numbers.join(', ')}</>
                                    )}
                                  </div>
                                  {cleanedNotes && (
                                    <div className="flex items-start gap-1 mt-1 text-xs text-muted-foreground">
                                      <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                                      <span className="italic">{cleanedNotes}</span>
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-0.5 shrink-0">
                                  {entry.cas > 0 && (
                                    <span className="text-[10px] text-cyan-600">CAS: {entry.cas} RON</span>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {entry.cas > 0 ? `${entry.price - entry.cas} RON` : `${entry.price} RON`}
                                  </Badge>
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

      {/* Section 3: Unpaid Appointments */}
      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          Restanțe de plată
        </h3>
        {unpaidAppointments.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">Nu există restanțe.</p>
        ) : (
          <div className="space-y-2">
            {unpaidAppointments.map((apt) => (
              <div
                key={apt.id}
                className="p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="text-sm font-medium">
                      {format(new Date(apt.appointment_date), 'd MMMM yyyy', { locale: ro })}
                      <span className="text-muted-foreground font-normal"> • {apt.start_time.slice(0, 5)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {apt.treatments.join(', ')}
                      {apt.doctor_name && ` • Dr. ${apt.doctor_name}`}
                    </div>
                    <div className="text-xs space-x-3">
                      <span>Total: <strong>{apt.price.toLocaleString()} RON</strong></span>
                      {apt.paid_amount > 0 && (
                        <span className="text-green-600">Achitat: {apt.paid_amount.toLocaleString()} RON</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
                      Rest: {apt.remaining.toLocaleString()} RON
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1"
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

            {/* Total */}
            <div className="flex items-center justify-between bg-orange-100 dark:bg-orange-950/30 rounded-lg px-4 py-3 mt-2">
              <span className="font-medium text-sm text-orange-700 dark:text-orange-400">Total restanțe</span>
              <Badge className="bg-orange-600 hover:bg-orange-700 text-white font-medium">
                {unpaidAppointments.reduce((sum, a) => sum + a.remaining, 0).toLocaleString()} RON
              </Badge>
            </div>
          </div>
        )}
      </section>

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
}
