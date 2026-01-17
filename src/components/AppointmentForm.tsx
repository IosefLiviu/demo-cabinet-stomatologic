import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TIME_SLOTS } from '@/types/appointment';
import { Patient } from '@/hooks/usePatients';
import { Cabinet } from '@/hooks/useCabinets';
import { Doctor } from '@/hooks/useDoctors';
import { InterventionSelector, SelectedIntervention } from '@/components/InterventionSelector';

interface Treatment {
  id: string;
  name: string;
  default_duration: number;
  default_price?: number;
  decont?: number;
  co_plata?: number;
  category?: string;
}

export interface ToothDetail {
  toothNumber: number;
  status: string;
  notes?: string;
}

export interface SelectedTreatment {
  treatmentId: string;
  treatmentName: string;
  price: number;
  cas: number;
  duration: number;
  selectedTeeth?: number[];
  teethDetails?: ToothDetail[];
}

export interface AppointmentFormData {
  patientId: string;
  patientName: string;
  patientPhone: string;
  cabinetId: number;
  doctorId?: string;
  time: string;
  duration: number;
  treatmentId?: string;
  treatmentName: string;
  notes?: string;
  price?: number;
  selectedTreatments: SelectedTreatment[];
  totalPrice: number;
  totalCas: number;
}

interface AppointmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AppointmentFormData) => void;
  onDelete?: () => void;
  selectedDate: Date;
  selectedTime?: string;
  selectedCabinet?: number;
  editingAppointment?: {
    id: string;
    patientId?: string;
    patientName: string;
    patientPhone: string;
    cabinetId: number;
    doctorId?: string;
    time: string;
    duration: number;
    treatmentId?: string;
    treatmentName: string;
    notes?: string;
    price?: number;
    status?: string;
  };
  existingInterventions?: SelectedIntervention[];
  patients: Patient[];
  treatments: Treatment[];
  cabinets: Cabinet[];
  doctors: Doctor[];
  isAdmin?: boolean;
}

