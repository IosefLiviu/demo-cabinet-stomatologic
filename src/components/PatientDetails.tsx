import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  X,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DentalChart, ToothStatusSelector, ToothStatus } from './DentalChart';
import { Patient } from '@/hooks/usePatients';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DentalStatusData {
  id: string;
  patient_id: string;
  tooth_number: number;
  status: ToothStatus;
  notes?: string;
}

interface PatientDetailsProps {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
}

export function PatientDetails({ patient, open, onClose, onEdit }: PatientDetailsProps) {
  const [dentalStatus, setDentalStatus] = useState<DentalStatusData[]>([]);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [editingTooth, setEditingTooth] = useState<{
    status: ToothStatus;
    notes: string;
  }>({ status: 'healthy', notes: '' });
  const { toast } = useToast();

  useEffect(() => {
    if (patient) {
      fetchDentalStatus();
    }
  }, [patient]);

  const fetchDentalStatus = async () => {
    if (!patient) return;

    const { data, error } = await supabase
      .from('dental_status')
      .select('*')
      .eq('patient_id', patient.id);

    if (error) {
      console.error('Error fetching dental status:', error);
      return;
    }

    setDentalStatus((data as unknown as DentalStatusData[]) || []);
  };

  const handleToothClick = (toothNumber: number) => {
    const existing = dentalStatus.find((t) => t.tooth_number === toothNumber);
    setSelectedTooth(toothNumber);
    setEditingTooth({
      status: (existing?.status as ToothStatus) || 'healthy',
      notes: existing?.notes || '',
    });
  };

  const handleSaveTooth = async () => {
    if (!patient || !selectedTooth) return;

    const existing = dentalStatus.find((t) => t.tooth_number === selectedTooth);

    try {
      if (existing) {
        const { error } = await supabase
          .from('dental_status')
          .update({
            status: editingTooth.status,
            notes: editingTooth.notes || null,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dental_status')
          .insert({
            patient_id: patient.id,
            tooth_number: selectedTooth,
            status: editingTooth.status,
            notes: editingTooth.notes || null,
          });

        if (error) throw error;
      }

      await fetchDentalStatus();
      setSelectedTooth(null);
      toast({
        title: 'Succes',
        description: 'Status dentar actualizat',
      });
    } catch (error: any) {
      console.error('Error saving dental status:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut salva statusul dentar',
        variant: 'destructive',
      });
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
    <>
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
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="info">Informații</TabsTrigger>
              <TabsTrigger value="dental">Status dentar</TabsTrigger>
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

            <TabsContent value="dental" className="mt-6">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Click pe un dinte pentru a actualiza statusul
                </p>
                <DentalChart
                  dentalStatus={dentalStatus.map((d) => ({
                    tooth_number: d.tooth_number,
                    status: d.status,
                    notes: d.notes,
                  }))}
                  onToothClick={handleToothClick}
                />
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Istoricul tratamentelor va fi disponibil în curând</p>
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      {/* Edit Tooth Dialog */}
      <Dialog open={selectedTooth !== null} onOpenChange={() => setSelectedTooth(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dinte {selectedTooth}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <ToothStatusSelector
                selectedStatus={editingTooth.status}
                onStatusChange={(status) => setEditingTooth({ ...editingTooth, status })}
              />
            </div>
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={editingTooth.notes}
                onChange={(e) => setEditingTooth({ ...editingTooth, notes: e.target.value })}
                placeholder="Adaugă note despre dinte..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedTooth(null)}>
                Anulează
              </Button>
              <Button onClick={handleSaveTooth}>Salvează</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
