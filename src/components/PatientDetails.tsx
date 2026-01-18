import { useState, useEffect } from 'react';
import { format, subDays, subMonths, subYears, isAfter } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  Pill,
  Heart,
  User,
  FileText,
  Edit,
  Loader2,
  Stethoscope,
  Filter,
  ChevronDown,
  CreditCard,
  Banknote,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Patient } from '@/hooks/usePatients';
import { supabase } from '@/integrations/supabase/client';
import { MiniDentalChart, ToothData } from './MiniDentalChart';

interface ToothDataRecord {
  toothNumber: number;
  status: string;
  notes?: string;
}

interface TreatmentRecord {
  id: string;
  appointment_id: string;
  treatment_name: string;
  price: number | null;
  cas: number | null;
  tooth_numbers: number[] | null;
  tooth_data: ToothDataRecord[];
  duration: number | null;
  appointment_date: string;
  start_time: string;
  payment_method: 'card' | 'cash' | 'unpaid' | 'partial_card' | 'partial_cash' | null;
  paid_amount: number | null;
  total_price: number | null;
  doctor_name: string | null;
}

type PaymentMethod = 'card' | 'cash' | 'unpaid' | 'partial_card' | 'partial_cash';

interface PatientDetailsProps {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
}

type PeriodFilter = 'all' | '30days' | '3months' | '1year';