export function AppointmentForm({
  open,
  onClose,
  onSubmit,
  onDelete,
  selectedDate,
  selectedTime,
  selectedCabinet,
  editingAppointment,
  existingInterventions,
  patients,
  treatments,
  cabinets,
  doctors,
  isAdmin = false,
}: AppointmentFormProps) {
  const [patientSearch, setPatientSearch] = useState('');
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  
  const [interventions, setInterventions] = useState<SelectedIntervention[]>([]);
  
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    patientPhone: '',
    cabinetId: 1,
    doctorId: '',
    time: TIME_SLOTS[0],
    notes: '',
  });

  // Calculate totals from interventions
  const totalPrice = interventions.reduce((sum, i) => sum + i.price, 0);
  const totalCas = interventions.reduce((sum, i) => sum + i.cas, 0);
  const totalDuration = interventions.reduce((sum, i) => sum + i.duration, 0) || 30;

  useEffect(() => {
    if (open) {
      if (editingAppointment) {
        setFormData({
          patientId: editingAppointment.patientId || '',
          patientName: editingAppointment.patientName,
          patientPhone: editingAppointment.patientPhone,
          cabinetId: editingAppointment.cabinetId,
          doctorId: editingAppointment.doctorId || '',
          time: editingAppointment.time,
          notes: editingAppointment.notes || '',
        });
        // Load existing interventions if provided
        if (existingInterventions && existingInterventions.length > 0) {
          setInterventions(existingInterventions);
        } else if (editingAppointment.treatmentId) {
          // Fallback: try to load from legacy single treatment
          const treatment = treatments.find(t => t.id === editingAppointment.treatmentId);
          if (treatment) {
            setInterventions([{
              id: `${treatment.id}-${Date.now()}`,
              treatmentId: treatment.id,
              treatmentName: treatment.name,
              price: editingAppointment.price || treatment.default_price || 0,
              cas: 0,
              duration: editingAppointment.duration || treatment.default_duration || 30,
              selectedTeeth: [],
            }]);
          } else {
            setInterventions([]);
          }
        } else {
          setInterventions([]);
        }
        setIsNewPatient(false);
      } else {
        setFormData({
          patientId: '',
          patientName: '',
          patientPhone: '',
          cabinetId: selectedCabinet || 1,
          doctorId: '',
          time: selectedTime || TIME_SLOTS[0],
          notes: '',
        });
        setInterventions([]);
        setIsNewPatient(false);
      }
      setPatientSearch('');
    }
  }, [open, editingAppointment, existingInterventions, selectedTime, selectedCabinet, treatments]);

  const handleSelectPatient = (patient: Patient) => {
    setFormData({
      ...formData,
      patientId: patient.id,
      patientName: `${patient.first_name} ${patient.last_name}`,
      patientPhone: patient.phone,
    });
    setPatientPopoverOpen(false);
    setIsNewPatient(false);
  };

  const handleNewPatient = () => {
    setFormData({
      ...formData,
      patientId: '',
      patientName: '',
      patientPhone: '',
    });
    setIsNewPatient(true);
    setPatientPopoverOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert interventions to selectedTreatments format
    const selectedTreatments: SelectedTreatment[] = interventions.map(i => ({
      treatmentId: i.treatmentId,
      treatmentName: i.treatmentName,
      price: i.price,
      cas: i.cas,
      duration: i.duration,
      selectedTeeth: i.selectedTeeth,
      teethDetails: i.teethDetails?.map(td => ({
        toothNumber: td.toothNumber,
        status: td.status,
        notes: td.notes,
      })),
    }));

    const firstTreatment = selectedTreatments[0];
    onSubmit({
      patientId: formData.patientId,
      patientName: formData.patientName,
      patientPhone: formData.patientPhone,
      cabinetId: formData.cabinetId,
      doctorId: formData.doctorId || undefined,
      time: formData.time,
      notes: formData.notes,
      duration: totalDuration,
      treatmentId: firstTreatment?.treatmentId,
      treatmentName: selectedTreatments.map(t => t.treatmentName).join(', '),
      price: totalPrice,
      selectedTreatments,
      totalPrice,
      totalCas,
    });
  };

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const phone = p.phone.toLowerCase();
    const search = patientSearch.toLowerCase();
    return fullName.includes(search) || phone.includes(search);
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[850px] h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{editingAppointment ? 'Editare programare' : 'Programare nouă'}</span>
            <span className="text-sm font-normal text-muted-foreground">
              {format(selectedDate, 'dd.MM.yyyy')}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label>Pacient *</Label>
              {!isNewPatient && !formData.patientId ? (
                <Popover open={patientPopoverOpen} onOpenChange={setPatientPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      <span className="text-muted-foreground">Caută pacient...</span>
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Caută după nume sau telefon..." 
                        value={patientSearch}
                        onValueChange={setPatientSearch}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-2 text-center">
                            <p className="text-sm text-muted-foreground mb-2">Niciun pacient găsit</p>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={handleNewPatient}
                              className="gap-2"
                            >
                              <UserPlus className="h-4 w-4" />
                              Adaugă pacient nou
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup heading="Pacienți">
                          {filteredPatients.slice(0, 10).map((patient) => (
                            <CommandItem
                              key={patient.id}
                              value={`${patient.first_name} ${patient.last_name} ${patient.phone}`}
                              onSelect={() => handleSelectPatient(patient)}
                              className="cursor-pointer"
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">
                                  {patient.first_name} {patient.last_name}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  {patient.phone}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandGroup>
                          <CommandItem 
                            onSelect={handleNewPatient}
                            className="cursor-pointer text-primary"
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Adaugă pacient nou
                          </CommandItem>
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="flex gap-2">
                  <div className="flex-1 p-3 rounded-md border bg-muted/50">
                    <div className="font-medium">{formData.patientName || 'Pacient nou'}</div>
                    {formData.patientPhone && (
                      <div className="text-sm text-muted-foreground">{formData.patientPhone}</div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setFormData({ ...formData, patientId: '', patientName: '', patientPhone: '' });
                      setIsNewPatient(false);
                    }}
                  >
                    Schimbă
                  </Button>
                </div>
              )}
            </div>

            {/* New Patient Fields */}
            {isNewPatient && (
              <div className="grid gap-4 sm:grid-cols-2 p-3 rounded-md border border-dashed">
                <div className="space-y-2">
                  <Label htmlFor="patientName">Nume complet *</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    placeholder="Popescu Ion"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="patientPhone">Telefon *</Label>
                  <Input
                    id="patientPhone"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    placeholder="07xx xxx xxx"
                    required
                  />
                </div>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="cabinet">Cabinet *</Label>
                <Select
                  value={String(formData.cabinetId)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cabinetId: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {cabinets.map((cabinet) => (
                      <SelectItem key={cabinet.id} value={String(cabinet.id)}>
                        {cabinet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor</Label>
                <Select
                  value={formData.doctorId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, doctorId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează doctor" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: doctor.color }}
                          />
                          {doctor.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Ora *</Label>
                <Select
                  value={formData.time}
                  onValueChange={(value) =>
                    setFormData({ ...formData, time: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Interventions Section */}
            <InterventionSelector
              treatments={treatments}
              interventions={interventions}
              onInterventionsChange={setInterventions}
            />

            <div className="space-y-2">
              <Label htmlFor="notes">Observații</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Note adiționale..."
                rows={3}
              />
            </div>

            <div className="flex justify-between gap-3 pt-4">
              <div>
                {editingAppointment && onDelete && (
                  // Only show delete button if not completed OR if user is admin
                  (editingAppointment.status !== 'completed' || isAdmin) && (
                    <Button 
                      type="button" 
                      variant="destructive" 
                      onClick={onDelete}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Șterge
                    </Button>
                  )
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Anulează
                </Button>
                <Button 
                  type="submit"
                  disabled={!formData.patientName || interventions.length === 0}
                >
                  {editingAppointment ? 'Salvează' : 'Adaugă programare'}
                </Button>
              </div>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
