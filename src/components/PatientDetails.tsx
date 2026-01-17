import { useState, useEffect } from 'react';
import { format } from 'date-fns';
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
import { Patient } from '@/hooks/usePatients';
import { supabase } from '@/integrations/supabase/client';

interface TreatmentRecord {
  id: string;
  treatment_name: string;
  price: number | null;
  tooth_numbers: number[] | null;
  duration: number | null;
  appointment_date: string;
  start_time: string;
}

interface PatientDetailsProps {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
}

export function PatientDetails({ patient, open, onClose, onEdit }: PatientDetailsProps) {
  const [treatmentHistory, setTreatmentHistory] = useState<TreatmentRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (patient && open) {
      fetchTreatmentHistory();
    }
  }, [patient, open]);

  const fetchTreatmentHistory = async () => {
    if (!patient) return;
    setLoadingHistory(true);

    // Fetch from appointment_treatments joined with appointments
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        appointment_treatments (
          id,
          treatment_name,
          price,
          tooth_numbers,
          duration
        )
      `)
      .eq('patient_id', patient.id)
      .order('appointment_date', { ascending: false });

    if (error) {
      console.error('Error fetching treatment history:', error);
      setTreatmentHistory([]);
    } else {
      // Flatten the data
      const records: TreatmentRecord[] = [];
      data?.forEach((appointment: any) => {
        appointment.appointment_treatments?.forEach((treatment: any) => {
          records.push({
            id: treatment.id,
            treatment_name: treatment.treatment_name,
            price: treatment.price,
            tooth_numbers: treatment.tooth_numbers,
            duration: treatment.duration,
            appointment_date: appointment.appointment_date,
            start_time: appointment.start_time,
          });
        });
      });
      setTreatmentHistory(records);
    }
    setLoadingHistory(false);
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
                {treatmentHistory.map((record) => (
                  <div
                    key={record.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                          <Stethoscope className="h-4 w-4 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-medium text-sm">{record.treatment_name}</h4>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(record.appointment_date), 'd MMMM yyyy', { locale: ro })} la {record.start_time.slice(0, 5)}
                          </div>
                          {record.duration && (
                            <div className="text-xs text-muted-foreground">
                              Durată: {record.duration} min
                            </div>
                          )}
                          {record.tooth_numbers && record.tooth_numbers.length > 0 && (
                            <div className="flex items-center gap-1.5 mt-2">
                              <span className="text-xs text-muted-foreground">Dinți:</span>
                              <div className="flex flex-wrap gap-1">
                                {record.tooth_numbers.map((tooth) => (
                                  <Badge key={tooth} variant="secondary" className="text-xs px-1.5 py-0">
                                    {tooth}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {record.price !== null && record.price > 0 && (
                        <Badge variant="outline" className="shrink-0">
                          {record.price} RON
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}