export function PatientDetails({ patient, open, onClose, onEdit }: PatientDetailsProps) {
  const [treatmentHistory, setTreatmentHistory] = useState<TreatmentRecord[]>([]);
  const [dentalStatus, setDentalStatus] = useState<ToothData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  
  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);

  const getFilteredHistory = () => {
    if (periodFilter === 'all') return treatmentHistory;
    
    const now = new Date();
    let cutoffDate: Date;
    
    switch (periodFilter) {
      case '30days':
        cutoffDate = subDays(now, 30);
        break;
      case '3months':
        cutoffDate = subMonths(now, 3);
        break;
      case '1year':
        cutoffDate = subYears(now, 1);
        break;
      default:
        return treatmentHistory;
    }
    
    return treatmentHistory.filter(record => 
      isAfter(new Date(record.appointment_date), cutoffDate)
    );
  };

  const filteredHistory = getFilteredHistory();

  useEffect(() => {
    if (patient && open) {
      fetchTreatmentHistory();
      fetchDentalStatus();
    }
  }, [patient, open]);

  const fetchDentalStatus = async () => {
    if (!patient) return;

    const { data, error } = await supabase
      .from('dental_status')
      .select('tooth_number, status, notes')
      .eq('patient_id', patient.id);

    if (error) {
      console.error('Error fetching dental status:', error);
      return;
    }

    setDentalStatus((data || []).map(d => ({
      tooth_number: d.tooth_number,
      status: d.status as ToothData['status'],
      notes: d.notes || undefined,
    })));
  };

  const fetchTreatmentHistory = async () => {
    if (!patient) return;
    setLoadingHistory(true);

    // Fetch from appointment_treatments joined with appointments - ONLY completed appointments
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        status,
        is_paid,
        notes,
        price,
        paid_amount,
        payment_method,
        doctors (
          id,
          name
        ),
        appointment_treatments (
          id,
          treatment_name,
          price,
          decont,
          tooth_numbers,
          tooth_data,
          duration
        )
      `)
      .eq('patient_id', patient.id)
      .eq('status', 'completed')
      .order('appointment_date', { ascending: false });

    if (error) {
      console.error('Error fetching treatment history:', error);
      setTreatmentHistory([]);
    } else {
      // Flatten the data
      const records: TreatmentRecord[] = [];
      data?.forEach((appointment: any) => {
        // Use payment_method column first, fallback to notes parsing
        let paymentMethod: PaymentMethod | null = appointment.payment_method || null;
        
        // Fallback to notes parsing for old data
        if (!paymentMethod && appointment.notes) {
          if (appointment.notes.includes('[Plată: Card]')) {
            paymentMethod = 'card';
          } else if (appointment.notes.includes('[Plată: Cash]')) {
            paymentMethod = 'cash';
          } else if (appointment.notes.includes('[Plată: Neachitat]')) {
            paymentMethod = 'unpaid';
          } else if (appointment.notes.includes('[Plată: Parțial Card')) {
            paymentMethod = 'partial_card';
          } else if (appointment.notes.includes('[Plată: Parțial Cash')) {
            paymentMethod = 'partial_cash';
          }
        }
        // Fallback to is_paid if no explicit payment method
        if (!paymentMethod && appointment.is_paid !== null) {
          paymentMethod = appointment.is_paid ? 'cash' : 'unpaid';
        }

        const doctorName = appointment.doctors?.name || null;
        const appointmentPrice = appointment.price || 0;
        const paidAmount = appointment.paid_amount ?? (appointment.is_paid ? appointmentPrice : 0);

        appointment.appointment_treatments?.forEach((treatment: any) => {
          records.push({
            id: treatment.id,
            appointment_id: appointment.id,
            treatment_name: treatment.treatment_name,
            price: treatment.price,
            cas: treatment.decont || 0,
            tooth_numbers: treatment.tooth_numbers,
            tooth_data: (treatment.tooth_data || []) as ToothDataRecord[],
            duration: treatment.duration,
            appointment_date: appointment.appointment_date,
            start_time: appointment.start_time,
            payment_method: paymentMethod,
            paid_amount: paidAmount,
            total_price: appointmentPrice,
            doctor_name: doctorName,
          });
        });
      });
      setTreatmentHistory(records);
    }
    setLoadingHistory(false);
  };

  const handleMarkAsPaid = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async (method: 'card' | 'cash') => {
    if (!selectedAppointmentId) return;
    
    setIsUpdatingPayment(true);
    try {
      // Get current appointment notes
      const { data: appointment } = await supabase
        .from('appointments')
        .select('notes')
        .eq('id', selectedAppointmentId)
        .maybeSingle();

      // Update notes to reflect new payment method
      let newNotes = appointment?.notes || '';
      // Remove old payment info
      newNotes = newNotes.replace(/\[Plată: (Card|Cash|Neachitat)\]/g, '').trim();
      // Add new payment info
      newNotes = newNotes ? `${newNotes}\n[Plată: ${method === 'card' ? 'Card' : 'Cash'}]` : `[Plată: ${method === 'card' ? 'Card' : 'Cash'}]`;

      const { error } = await supabase
        .from('appointments')
        .update({ 
          is_paid: true,
          notes: newNotes
        })
        .eq('id', selectedAppointmentId);

      if (error) throw error;

      // Update local state
      setTreatmentHistory(prev => 
        prev.map(record => 
          record.appointment_id === selectedAppointmentId 
            ? { ...record, payment_method: method }
            : record
        )
      );

      setPaymentDialogOpen(false);
      setSelectedAppointmentId(null);
    } catch (error) {
      console.error('Error updating payment:', error);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const getPaymentBadge = (method: PaymentMethod | null, appointmentId?: string, paidAmount?: number | null, totalPrice?: number | null) => {
    const remaining = (totalPrice || 0) - (paidAmount || 0);
    
    switch (method) {
      case 'card':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
            <CreditCard className="h-3 w-3" />
            Card
          </Badge>
        );
      case 'cash':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
            <Banknote className="h-3 w-3" />
            Cash
          </Badge>
        );
      case 'partial_card':
      case 'partial_cash':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (appointmentId) handleMarkAsPaid(appointmentId);
            }}
            className="cursor-pointer hover:scale-105 transition-transform"
          >
            <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 gap-1 hover:bg-cyan-200">
              {method === 'partial_card' ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
              Parțial ({paidAmount?.toLocaleString()} RON) - Rest: {remaining.toLocaleString()} RON
            </Badge>
          </button>
        );
      case 'unpaid':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (appointmentId) handleMarkAsPaid(appointmentId);
            }}
            className="cursor-pointer hover:scale-105 transition-transform"
          >
            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 gap-1 hover:bg-orange-200 dark:hover:bg-orange-900/50">
              <AlertCircle className="h-3 w-3" />
              Neachitat
            </Badge>
          </button>
        );
      default:
        return null;
    }
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!patient) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-xl">
                  {patient.last_name} {patient.first_name}
                </div>
                {patient.date_of_birth && (
                  <div className="text-sm text-muted-foreground font-normal">
                    {calculateAge(patient.date_of_birth)} ani
                  </div>
                )}
              </div>
            </SheetTitle>
            <Button variant="outline" size="sm" onClick={() => onEdit(patient)}>
              <Edit className="h-4 w-4 mr-2" />
              Editează
            </Button>
          </div>
        </SheetHeader>

        <Tabs defaultValue="info" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="info">Informații</TabsTrigger>
            <TabsTrigger value="history">Istoric</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6 space-y-6">
            {/* Contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Contact</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{patient.email}</span>
                  </div>
                )}
                {(patient.address || patient.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {[patient.address, patient.city].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Alerts */}
            {((patient.allergies && patient.allergies.length > 0) ||
              (patient.medical_conditions && patient.medical_conditions.length > 0)) && (
              <div className="space-y-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alerte medicale
                </h4>
                
                {patient.allergies && patient.allergies.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Alergii:</div>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy, i) => (
                        <Badge key={i} variant="destructive">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {patient.medical_conditions && patient.medical_conditions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      Afecțiuni:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {patient.medical_conditions.map((condition, i) => (
                        <Badge key={i} variant="secondary" className="bg-warning/20">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Medications */}
            {patient.medications && patient.medications.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Medicamente curente
                </h4>
                <div className="flex flex-wrap gap-2">
                  {patient.medications.map((medication, i) => (
                    <Badge key={i} variant="outline">
                      {medication}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {patient.notes && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observații
                </h4>
                <p className="text-sm text-foreground/80">{patient.notes}</p>
              </div>
            )}

            {/* Emergency Contact */}
            {patient.emergency_contact_name && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase">
                  Contact de urgență
                </h4>
                <div className="text-sm">
                  <div>{patient.emergency_contact_name}</div>
                  {patient.emergency_contact_phone && (
                    <div className="text-muted-foreground">{patient.emergency_contact_phone}</div>
                  )}
                </div>
              </div>
            )}

            {/* Registration date */}
            <div className="pt-4 border-t text-xs text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Înregistrat la {format(new Date(patient.created_at), 'd MMMM yyyy', { locale: ro })}
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : treatmentHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu există tratamente înregistrate</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Period filter */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <div className="flex gap-1 flex-wrap">
                    {[
                      { value: 'all', label: 'Toate' },
                      { value: '30days', label: '30 zile' },
                      { value: '3months', label: '3 luni' },
                      { value: '1year', label: '1 an' },
                    ].map((option) => (
                      <Button
                        key={option.value}
                        variant={periodFilter === option.value ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setPeriodFilter(option.value as PeriodFilter)}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nu există tratamente în perioada selectată</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Group treatments by date */}
                    {(() => {
                      const groupedByDate = filteredHistory.reduce((acc, record) => {
                        const dateKey = record.appointment_date;
                        if (!acc[dateKey]) {
                          acc[dateKey] = [];
                        }
                        acc[dateKey].push(record);
                        return acc;
                      }, {} as Record<string, typeof filteredHistory>);

                      const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
                        new Date(b).getTime() - new Date(a).getTime()
                      );

                      return sortedDates.map((dateKey) => {
                        const records = groupedByDate[dateKey];
                        const totalPrice = records.reduce((sum, r) => sum + (r.price || 0), 0);
                        const totalCas = records.reduce((sum, r) => sum + (r.cas || 0), 0);
                        const totalDePlata = totalPrice - totalCas;
                        const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0);

                        return (
                          <Collapsible key={dateKey} defaultOpen={true}>
                            {/* Date header with summary - clickable */}
                            <CollapsibleTrigger asChild>
                              <button className="w-full flex items-center justify-between bg-muted/50 hover:bg-muted/70 rounded-lg px-4 py-2.5 transition-colors cursor-pointer">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-primary" />
                                  <span className="font-medium text-sm">
                                    {format(new Date(dateKey), 'd MMMM yyyy', { locale: ro })}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">
                                    {records.length} {records.length === 1 ? 'intervenție' : 'intervenții'}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                  {totalDuration > 0 && (
                                    <span>{totalDuration} min</span>
                                  )}
                                  {totalPrice > 0 && (
                                    <div className="flex items-center gap-2">
                                      {totalCas > 0 && (
                                        <span className="text-cyan-600 text-xs">CAS: {totalCas} RON</span>
                                      )}
                                      <Badge variant="outline" className="font-medium">
                                        {totalCas > 0 ? `${totalDePlata} RON` : `${totalPrice} RON`}
                                      </Badge>
                                    </div>
                                  )}
                                  <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                                </div>
                              </button>
                            </CollapsibleTrigger>

                            {/* Treatments for this date - collapsible */}
                            <CollapsibleContent className="space-y-2 pl-2 mt-3">
                              {records.map((record) => (
                                <div
                                  key={record.id}
                                  className="p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                                        <Stethoscope className="h-3.5 w-3.5 text-primary" />
                                      </div>
                                      <div className="space-y-1">
                                        <h4 className="font-medium text-sm">{record.treatment_name}</h4>
                                        <div className="text-xs text-muted-foreground">
                                          Ora {record.start_time.slice(0, 5)}
                                          {record.duration && ` • ${record.duration} min`}
                                          {record.doctor_name && (
                                            <>
                                              {' • '}
                                              <span className="text-primary font-medium">Dr. {record.doctor_name}</span>
                                            </>
                                          )}
                                        </div>
                                        {record.tooth_numbers && record.tooth_numbers.length > 0 && (
                                          <div className="mt-3">
                                            <MiniDentalChart 
                                              treatedTeeth={record.tooth_numbers} 
                                              teethData={record.tooth_data.map(td => ({
                                                tooth_number: td.toothNumber,
                                                status: td.status as any,
                                                notes: td.notes,
                                              }))}
                                            />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      {record.payment_method && getPaymentBadge(record.payment_method, record.appointment_id, record.paid_amount, record.total_price)}
                                      {record.price !== null && record.price > 0 && (
                                        <div className="flex flex-col items-end gap-0.5">
                                          {record.cas && record.cas > 0 && (
                                            <span className="text-[10px] text-cyan-600">CAS: {record.cas} RON</span>
                                          )}
                                          <Badge variant="outline" className="text-xs">
                                            {record.cas && record.cas > 0 
                                              ? `${record.price - record.cas} RON` 
                                              : `${record.price} RON`}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      });
                    })()}

                    {/* Grand total for filtered results */}
                    <div className="border-t pt-4 mt-6 space-y-3">
                      {/* Unpaid total - show only if there are unpaid items */}
                      {filteredHistory.filter(r => r.payment_method === 'unpaid').length > 0 && (
                        <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="font-medium text-sm text-orange-700 dark:text-orange-400">
                              Total neachitat
                            </span>
                          </div>
                          <Badge className="bg-orange-500 hover:bg-orange-600 font-medium">
                            {filteredHistory
                              .filter(r => r.payment_method === 'unpaid')
                              .reduce((sum, r) => sum + (r.price || 0), 0)} RON
                          </Badge>
                        </div>
                      )}
                      
                      {/* General total */}
                      <div className="flex items-center justify-between bg-primary/5 rounded-lg px-4 py-3">
                        <span className="font-medium text-sm">
                          Total {periodFilter !== 'all' ? 'perioadă' : 'general'}
                        </span>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">
                            {filteredHistory.length} intervenții
                          </Badge>
                          <Badge className="font-medium">
                            {filteredHistory.reduce((sum, r) => sum + (r.price || 0), 0)} RON
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Payment Dialog */}
        {paymentDialogOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-black/50" 
              onClick={() => {
                setPaymentDialogOpen(false);
                setSelectedAppointmentId(null);
              }}
            />
            <div className="relative bg-background rounded-lg p-6 shadow-xl max-w-sm w-full mx-4 z-10">
              <h3 className="text-lg font-semibold mb-2">Marchează ca achitat</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Selectați metoda de plată utilizată:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleConfirmPayment('card')}
                  disabled={isUpdatingPayment}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-border hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all disabled:opacity-50"
                >
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">Card</span>
                </button>
                <button
                  onClick={() => handleConfirmPayment('cash')}
                  disabled={isUpdatingPayment}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-border hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all disabled:opacity-50"
                >
                  <Banknote className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">Cash</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setPaymentDialogOpen(false);
                  setSelectedAppointmentId(null);
                }}
                disabled={isUpdatingPayment}
                className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Anulează
              </button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}