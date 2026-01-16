import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Search, Trash2, UserPlus, Plus, X } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface Treatment {
  id: string;
  name: string;
  default_duration: number;
  default_price?: number;
  decont?: number;
  co_plata?: number;
  category?: string;
}

export interface SelectedTreatment {
  treatmentId: string;
  treatmentName: string;
  price: number;
  decont: number;
  coPlata: number;
}

export interface AppointmentFormData {
  patientId: string;
  patientName: string;
  patientPhone: string;
  cabinetId: number;
  time: string;
  duration: number;
  treatmentId?: string;
  treatmentName: string;
  notes?: string;
  price?: number;
  selectedTreatments: SelectedTreatment[];
  totalPrice: number;
  totalDecont: number;
  totalCoPlata: number;
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
    time: string;
    duration: number;
    treatmentId?: string;
    treatmentName: string;
    notes?: string;
    price?: number;
  };
  patients: Patient[];
  treatments: Treatment[];
  cabinets: Cabinet[];
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
  patients,
  treatments,
  cabinets,
}: AppointmentFormProps) {
  const [patientSearch, setPatientSearch] = useState('');
  const [patientPopoverOpen, setPatientPopoverOpen] = useState(false);
  const [isNewPatient, setIsNewPatient] = useState(false);
  const [treatmentPopoverOpen, setTreatmentPopoverOpen] = useState(false);
  const [treatmentSearch, setTreatmentSearch] = useState('');
  
  const [selectedTreatments, setSelectedTreatments] = useState<SelectedTreatment[]>([]);
  
  const [formData, setFormData] = useState<Omit<AppointmentFormData, 'selectedTreatments' | 'totalPrice' | 'totalDecont' | 'totalCoPlata'>>({
    patientId: '',
    patientName: '',
    patientPhone: '',
    cabinetId: 1,
    time: TIME_SLOTS[0],
    duration: 30,
    treatmentId: undefined,
    treatmentName: '',
    notes: '',
    price: undefined,
  });

  // Calculate totals
  const totalPrice = selectedTreatments.reduce((sum, t) => sum + t.price, 0);
  const totalDecont = selectedTreatments.reduce((sum, t) => sum + t.decont, 0);
  const totalCoPlata = selectedTreatments.reduce((sum, t) => sum + t.coPlata, 0);
  const totalDuration = selectedTreatments.reduce((sum, t) => {
    const treatment = treatments.find(tr => tr.id === t.treatmentId);
    return sum + (treatment?.default_duration || 30);
  }, 0) || 30;

  useEffect(() => {
    if (open) {
      if (editingAppointment) {
        setFormData({
          patientId: editingAppointment.patientId || '',
          patientName: editingAppointment.patientName,
          patientPhone: editingAppointment.patientPhone,
          cabinetId: editingAppointment.cabinetId,
          time: editingAppointment.time,
          duration: editingAppointment.duration,
          treatmentId: editingAppointment.treatmentId,
          treatmentName: editingAppointment.treatmentName,
          notes: editingAppointment.notes || '',
          price: editingAppointment.price,
        });
        // If editing, try to load existing treatment
        if (editingAppointment.treatmentId) {
          const treatment = treatments.find(t => t.id === editingAppointment.treatmentId);
          if (treatment) {
            setSelectedTreatments([{
              treatmentId: treatment.id,
              treatmentName: treatment.name,
              price: editingAppointment.price || treatment.default_price || 0,
              decont: treatment.decont || 0,
              coPlata: treatment.co_plata || 0,
            }]);
          } else {
            setSelectedTreatments([]);
          }
        } else {
          setSelectedTreatments([]);
        }
        setIsNewPatient(false);
      } else {
        setFormData({
          patientId: '',
          patientName: '',
          patientPhone: '',
          cabinetId: selectedCabinet || 1,
          time: selectedTime || TIME_SLOTS[0],
          duration: 30,
          treatmentId: undefined,
          treatmentName: '',
          notes: '',
          price: undefined,
        });
        setSelectedTreatments([]);
        setIsNewPatient(false);
      }
      setPatientSearch('');
      setTreatmentSearch('');
    }
  }, [open, editingAppointment, selectedTime, selectedCabinet, treatments]);

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

  const handleAddTreatment = (treatment: Treatment) => {
    // Check if already added
    if (selectedTreatments.some(t => t.treatmentId === treatment.id)) {
      return;
    }
    
    setSelectedTreatments([
      ...selectedTreatments,
      {
        treatmentId: treatment.id,
        treatmentName: treatment.name,
        price: treatment.default_price || 0,
        decont: treatment.decont || 0,
        coPlata: treatment.co_plata || 0,
      }
    ]);
    setTreatmentPopoverOpen(false);
    setTreatmentSearch('');
  };

  const handleRemoveTreatment = (treatmentId: string) => {
    setSelectedTreatments(selectedTreatments.filter(t => t.treatmentId !== treatmentId));
  };

  const handleUpdateTreatmentPrice = (treatmentId: string, field: 'price' | 'decont' | 'coPlata', value: number) => {
    setSelectedTreatments(selectedTreatments.map(t => 
      t.treatmentId === treatmentId 
        ? { ...t, [field]: value }
        : t
    ));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const firstTreatment = selectedTreatments[0];
    onSubmit({
      ...formData,
      duration: totalDuration,
      treatmentId: firstTreatment?.treatmentId,
      treatmentName: selectedTreatments.map(t => t.treatmentName).join(', '),
      price: totalPrice,
      selectedTreatments,
      totalPrice,
      totalDecont,
      totalCoPlata,
    });
  };

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    const phone = p.phone.toLowerCase();
    const search = patientSearch.toLowerCase();
    return fullName.includes(search) || phone.includes(search);
  });

  const filteredTreatments = treatments.filter(t => 
    t.name.toLowerCase().includes(treatmentSearch.toLowerCase())
  );

  // Group treatments by category
  const groupedTreatments = filteredTreatments.reduce((acc, treatment) => {
    const category = treatment.category || 'Alte tratamente';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(treatment);
    return acc;
  }, {} as Record<string, Treatment[]>);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
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

            <div className="grid gap-4 sm:grid-cols-2">
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
                  <SelectContent>
                    {cabinets.map((cabinet) => (
                      <SelectItem key={cabinet.id} value={String(cabinet.id)}>
                        {cabinet.name} - {cabinet.doctor}
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
                  <SelectContent>
                    {TIME_SLOTS.map((time) => (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Treatments Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Tratamente *</Label>
                <span className="text-sm text-muted-foreground">
                  Durată totală: {totalDuration} min
                </span>
              </div>
              
              {/* Treatment List */}
              {selectedTreatments.length > 0 && (
                <div className="space-y-2 border rounded-lg p-3">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-muted-foreground px-1">
                    <div className="col-span-5">Tratament</div>
                    <div className="col-span-2 text-right">Preț</div>
                    <div className="col-span-2 text-right">Decont</div>
                    <div className="col-span-2 text-right">Co-plată</div>
                    <div className="col-span-1"></div>
                  </div>
                  
                  {selectedTreatments.map((treatment) => (
                    <div key={treatment.treatmentId} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-5 text-sm font-medium truncate" title={treatment.treatmentName}>
                        {treatment.treatmentName}
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={treatment.price}
                          onChange={(e) => handleUpdateTreatmentPrice(treatment.treatmentId, 'price', parseFloat(e.target.value) || 0)}
                          className="h-8 text-right text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={treatment.decont}
                          onChange={(e) => handleUpdateTreatmentPrice(treatment.treatmentId, 'decont', parseFloat(e.target.value) || 0)}
                          className="h-8 text-right text-sm"
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          value={treatment.coPlata}
                          onChange={(e) => handleUpdateTreatmentPrice(treatment.treatmentId, 'coPlata', parseFloat(e.target.value) || 0)}
                          className="h-8 text-right text-sm"
                        />
                      </div>
                      <div className="col-span-1 flex justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveTreatment(treatment.treatmentId)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  {/* Totals Row */}
                  <div className="grid grid-cols-12 gap-2 items-center pt-2 border-t mt-2">
                    <div className="col-span-5 text-sm font-bold">TOTAL</div>
                    <div className="col-span-2 text-right font-bold text-sm">
                      {totalPrice.toFixed(2)} lei
                    </div>
                    <div className="col-span-2 text-right font-bold text-sm text-green-600">
                      {totalDecont.toFixed(2)} lei
                    </div>
                    <div className="col-span-2 text-right font-bold text-sm text-orange-600">
                      {totalCoPlata.toFixed(2)} lei
                    </div>
                    <div className="col-span-1"></div>
                  </div>
                </div>
              )}

              {/* Add Treatment Button */}
              <Popover open={treatmentPopoverOpen} onOpenChange={setTreatmentPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Adaugă tratament
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0" align="start">
                  <Command>
                    <CommandInput 
                      placeholder="Caută tratament..." 
                      value={treatmentSearch}
                      onValueChange={setTreatmentSearch}
                    />
                    <CommandList className="max-h-[300px]">
                      <CommandEmpty>Niciun tratament găsit</CommandEmpty>
                      {Object.entries(groupedTreatments).map(([category, categoryTreatments]) => (
                        <CommandGroup key={category} heading={category}>
                          {categoryTreatments.map((treatment) => {
                            const isSelected = selectedTreatments.some(t => t.treatmentId === treatment.id);
                            return (
                              <CommandItem
                                key={treatment.id}
                                value={treatment.name}
                                onSelect={() => handleAddTreatment(treatment)}
                                className={cn(
                                  "cursor-pointer",
                                  isSelected && "opacity-50"
                                )}
                                disabled={isSelected}
                              >
                                <div className="flex justify-between w-full items-center">
                                  <span className="font-medium">{treatment.name}</span>
                                  <div className="flex gap-3 text-xs text-muted-foreground">
                                    <span>{treatment.default_price || 0} lei</span>
                                    {treatment.decont ? (
                                      <span className="text-green-600">D: {treatment.decont}</span>
                                    ) : null}
                                    {treatment.co_plata ? (
                                      <span className="text-orange-600">C: {treatment.co_plata}</span>
                                    ) : null}
                                  </div>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      ))}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

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
                  <Button 
                    type="button" 
                    variant="destructive" 
                    onClick={onDelete}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Șterge
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={onClose}>
                  Anulează
                </Button>
                <Button 
                  type="submit"
                  disabled={!formData.patientName || selectedTreatments.length === 0}
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
