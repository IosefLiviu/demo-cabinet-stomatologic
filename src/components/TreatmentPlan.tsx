import { useState, useRef, useEffect } from 'react';
import { format, differenceInYears } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Plus, Printer, X, Search, Save, Trash2, FileText, ChevronDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { TreatmentListDialog } from './TreatmentListDialog';
import { Patient } from '@/hooks/usePatients';
import { useTreatmentPlans, TreatmentPlan as TreatmentPlanType, TreatmentPlanItem as TreatmentPlanItemType } from '@/hooks/useTreatmentPlans';

interface Treatment {
  id: string;
  name: string;
  default_duration: number;
  default_price?: number;
  cas?: number;
  category?: string;
}

interface Doctor {
  id: string;
  name: string;
  color: string;
  specialization?: string | null;
  is_active: boolean;
}

interface LocalTreatmentPlanItem {
  id: string;
  treatmentId?: string;
  toothNumber: number | null;
  treatmentName: string;
  doctorId: string;
  quantity: number;
  price: number;
}

interface TreatmentPlanProps {
  patients: Patient[];
  treatments: Treatment[];
  doctors: Doctor[];
}

// FDI notation teeth
const allTeeth = [
  18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28,
  48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38,
];

export function TreatmentPlan({ patients, treatments, doctors }: TreatmentPlanProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [nextAppointmentDate, setNextAppointmentDate] = useState<string>('');
  const [nextAppointmentTime, setNextAppointmentTime] = useState<string>('');
  const [planItems, setPlanItems] = useState<LocalTreatmentPlanItem[]>([]);
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [savedPlans, setSavedPlans] = useState<TreatmentPlanType[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);

  const { loading, fetchPatientTreatmentPlans, saveTreatmentPlan, deleteTreatmentPlan } = useTreatmentPlans();

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
  const activeDoctors = doctors.filter(d => d.is_active);

  const patientAge = selectedPatient?.date_of_birth 
    ? differenceInYears(new Date(), new Date(selectedPatient.date_of_birth))
    : null;

  const filteredPatients = patients.filter(p => {
    const fullName = `${p.first_name} ${p.last_name}`.toLowerCase();
    return fullName.includes(patientSearch.toLowerCase());
  });

  // Load patient's saved plans when patient changes
  useEffect(() => {
    if (selectedPatientId) {
      loadPatientPlans();
    } else {
      setSavedPlans([]);
      resetForm();
    }
  }, [selectedPatientId]);

  const loadPatientPlans = async () => {
    if (!selectedPatientId) return;
    const plans = await fetchPatientTreatmentPlans(selectedPatientId);
    setSavedPlans(plans);
  };

  const resetForm = () => {
    setCurrentPlanId(null);
    setSelectedDoctorId('');
    setNextAppointmentDate('');
    setNextAppointmentTime('');
    setPlanItems([]);
  };

  const loadPlan = (plan: TreatmentPlanType) => {
    setCurrentPlanId(plan.id);
    setSelectedDoctorId(plan.doctorId || '');
    setNextAppointmentDate(plan.nextAppointmentDate || '');
    setNextAppointmentTime(plan.nextAppointmentTime || '');
    setPlanItems(plan.items.map(item => ({
      id: item.id || `${Date.now()}-${Math.random()}`,
      treatmentId: item.treatmentId,
      toothNumber: item.toothNumber,
      treatmentName: item.treatmentName,
      doctorId: item.doctorId,
      quantity: item.quantity,
      price: item.price,
    })));
  };

  const handleAddTreatment = (treatment: Treatment) => {
    const newItem: LocalTreatmentPlanItem = {
      id: `${treatment.id}-${Date.now()}`,
      treatmentId: treatment.id,
      toothNumber: null,
      treatmentName: treatment.name,
      doctorId: selectedDoctorId || activeDoctors[0]?.id || '',
      quantity: 1,
      price: treatment.default_price || 0,
    };
    setPlanItems([...planItems, newItem]);
  };

  const handleRemoveItem = (itemId: string) => {
    setPlanItems(planItems.filter(item => item.id !== itemId));
  };

  const handleUpdateItem = (itemId: string, field: keyof LocalTreatmentPlanItem, value: any) => {
    setPlanItems(planItems.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const total = planItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleSave = async () => {
    if (!selectedPatientId) return;

    const itemsToSave: TreatmentPlanItemType[] = planItems.map(item => ({
      treatmentId: item.treatmentId,
      treatmentName: item.treatmentName,
      toothNumber: item.toothNumber,
      doctorId: item.doctorId,
      quantity: item.quantity,
      price: item.price,
    }));

    const savedPlanId = await saveTreatmentPlan(
      selectedPatientId,
      selectedDoctorId || undefined,
      nextAppointmentDate || undefined,
      nextAppointmentTime || undefined,
      itemsToSave,
      currentPlanId || undefined
    );

    if (savedPlanId) {
      setCurrentPlanId(savedPlanId);
      await loadPatientPlans();
    }
  };

  const handleNewPlan = () => {
    resetForm();
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    
    const success = await deleteTreatmentPlan(planToDelete);
    if (success) {
      if (currentPlanId === planToDelete) {
        resetForm();
      }
      await loadPatientPlans();
    }
    setDeleteDialogOpen(false);
    setPlanToDelete(null);
  };

  const confirmDeletePlan = (planId: string) => {
    setPlanToDelete(planId);
    setDeleteDialogOpen(true);
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Plan de Tratament</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
            .header { text-align: center; margin-bottom: 20px; }
            .header h1 { font-size: 18px; margin: 0; color: #b8860b; }
            .header p { margin: 2px 0; font-size: 12px; }
            .clinic-name { font-weight: bold; font-size: 14px; }
            .section { margin: 15px 0; }
            .section-title { font-weight: bold; margin-bottom: 5px; }
            .info-line { margin: 3px 0; font-size: 13px; }
            .dental-chart { margin: 20px 0; text-align: center; }
            .dental-row { display: flex; justify-content: center; gap: 2px; margin: 5px 0; }
            .tooth { width: 24px; height: 30px; border: 1px solid #999; text-align: center; font-size: 10px; line-height: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
            th, td { border: 1px solid #333; padding: 6px; text-align: left; }
            th { background: #333; color: #fff; }
            .total { font-weight: bold; text-align: right; margin-top: 10px; font-size: 14px; }
            .disclaimer { font-size: 10px; color: #666; margin-top: 5px; }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      {/* Form Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <span>Plan de Tratament</span>
            <div className="flex gap-2 flex-wrap">
              <Button 
                variant="outline" 
                onClick={handleNewPlan} 
                className="gap-2"
                disabled={!selectedPatientId}
              >
                <Plus className="h-4 w-4" />
                Plan Nou
              </Button>
              <Button 
                onClick={handleSave} 
                className="gap-2" 
                disabled={!selectedPatientId || planItems.length === 0 || loading}
              >
                <Save className="h-4 w-4" />
                {loading ? 'Se salvează...' : 'Salvează'}
              </Button>
              <Button 
                variant="secondary"
                onClick={handlePrint} 
                className="gap-2" 
                disabled={planItems.length === 0}
              >
                <Printer className="h-4 w-4" />
                Printează
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Selection Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Patient Selection */}
            <div className="space-y-2">
              <Label>Pacient</Label>
              <Select value={selectedPatientId} onValueChange={setSelectedPatientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează pacient" />
                </SelectTrigger>
                <SelectContent>
                  <div className="p-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Caută pacient..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="pl-8"
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredPatients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name}
                      </SelectItem>
                    ))}
                  </div>
                </SelectContent>
              </Select>
            </div>

            {/* Saved Plans Dropdown */}
            <div className="space-y-2">
              <Label>Planuri salvate</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full justify-between"
                    disabled={!selectedPatientId || savedPlans.length === 0}
                  >
                    <span className="truncate">
                      {currentPlanId 
                        ? `Plan din ${format(new Date(savedPlans.find(p => p.id === currentPlanId)?.createdAt || new Date()), 'dd.MM.yyyy')}`
                        : savedPlans.length > 0 ? `${savedPlans.length} planuri` : 'Niciun plan'
                      }
                    </span>
                    <ChevronDown className="h-4 w-4 ml-2 shrink-0" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-64">
                  {savedPlans.map(plan => (
                    <DropdownMenuItem 
                      key={plan.id} 
                      className={`flex items-center justify-between gap-2 ${currentPlanId === plan.id ? 'bg-accent' : ''}`}
                    >
                      <button
                        className="flex-1 text-left flex items-center gap-2"
                        onClick={() => loadPlan(plan)}
                      >
                        <FileText className="h-4 w-4" />
                        <div>
                          <div className="font-medium">
                            {format(new Date(plan.createdAt), 'dd.MM.yyyy HH:mm')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {plan.items.length} tratamente
                          </div>
                        </div>
                      </button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDeletePlan(plan.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Doctor Selection */}
            <div className="space-y-2">
              <Label>Medic</Label>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează medic" />
                </SelectTrigger>
                <SelectContent>
                  {activeDoctors.map(doctor => (
                    <SelectItem key={doctor.id} value={doctor.id}>
                      {doctor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Next Appointment */}
            <div className="space-y-2">
              <Label>Următoarea programare</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="date"
                  value={nextAppointmentDate}
                  onChange={(e) => setNextAppointmentDate(e.target.value)}
                />
                <Input
                  type="time"
                  value={nextAppointmentTime}
                  onChange={(e) => setNextAppointmentTime(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Add Treatment Button */}
          <div className="flex justify-end">
            <Button 
              onClick={() => setTreatmentDialogOpen(true)} 
              className="gap-2"
              disabled={!selectedPatientId}
            >
              <Plus className="h-4 w-4" />
              Adaugă Tratament
            </Button>
          </div>

          {/* Treatments Table */}
          {planItems.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Dinte</TableHead>
                    <TableHead>Denumire</TableHead>
                    <TableHead className="w-40">Medic</TableHead>
                    <TableHead className="w-20 text-center">Cant.</TableHead>
                    <TableHead className="w-28 text-right">Lei</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planItems.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select 
                          value={item.toothNumber?.toString() || 'none'} 
                          onValueChange={(val) => handleUpdateItem(item.id, 'toothNumber', val === 'none' ? null : parseInt(val))}
                        >
                          <SelectTrigger className="w-16 h-8">
                            <SelectValue placeholder="-" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">-</SelectItem>
                            {allTeeth.map(tooth => (
                              <SelectItem key={tooth} value={tooth.toString()}>{tooth}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="font-medium">{item.treatmentName}</TableCell>
                      <TableCell>
                        <Select 
                          value={item.doctorId} 
                          onValueChange={(val) => handleUpdateItem(item.id, 'doctorId', val)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {activeDoctors.map(doctor => (
                              <SelectItem key={doctor.id} value={doctor.id}>{doctor.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-16 h-8 text-center"
                          min={1}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.price}
                          onChange={(e) => handleUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                          className="w-24 h-8 text-right"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="bg-muted/50 p-3 text-right font-bold text-lg">
                TOTAL: {total.toFixed(2)} LEI
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Preview (hidden but used for print) */}
      <div className="hidden">
        <div ref={printRef}>
          <div className="header">
            <div style={{ textAlign: 'right', fontSize: '11px' }}>
              <p>0721.702.820</p>
              <p>perfectsmilevarteju@gmail.com</p>
              <p>www.perfectsmileglim.ro</p>
              <p>Str. București 68-70, Varteju, Magurele</p>
            </div>
            <h1 style={{ marginTop: '20px' }}>Chirurgie</h1>
          </div>

          <div className="section">
            <p className="clinic-name">PERFECT SMILE GLIM</p>
            <p>Str. București, Nr 68-70</p>
            <p>Vârteju, Ilfov</p>
          </div>

          <div className="section">
            <p><strong>Medic:</strong> {selectedDoctor?.name || '-'}</p>
          </div>

          <div className="section">
            <p><strong>Pacient:</strong> {selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name}` : '-'}</p>
            {patientAge !== null && <p style={{ marginLeft: '60px' }}>Vârsta: {patientAge} ani</p>}
          </div>

          {nextAppointmentDate && (
            <div className="section">
              <p><strong>Următoarea programare pe</strong> {format(new Date(nextAppointmentDate), 'dd.MM.yyyy', { locale: ro })} la ora {nextAppointmentTime || '00:00'}</p>
            </div>
          )}

          <div className="section">
            <p className="section-title">Diagnostic</p>
            {/* Dental Chart Visual */}
            <div className="dental-chart">
              <div className="dental-row">
                {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(tooth => (
                  <div key={tooth} className="tooth">{tooth}</div>
                ))}
              </div>
              <div className="dental-row">
                {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map(tooth => (
                  <div key={tooth} className="tooth">{tooth}</div>
                ))}
              </div>
              <p className="disclaimer">Disclaimer plan tratament</p>
            </div>
          </div>

          <div className="section">
            <p className="section-title">Tratamente</p>
            <table>
              <thead>
                <tr>
                  <th>Dinți</th>
                  <th>Denumire</th>
                  <th>Medic</th>
                  <th>Cant</th>
                  <th>LEI</th>
                </tr>
              </thead>
              <tbody>
                {planItems.map(item => {
                  const doctor = doctors.find(d => d.id === item.doctorId);
                  return (
                    <tr key={item.id}>
                      <td>{item.toothNumber || '-'}</td>
                      <td>{item.treatmentName}</td>
                      <td>{doctor?.name || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{item.price.toFixed(0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <p className="total" style={{ textAlign: 'right' }}>{total.toFixed(2)}</p>
          </div>

          <div className="total">TOTAL: {total.toFixed(2)} LEI</div>
        </div>
      </div>

      {/* Treatment List Dialog */}
      <TreatmentListDialog
        open={treatmentDialogOpen}
        onClose={() => setTreatmentDialogOpen(false)}
        treatments={treatments}
        onSelectTreatment={handleAddTreatment}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge planul de tratament?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune nu poate fi anulată. Planul de tratament va fi șters definitiv.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePlan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
