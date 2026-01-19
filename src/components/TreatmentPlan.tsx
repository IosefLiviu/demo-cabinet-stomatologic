import { useState, useRef } from 'react';
import { format, differenceInYears } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Plus, Printer, X, Search, Save } from 'lucide-react';
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TreatmentListDialog } from './TreatmentListDialog';
import { Patient } from '@/hooks/usePatients';
import { useTreatmentPlans, TreatmentPlanItem as TreatmentPlanItemType } from '@/hooks/useTreatmentPlans';
import { MiniDentalChart } from './MiniDentalChart';

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
  toothNumbers: number[];
  treatmentName: string;
  doctorId: string;
  unitPrice: number;
}

interface TreatmentPlanProps {
  patients: Patient[];
  treatments: Treatment[];
  doctors: Doctor[];
}

// FDI notation - permanent teeth
const upperPermanentTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerPermanentTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// FDI notation - deciduous (baby) teeth
const upperDeciduousTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerDeciduousTeeth = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

// All teeth combined
const allTeeth = [
  ...upperPermanentTeeth,
  ...lowerPermanentTeeth,
  ...upperDeciduousTeeth,
  ...lowerDeciduousTeeth,
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
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  const { loading, saveTreatmentPlan } = useTreatmentPlans();

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

  const resetForm = () => {
    setSelectedDoctorId('');
    setNextAppointmentDate('');
    setNextAppointmentTime('');
    setPlanItems([]);
    setDiscountPercent(0);
  };

  const handleAddTreatment = (treatment: Treatment) => {
    const newItem: LocalTreatmentPlanItem = {
      id: `${treatment.id}-${Date.now()}`,
      treatmentId: treatment.id,
      toothNumbers: [],
      treatmentName: treatment.name,
      doctorId: selectedDoctorId || activeDoctors[0]?.id || '',
      unitPrice: treatment.default_price || 0,
    };
    setPlanItems([...planItems, newItem]);
  };

  const handleToggleTooth = (itemId: string, tooth: number) => {
    setPlanItems(planItems.map(item => {
      if (item.id !== itemId) return item;
      const hasThisTooth = item.toothNumbers.includes(tooth);
      return {
        ...item,
        toothNumbers: hasThisTooth 
          ? item.toothNumbers.filter(t => t !== tooth)
          : [...item.toothNumbers, tooth].sort((a, b) => a - b)
      };
    }));
  };

  const handleRemoveItem = (itemId: string) => {
    setPlanItems(planItems.filter(item => item.id !== itemId));
  };

  const handleUpdateItem = (itemId: string, field: keyof LocalTreatmentPlanItem, value: any) => {
    setPlanItems(planItems.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const getItemTotal = (item: LocalTreatmentPlanItem) => {
    const quantity = item.toothNumbers.length > 0 ? item.toothNumbers.length : 1;
    return item.unitPrice * quantity;
  };

  const subtotal = planItems.reduce((sum, item) => sum + getItemTotal(item), 0);
  const discountAmount = subtotal * (discountPercent / 100);
  const total = subtotal - discountAmount;

  const handleSave = async () => {
    if (!selectedPatientId) return;

    const itemsToSave: TreatmentPlanItemType[] = planItems.map(item => ({
      treatmentId: item.treatmentId,
      treatmentName: item.treatmentName,
      toothNumber: item.toothNumbers.length > 0 ? item.toothNumbers[0] : null,
      doctorId: item.doctorId,
      quantity: item.toothNumbers.length > 0 ? item.toothNumbers.length : 1,
      price: item.unitPrice,
    }));

    const savedPlanId = await saveTreatmentPlan(
      selectedPatientId,
      selectedDoctorId || undefined,
      nextAppointmentDate || undefined,
      nextAppointmentTime || undefined,
      itemsToSave
    );

    if (savedPlanId) {
      resetForm();
    }
  };

  const handleNewPlan = () => {
    resetForm();
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
            body { font-family: Arial, sans-serif; padding: 20px; color: #1a365d; }
            .header { 
              display: flex; justify-content: space-between; align-items: flex-start; 
              margin-bottom: 20px; border-bottom: 3px solid #b8860b; padding-bottom: 15px;
              background: linear-gradient(to right, #fef9e7, #fff8e1, #fef9e7);
              padding: 15px; border-radius: 8px;
            }
            .logo-section { display: flex; align-items: center; gap: 10px; }
            .logo { width: 120px; height: 80px; object-fit: contain; }
            .header h1 { font-size: 18px; margin: 0; color: #b8860b; }
            .header p { margin: 2px 0; font-size: 12px; }
            .clinic-name { font-weight: bold; font-size: 14px; color: #b8860b; }
            .section { margin: 15px 0; }
            .section-title { font-weight: bold; margin-bottom: 5px; color: #b8860b; }
            .info-line { margin: 3px 0; font-size: 13px; }
            .dental-chart { margin: 20px 0; text-align: center; }
            .dental-row { display: flex; justify-content: center; gap: 2px; margin: 5px 0; }
            .tooth { width: 24px; height: 30px; border: 1px solid #b8860b; text-align: center; font-size: 10px; line-height: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
            th, td { border: 1px solid #b8860b; padding: 6px; text-align: left; }
            th { background: linear-gradient(to bottom, #b8860b, #9a7209); color: #fff; }
            .total { font-weight: bold; text-align: right; margin-top: 10px; font-size: 14px; color: #b8860b; }
            .disclaimer { font-size: 10px; color: #666; margin-top: 5px; }
            .clinic-contact { text-align: right; font-size: 11px; color: #b8860b; }
            .clinic-contact p { margin: 2px 0; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  {planItems.map(item => {
                    const quantity = item.toothNumbers.length > 0 ? item.toothNumbers.length : 1;
                    const itemTotal = getItemTotal(item);
                    return (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-auto min-w-16 h-8 text-xs">
                              {item.toothNumbers.length > 0 
                                ? (item.toothNumbers.length <= 3 
                                    ? item.toothNumbers.join(', ') 
                                    : `${item.toothNumbers.length} dinți`)
                                : '-'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3" align="start">
                            <div className="space-y-3">
                              <p className="text-sm font-medium">Selectează dinții</p>
                              
                              {/* Mini dental chart preview */}
                              <MiniDentalChart 
                                treatedTeeth={item.toothNumbers} 
                                className="pointer-events-none opacity-80"
                              />
                              
                              {/* Selection buttons */}
                              <div className="space-y-1">
                                <div className="text-[10px] text-muted-foreground text-center">Superior permanent</div>
                                <div className="grid grid-cols-8 gap-1">
                                  {upperPermanentTeeth.map(tooth => (
                                    <Button
                                      key={tooth}
                                      variant={item.toothNumbers.includes(tooth) ? "default" : "outline"}
                                      size="sm"
                                      className="h-7 w-7 p-0 text-xs"
                                      onClick={() => handleToggleTooth(item.id, tooth)}
                                    >
                                      {tooth}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] text-muted-foreground text-center">De lapte superior</div>
                                <div className="flex justify-center gap-1">
                                  {upperDeciduousTeeth.map(tooth => (
                                    <Button
                                      key={tooth}
                                      variant={item.toothNumbers.includes(tooth) ? "default" : "outline"}
                                      size="sm"
                                      className="h-7 w-7 p-0 text-xs rounded-full border-dashed"
                                      onClick={() => handleToggleTooth(item.id, tooth)}
                                    >
                                      {tooth}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="border-t my-2" />
                              
                              <div className="space-y-1">
                                <div className="text-[10px] text-muted-foreground text-center">De lapte inferior</div>
                                <div className="flex justify-center gap-1">
                                  {lowerDeciduousTeeth.map(tooth => (
                                    <Button
                                      key={tooth}
                                      variant={item.toothNumbers.includes(tooth) ? "default" : "outline"}
                                      size="sm"
                                      className="h-7 w-7 p-0 text-xs rounded-full border-dashed"
                                      onClick={() => handleToggleTooth(item.id, tooth)}
                                    >
                                      {tooth}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              <div className="space-y-1">
                                <div className="text-[10px] text-muted-foreground text-center">Inferior permanent</div>
                                <div className="grid grid-cols-8 gap-1">
                                  {lowerPermanentTeeth.map(tooth => (
                                    <Button
                                      key={tooth}
                                      variant={item.toothNumbers.includes(tooth) ? "default" : "outline"}
                                      size="sm"
                                      className="h-7 w-7 p-0 text-xs"
                                      onClick={() => handleToggleTooth(item.id, tooth)}
                                    >
                                      {tooth}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between pt-2 border-t">
                                <p className="text-xs text-muted-foreground">
                                  Selectați: <span className="font-medium text-foreground">{item.toothNumbers.length}</span> dinți
                                </p>
                                {item.toothNumbers.length > 0 && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-xs"
                                    onClick={() => handleUpdateItem(item.id, 'toothNumbers', [])}
                                  >
                                    Resetează
                                  </Button>
                                )}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
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
                      <TableCell className="text-center">
                        {quantity}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => handleUpdateItem(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                            className="w-20 h-8 text-right"
                          />
                          {quantity > 1 && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              = {itemTotal.toFixed(0)}
                            </span>
                          )}
                        </div>
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
                    );
                  })}
                </TableBody>
              </Table>
              <div className="bg-muted/50 p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Label className="text-sm font-medium">Discount %</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                    className="w-20 h-8"
                  />
                  {discountPercent > 0 && (
                    <span className="text-sm text-muted-foreground">
                      (-{discountAmount.toFixed(2)} LEI)
                    </span>
                  )}
                </div>
                <div className="text-right">
                  {discountPercent > 0 && (
                    <div className="text-sm text-muted-foreground line-through">
                      {subtotal.toFixed(2)} LEI
                    </div>
                  )}
                  <div className="font-bold text-lg">
                    TOTAL: {total.toFixed(2)} LEI
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Print Preview (hidden but used for print) */}
      <div className="hidden">
        <div ref={printRef}>
          <div className="header">
            <div className="logo-section">
              <img src="/images/perfect-smile-logo-print.jpg" alt="Perfect Smile Logo" className="logo" />
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                PERFECT SMILE GLIM
              </div>
            </div>
            <div className="clinic-contact">
              <p>0721.702.820</p>
              <p>perfectsmilevarteju@gmail.com</p>
              <p>www.perfectsmileglim.ro</p>
              <p>Str. București 68-70, Varteju, Magurele</p>
            </div>
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
                  const quantity = item.toothNumbers.length > 0 ? item.toothNumbers.length : 1;
                  const itemTotal = getItemTotal(item);
                  return (
                    <tr key={item.id}>
                      <td>{item.toothNumbers.length > 0 ? item.toothNumbers.join(', ') : '-'}</td>
                      <td>{item.treatmentName}</td>
                      <td>{doctor?.name || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{quantity}</td>
                      <td style={{ textAlign: 'right' }}>{itemTotal.toFixed(0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {discountPercent > 0 && (
              <>
                <p className="total" style={{ textAlign: 'right' }}>Subtotal: {subtotal.toFixed(2)} LEI</p>
                <p className="total" style={{ textAlign: 'right' }}>Discount ({discountPercent}%): -{discountAmount.toFixed(2)} LEI</p>
              </>
            )}
          </div>

          <div className="total">TOTAL: {total.toFixed(2)} LEI</div>
          
          <div style={{ marginTop: '30px', paddingTop: '10px', borderTop: '2px solid #b8860b' }}>
            <div style={{ textAlign: 'center', fontSize: '9px', color: '#666' }}>
              <p><strong>PERFECT SMILE GLIM SRL</strong> | Str. București 68-70, Vârteju, Măgurele, Ilfov</p>
              <p>Tel: 0721.702.820 | Email: perfectsmilevarteju@gmail.com | www.perfectsmileglim.ro</p>
              <p style={{ marginTop: '5px', fontSize: '8px', color: '#999' }}>© {new Date().getFullYear()} Perfect Smile Glim. Toate drepturile rezervate.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Treatment List Dialog */}
      <TreatmentListDialog
        open={treatmentDialogOpen}
        onClose={() => setTreatmentDialogOpen(false)}
        treatments={treatments}
        onSelectTreatment={handleAddTreatment}
      />

    </div>
  );
}
