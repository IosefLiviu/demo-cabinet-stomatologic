import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Trash2, UserPlus, FileText, Smile, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
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
import { useCasBudget } from '@/hooks/useCasBudget';
import { useTreatmentPlans, TreatmentPlan } from '@/hooks/useTreatmentPlans';
import { supabase } from '@/integrations/supabase/client';

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
  laborator: number;
  duration: number;
  discountPercent?: number;
  selectedTeeth?: number[];
  teethDetails?: ToothDetail[];
  planItemId?: string; // Link to treatment plan item for tracking completion
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
  onViewPatient?: (patient: Patient) => void;
  onViewDentalStatus?: (patient: Patient) => void;
  onViewRadiographs?: (patient: Patient) => void;
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
  checkOverlap?: (
    date: string, 
    startTime: string, 
    endTime: string, 
    cabinetId: number, 
    excludeId?: string
  ) => { hasOverlap: boolean; conflictingAppointment?: { start_time: string; duration: number; patients?: { first_name: string; last_name: string } } };
}

export function AppointmentForm({
  open,
  onClose,
  onSubmit,
  onDelete,
  onViewPatient,
  onViewDentalStatus,
  onViewRadiographs,
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
  checkOverlap,
}: AppointmentFormProps) {
  const [patientSearch, setPatientSearch] = useState('');
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  
  const [interventions, setInterventions] = useState<SelectedIntervention[]>([]);
  const [patientPlans, setPatientPlans] = useState<TreatmentPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  
  const { remainingBudget } = useCasBudget();
  const isCasDisabled = remainingBudget <= 0;
  
  const { fetchPatientTreatmentPlans } = useTreatmentPlans();
  
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    patientPhone: '',
    cabinetId: 1,
    doctorId: '',
    time: TIME_SLOTS[0],
    endTime: TIME_SLOTS[1], // Default 30 minutes after start
    notes: '',
  });

  // Calculate end time based on start time + duration from interventions
  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(endMinutes / 60);
    const endMins = endMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
  };

  // Calculate duration from time interval
  const calculateDurationFromInterval = (startTime: string, endTime: string): number => {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return Math.max(30, endTotalMinutes - startTotalMinutes);
  };

  // Get available end times (must be after start time)
  const getAvailableEndTimes = (startTime: string): string[] => {
    const startIndex = TIME_SLOTS.indexOf(startTime);
    return TIME_SLOTS.slice(startIndex + 1);
  };

  // Calculate totals from interventions
  const totalPrice = interventions.reduce((sum, i) => sum + i.price, 0);
  const totalCas = interventions.reduce((sum, i) => sum + i.cas, 0);
  const totalDuration = interventions.reduce((sum, i) => sum + i.duration, 0) || 30;

  // Fetch treatment plans when patient is selected
  useEffect(() => {
    const loadPatientPlans = async () => {
      if (formData.patientId) {
        const plans = await fetchPatientTreatmentPlans(formData.patientId);
        setPatientPlans(plans);
      } else {
        setPatientPlans([]);
      }
    };
    loadPatientPlans();
  }, [formData.patientId]);

  // Handle treatment plan selection
  const handleSelectPlan = async (planId: string) => {
    setSelectedPlanId(planId);
    
    if (planId === 'none') {
      return;
    }
    
    const selectedPlan = patientPlans.find(p => p.id === planId);
    if (selectedPlan) {
      // Get already completed teeth from completed appointments for this plan's items
      const planItemIds = selectedPlan.items.map(item => item.id).filter(Boolean);
      
      let completedTeethByPlanItem: Map<string, Set<number>> = new Map();
      let completedTeethByTreatmentName: Map<string, Set<number>> = new Map();
      
      // Get patient ID for legacy reconciliation
      const patientId = formData.patientId;
      
      // Query ALL completed treatments for this patient to handle legacy records without plan_item_id
      const { data: allCompletedTreatments } = await supabase
        .from('appointment_treatments')
        .select(`
          plan_item_id,
          treatment_name,
          tooth_numbers,
          appointments!inner(status, patient_id)
        `)
        .eq('appointments.patient_id', patientId)
        .eq('appointments.status', 'completed');
      
      if (allCompletedTreatments) {
        allCompletedTreatments.forEach(ct => {
          const teeth = ct.tooth_numbers || [];
          
          // Track by plan_item_id if available
          if (ct.plan_item_id && planItemIds.includes(ct.plan_item_id)) {
            if (!completedTeethByPlanItem.has(ct.plan_item_id)) {
              completedTeethByPlanItem.set(ct.plan_item_id, new Set());
            }
            teeth.forEach((t: number) => {
              completedTeethByPlanItem.get(ct.plan_item_id)!.add(t);
            });
          }
          
          // Also track by treatment_name for legacy reconciliation
          const treatmentKey = ct.treatment_name.toLowerCase().trim();
          if (!completedTeethByTreatmentName.has(treatmentKey)) {
            completedTeethByTreatmentName.set(treatmentKey, new Set());
          }
          teeth.forEach((t: number) => {
            completedTeethByTreatmentName.get(treatmentKey)!.add(t);
          });
        });
      }
      
      // Convert plan items to interventions - expand items with multiple teeth into separate entries
      // Only include teeth that are NOT already completed
      const planInterventions: SelectedIntervention[] = [];
      
      selectedPlan.items.forEach((item, itemIndex) => {
        const toothNumbers = item.toothNumbers || [];
        
        // Get completed teeth: first check by plan_item_id, then by treatment name (legacy fallback)
        const completedByPlanItem = completedTeethByPlanItem.get(item.id || '') || new Set();
        const treatmentKey = item.treatmentName.toLowerCase().trim();
        const completedByName = completedTeethByTreatmentName.get(treatmentKey) || new Set();
        
        // Merge both sources of completed teeth
        const completedTeeth = new Set([...completedByPlanItem, ...completedByName]);
        
        // Filter out completed teeth
        const remainingTeeth = toothNumbers.filter(t => !completedTeeth.has(t));
        
        // Skip this item entirely if all teeth are completed
        if (toothNumbers.length > 0 && remainingTeeth.length === 0) {
          return;
        }
        
        // If item has no teeth (like PRF), check if it's marked as completed
        if (toothNumbers.length === 0 && item.completedAt) {
          return;
        }
        
        // item.price is already the price per tooth (initialPrice from treatment plan)
        // So we use it directly without dividing
        const originalTeethCount = toothNumbers.length || 1;
        const basePricePerTooth = item.price || 0; // Price is already per-tooth!
        
        if (remainingTeeth.length > 1) {
          // Multiple teeth: create one entry per remaining tooth, dividing CAS evenly
          const casPerTooth = (item.cas || 0) / originalTeethCount;
          const laboratorPerTooth = (item.laborator || 0) / originalTeethCount;
          
          remainingTeeth.forEach((toothNumber, toothIndex) => {
            planInterventions.push({
              id: `plan-${item.id || itemIndex}-tooth-${toothNumber}-${Date.now()}-${toothIndex}`,
              treatmentId: item.treatmentId || '',
              treatmentName: item.treatmentName,
              price: basePricePerTooth, // Price per tooth
              basePrice: basePricePerTooth, // Store base price for scaling
              cas: Math.round(casPerTooth * 100) / 100,
              laborator: Math.round(laboratorPerTooth * 100) / 100,
              duration: item.duration || 30,
              discountPercent: item.discountPercent || 0,
              selectedTeeth: [toothNumber],
              planItemId: item.id, // Link to plan item
            });
          });
        } else if (remainingTeeth.length === 1) {
          // Single remaining tooth
          const casPerTooth = (item.cas || 0) / originalTeethCount;
          const laboratorPerTooth = (item.laborator || 0) / originalTeethCount;
          
          planInterventions.push({
            id: `plan-${item.id || itemIndex}-${Date.now()}`,
            treatmentId: item.treatmentId || '',
            treatmentName: item.treatmentName,
            price: basePricePerTooth, // Price per tooth (already correct)
            basePrice: basePricePerTooth, // Store base price for scaling
            cas: Math.round(casPerTooth * 100) / 100,
            laborator: Math.round(laboratorPerTooth * 100) / 100,
            duration: item.duration || 30,
            discountPercent: item.discountPercent || 0,
            selectedTeeth: remainingTeeth,
            planItemId: item.id, // Link to plan item
          });
        } else {
          // No teeth specified (like PRF) - keep as single entry
          planInterventions.push({
            id: `plan-${item.id || itemIndex}-${Date.now()}`,
            treatmentId: item.treatmentId || '',
            treatmentName: item.treatmentName,
            price: item.price || 0,
            basePrice: item.price || 0, // Store base price for scaling
            cas: item.cas || 0,
            laborator: item.laborator || 0,
            duration: item.duration || 30,
            discountPercent: item.discountPercent || 0,
            selectedTeeth: [],
            planItemId: item.id, // Link to plan item
          });
        }
      });
      
      setInterventions(planInterventions);
      
      // Set doctor from plan if available
      if (selectedPlan.doctorId) {
        setFormData(prev => ({ ...prev, doctorId: selectedPlan.doctorId || '' }));
      }
    }
  };

  useEffect(() => {
    if (open) {
      if (editingAppointment) {
        const duration = editingAppointment.duration || 30;
        const endTimeCalculated = calculateEndTime(editingAppointment.time, duration);
        setFormData({
          patientId: editingAppointment.patientId || '',
          patientName: editingAppointment.patientName,
          patientPhone: editingAppointment.patientPhone,
          cabinetId: editingAppointment.cabinetId,
          doctorId: editingAppointment.doctorId || '',
          time: editingAppointment.time,
          endTime: endTimeCalculated,
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
              laborator: 0,
              duration: editingAppointment.duration || treatment.default_duration || 30,
              discountPercent: 0,
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
        const startTime = selectedTime || TIME_SLOTS[0];
        const defaultEndTime = TIME_SLOTS[TIME_SLOTS.indexOf(startTime) + 1] || TIME_SLOTS[TIME_SLOTS.length - 1];
        setFormData({
          patientId: '',
          patientName: '',
          patientPhone: '',
          cabinetId: selectedCabinet || 1,
          doctorId: '',
          time: startTime,
          endTime: defaultEndTime,
          notes: '',
        });
        setInterventions([]);
        setIsNewPatient(false);
      }
      setPatientSearch('');
      setSelectedPlanId('');
      setPatientPlans([]);
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
    
    // Check for overlapping appointments
    if (checkOverlap) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const { hasOverlap, conflictingAppointment } = checkOverlap(
        dateStr,
        formData.time,
        formData.endTime,
        formData.cabinetId,
        editingAppointment?.id
      );
      
      if (hasOverlap && conflictingAppointment) {
        const patientName = conflictingAppointment.patients 
          ? `${conflictingAppointment.patients.first_name} ${conflictingAppointment.patients.last_name}`
          : 'Alt pacient';
        const endMinutes = 
          parseInt(conflictingAppointment.start_time.split(':')[0]) * 60 + 
          parseInt(conflictingAppointment.start_time.split(':')[1]) + 
          (conflictingAppointment.duration || 30);
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
        
        toast({
          title: 'Suprapunere detectată',
          description: `Intervalul se suprapune cu programarea lui ${patientName} (${conflictingAppointment.start_time} - ${endTime})`,
          variant: 'destructive',
        });
        return;
      }
    }
    
    // Convert interventions to selectedTreatments format
    const selectedTreatments: SelectedTreatment[] = interventions.map(i => ({
      treatmentId: i.treatmentId,
      treatmentName: i.treatmentName,
      price: i.price,
      cas: i.cas,
      laborator: i.laborator || 0,
      duration: i.duration,
      discountPercent: i.discountPercent || 0,
      selectedTeeth: i.selectedTeeth,
      teethDetails: i.teethDetails?.map(td => ({
        toothNumber: td.toothNumber,
        status: td.status,
        notes: td.notes,
      })),
      planItemId: i.planItemId, // Include link to treatment plan item
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
      duration: calculateDurationFromInterval(formData.time, formData.endTime),
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
      <DialogContent className="w-[95vw] max-w-[850px] h-[90vh] max-h-[90vh] overflow-hidden flex flex-col p-3 sm:p-6">
        <DialogHeader className="pb-2 sm:pb-4">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-base sm:text-lg">{editingAppointment ? 'Editare programare' : 'Programare nouă'}</span>
            <span className="text-xs sm:text-sm font-normal text-muted-foreground">
              {format(selectedDate, 'dd.MM.yyyy')}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1 -mx-3 sm:-mx-6 px-3 sm:px-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 pb-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label className="text-sm">Pacient *</Label>
              {!isNewPatient && !formData.patientId ? (
                <Popover open={patientPopoverOpen} onOpenChange={setPatientPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between text-sm h-9 sm:h-10"
                    >
                      <span className="text-muted-foreground">Caută pacient...</span>
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Caută după nume sau telefon..." 
                        value={patientSearch}
                        onValueChange={setPatientSearch}
                        className="text-sm"
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-2 text-center">
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2">Niciun pacient găsit</p>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={handleNewPatient}
                              className="gap-2 text-xs sm:text-sm"
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
                                <span className="font-medium text-sm">
                                  {patient.first_name} {patient.last_name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {patient.phone}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandGroup>
                          <CommandItem 
                            onSelect={handleNewPatient}
                            className="cursor-pointer text-primary text-sm"
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
                  <div className="flex-1 p-2 sm:p-3 rounded-md border bg-muted/50">
                    <div className="font-medium text-sm">{formData.patientName || 'Pacient nou'}</div>
                    {formData.patientPhone && (
                      <div className="text-xs text-muted-foreground">{formData.patientPhone}</div>
                    )}
                  </div>
                  {formData.patientId && onViewPatient && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm gap-1"
                      onClick={() => {
                        const patient = patients.find(p => p.id === formData.patientId);
                        if (patient) {
                          onViewPatient(patient);
                        }
                      }}
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Fișă
                    </Button>
                  )}
                  {formData.patientId && onViewDentalStatus && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm gap-1"
                      onClick={() => {
                        const patient = patients.find(p => p.id === formData.patientId);
                        if (patient) {
                          onViewDentalStatus(patient);
                        }
                      }}
                    >
                      <Smile className="h-3.5 w-3.5" />
                      Status Dentar
                    </Button>
                  )}
                  {formData.patientId && onViewRadiographs && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs sm:text-sm gap-1"
                      onClick={() => {
                        const patient = patients.find(p => p.id === formData.patientId);
                        if (patient) {
                          onViewRadiographs(patient);
                        }
                      }}
                    >
                      <FileImage className="h-3.5 w-3.5" />
                      Imagistică
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs sm:text-sm"
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
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 p-2 sm:p-3 rounded-md border border-dashed">
                <div className="space-y-1.5">
                  <Label htmlFor="patientName" className="text-sm">Nume complet *</Label>
                  <Input
                    id="patientName"
                    value={formData.patientName}
                    onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                    placeholder="Popescu Ion"
                    required
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="patientPhone" className="text-sm">Telefon *</Label>
                  <Input
                    id="patientPhone"
                    value={formData.patientPhone}
                    onChange={(e) => setFormData({ ...formData, patientPhone: e.target.value })}
                    placeholder="07xx xxx xxx"
                    required
                    className="h-9 sm:h-10 text-sm"
                  />
                </div>
              </div>
            )}

            {/* Cabinet, Doctor, Time - Horizontal scroll on mobile */}
            <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
              <div className="grid gap-3 sm:gap-4 grid-cols-3 min-w-[400px] sm:min-w-0">
                <div className="space-y-1.5">
                  <Label htmlFor="cabinet" className="text-xs sm:text-sm">Cabinet *</Label>
                  <Select
                    value={String(formData.cabinetId)}
                    onValueChange={(value) =>
                      setFormData({ ...formData, cabinetId: parseInt(value) })
                    }
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {cabinets.map((cabinet) => (
                        <SelectItem key={cabinet.id} value={String(cabinet.id)} className="text-sm">
                          {cabinet.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="doctor" className="text-xs sm:text-sm">Doctor</Label>
                  <Select
                    value={formData.doctorId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, doctorId: value })
                    }
                  >
                    <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm">
                      <SelectValue placeholder="Selectează" />
                    </SelectTrigger>
                    <SelectContent className="bg-background border shadow-lg z-50">
                      {doctors.map((doctor) => (
                        <SelectItem key={doctor.id} value={doctor.id} className="text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: doctor.color }}
                            />
                            <span className="truncate">{doctor.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="time" className="text-xs sm:text-sm">Interval orar *</Label>
                  <div className="flex items-center gap-2">
                    <Select
                      value={formData.time}
                      onValueChange={(value) => {
                        // When start time changes, adjust end time if needed
                        const availableEndTimes = getAvailableEndTimes(value);
                        const newEndTime = availableEndTimes.includes(formData.endTime) 
                          ? formData.endTime 
                          : availableEndTimes[0] || value;
                        setFormData({ ...formData, time: value, endTime: newEndTime });
                      }}
                    >
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-[100] pointer-events-auto max-h-[300px]">
                        {TIME_SLOTS.slice(0, -1).map((time) => (
                          <SelectItem key={time} value={time} className="text-sm">
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="text-muted-foreground text-sm">-</span>
                    <Select
                      value={formData.endTime}
                      onValueChange={(value) =>
                        setFormData({ ...formData, endTime: value })
                      }
                    >
                      <SelectTrigger className="h-9 sm:h-10 text-xs sm:text-sm flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-lg z-[100] pointer-events-auto max-h-[300px]">
                        {getAvailableEndTimes(formData.time).map((time) => (
                          <SelectItem key={time} value={time} className="text-sm">
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>

            {/* Treatment Plan Selection */}
            {formData.patientId && patientPlans.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Plan Tratament
                </Label>
                <Select
                  value={selectedPlanId}
                  onValueChange={handleSelectPlan}
                >
                  <SelectTrigger className="h-9 sm:h-10 text-sm">
                    <SelectValue placeholder="Selectează plan de tratament..." />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-lg z-50">
                    <SelectItem value="none" className="text-sm text-muted-foreground">
                      Fără plan de tratament
                    </SelectItem>
                    {patientPlans.map((plan) => {
                      const totalItems = plan.items.length;
                      const totalPrice = plan.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                      return (
                        <SelectItem key={plan.id} value={plan.id} className="text-sm">
                          <div className="flex flex-col">
                            <span>
                              Plan din {format(new Date(plan.createdAt), 'dd.MM.yyyy')} 
                              ({totalItems} {totalItems === 1 ? 'intervenție' : 'intervenții'})
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Total: {totalPrice.toLocaleString('ro-RO')} lei
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Interventions Section */}
            <InterventionSelector
              treatments={treatments}
              interventions={interventions}
              onInterventionsChange={setInterventions}
              isCasDisabled={isCasDisabled}
              patientId={formData.patientId}
            />

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-sm">Observații</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Note adiționale..."
                rows={2}
                className="text-sm resize-none"
              />
            </div>

            {/* Action buttons - stacked on mobile */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2 sm:gap-3 pt-2 sm:pt-4">
              <div>
                {editingAppointment && onDelete && isAdmin && (
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={onDelete}
                    className="gap-2 w-full sm:w-auto text-sm h-9 sm:h-10"
                  >
                    <Trash2 className="h-4 w-4" />
                    Șterge
                  </Button>
                )}
              </div>
              <div className="flex gap-2 sm:gap-3">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1 sm:flex-none text-sm h-9 sm:h-10">
                  Anulează
                </Button>
                <Button 
                  type="submit"
                  disabled={!formData.patientName || interventions.length === 0}
                  className="flex-1 sm:flex-none text-sm h-9 sm:h-10"
                >
                  {editingAppointment ? 'Salvează' : 'Adaugă'}
                </Button>
              </div>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
