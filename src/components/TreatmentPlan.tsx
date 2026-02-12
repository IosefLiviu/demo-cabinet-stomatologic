import { useState, useRef, useEffect } from 'react';
import { format, differenceInYears } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { ro } from 'date-fns/locale';
import { Plus, Printer, X, Search, Save, Check } from 'lucide-react';
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
import { ToothSelector } from './dental/ToothSelector';
import { SvgTooth } from './dental/SvgTooth';
import { supabase } from '@/integrations/supabase/client';
import { CLINIC, getClinicCopyright, getLogoPrintUrl } from '@/constants/clinic';
import { escapeHtml, escapeNumberArray } from '@/lib/print-utils';

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
  duration: number;
  initialPrice: number;
  laborator: number;
  cas: number;
  discountPercent: number;
  // Completion tracking
  completedAt?: string;
  paymentStatus?: string;
  paidAmount?: number;
  // When true, price is NOT multiplied by teeth count (arch/quadrant mode)
  isArchMode?: boolean;
}

interface InitialPlanData {
  id: string;
  patientId: string;
  name?: string;
  doctorId?: string;
  nextAppointmentDate?: string;
  nextAppointmentTime?: string;
  discountPercent?: number;
  items: {
    treatmentId?: string;
    treatmentName: string;
    toothNumbers: number[];
    doctorId: string;
    duration: number;
    initialPrice: number;
    laborator: number;
    cas: number;
    discountPercent: number;
    // Completion tracking
    completedAt?: string;
    paymentStatus?: string;
    paidAmount?: number;
  }[];
}

interface TreatmentPlanProps {
  patients: Patient[];
  treatments: Treatment[];
  doctors: Doctor[];
  initialPatientId?: string;
  initialPlan?: InitialPlanData;
  onPlanSaved?: () => void;
}

// FDI notation - permanent teeth
const upperPermanentTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerPermanentTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// FDI notation - deciduous (baby) teeth
const upperDeciduousTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerDeciduousTeeth = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

// Quadrant-based teeth groupings (FDI notation)
const quadrant1 = [18, 17, 16, 15, 14, 13, 12, 11]; // Upper right
const quadrant2 = [21, 22, 23, 24, 25, 26, 27, 28]; // Upper left
const quadrant3 = [31, 32, 33, 34, 35, 36, 37, 38]; // Lower left
const quadrant4 = [48, 47, 46, 45, 44, 43, 42, 41]; // Lower right
const upperArch = [...quadrant1, ...quadrant2]; // Maxilar sus
const lowerArch = [...quadrant4, ...quadrant3]; // Mandibular jos

// All teeth combined
const allTeeth = [
  ...upperPermanentTeeth,
  ...lowerPermanentTeeth,
  ...upperDeciduousTeeth,
  ...lowerDeciduousTeeth,
];

export function TreatmentPlan({ patients, treatments, doctors, initialPatientId, initialPlan, onPlanSaved }: TreatmentPlanProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string>(initialPatientId || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [planItems, setPlanItems] = useState<LocalTreatmentPlanItem[]>([]);
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [planName, setPlanName] = useState<string>('');
  const [editingPlanId, setEditingPlanId] = useState<string | undefined>();
  // Selection mode per item: 'teeth' for individual, 'arch' for quadrant/arch selection
  const [selectionMode, setSelectionMode] = useState<Record<string, 'teeth' | 'arch'>>({});
  // Patient dental status for tooltips
  const [patientDentalStatus, setPatientDentalStatus] = useState<Record<number, { status: string; notes?: string }>>({});
  // Patient condition codes per tooth for overlays
  const [patientConditionCodes, setPatientConditionCodes] = useState<Record<number, string[]>>({});

  // Load patient dental status and condition codes when patient changes
  useEffect(() => {
    const loadDentalStatus = async () => {
      if (!selectedPatientId) {
        setPatientDentalStatus({});
        setPatientConditionCodes({});
        return;
      }

      const [statusRes, conditionsRes] = await Promise.all([
        supabase
          .from('dental_status')
          .select('tooth_number, status, notes')
          .eq('patient_id', selectedPatientId),
        supabase
          .from('tooth_conditions')
          .select('tooth_number, condition:dental_conditions(code)')
          .eq('patient_id', selectedPatientId),
      ]);

      if (statusRes.error) console.error('Error loading dental status:', statusRes.error);
      if (conditionsRes.error) console.error('Error loading tooth conditions:', conditionsRes.error);

      const statusMap: Record<number, { status: string; notes?: string }> = {};
      (statusRes.data || []).forEach((item: any) => {
        statusMap[item.tooth_number] = {
          status: item.status,
          notes: item.notes,
        };
      });
      setPatientDentalStatus(statusMap);

      const codesMap: Record<number, string[]> = {};
      (conditionsRes.data || []).forEach((item: any) => {
        if (!codesMap[item.tooth_number]) codesMap[item.tooth_number] = [];
        if (item.condition?.code) codesMap[item.tooth_number].push(item.condition.code);
      });
      setPatientConditionCodes(codesMap);
    };

    loadDentalStatus();
  }, [selectedPatientId]);

  // Update selectedPatientId when initialPatientId changes
  useEffect(() => {
    if (initialPatientId) {
      setSelectedPatientId(initialPatientId);
    }
  }, [initialPatientId]);

  // Load initial plan for editing
  useEffect(() => {
    if (initialPlan) {
      setSelectedPatientId(initialPlan.patientId);
      setSelectedDoctorId(initialPlan.doctorId || '');
      setDiscountPercent(initialPlan.discountPercent || 0);
      setPlanName(initialPlan.name || '');
      setEditingPlanId(initialPlan.id);
      
      // Load completed teeth and apply them to the plan items
      const loadAndApplyCompletedTeeth = async () => {
        const { data } = await supabase
          .from('appointment_treatments')
          .select('treatment_name,tooth_numbers,appointments!inner(status,patient_id)')
          .eq('appointments.status', 'completed')
          .eq('appointments.patient_id', initialPlan.patientId);

        const completedTeethMap = new Map<string, Set<number>>();
        (data || []).forEach((row: any) => {
          const name = row.treatment_name as string;
          if (!completedTeethMap.has(name)) completedTeethMap.set(name, new Set());
          (row.tooth_numbers || []).forEach((t: number) => completedTeethMap.get(name)!.add(t));
        });

        // Map initial plan items and subtract completed teeth
        const adjustedItems = initialPlan.items.map((item, index) => {
          const baseItem: LocalTreatmentPlanItem = {
            id: `edit-${index}-${Date.now()}`,
            treatmentId: item.treatmentId,
            toothNumbers: item.toothNumbers,
            treatmentName: item.treatmentName,
            doctorId: item.doctorId,
            duration: item.duration,
            initialPrice: item.initialPrice,
            laborator: item.laborator,
            cas: item.cas,
            discountPercent: item.discountPercent,
            // Completion tracking - load from initial plan
            completedAt: (item as any).completedAt,
            paymentStatus: (item as any).paymentStatus,
            paidAmount: (item as any).paidAmount || 0,
          };

          // Skip items without teeth
          if (!baseItem.toothNumbers || baseItem.toothNumbers.length === 0) {
            return baseItem;
          }

          const completed = completedTeethMap.get(baseItem.treatmentName);
          if (!completed || completed.size === 0) {
            return baseItem;
          }

          const beforeCount = baseItem.toothNumbers.length;
          const remainingTeeth = baseItem.toothNumbers.filter(t => !completed.has(t));

          // If nothing changed, keep item as is
          if (remainingTeeth.length === beforeCount) {
            return baseItem;
          }

          // Scale CAS proportionally
          const ratio = beforeCount > 0 ? remainingTeeth.length / beforeCount : 1;
          const adjustedCas = Math.round((baseItem.cas * ratio) * 100) / 100;

          return {
            ...baseItem,
            toothNumbers: remainingTeeth,
            cas: adjustedCas,
          };
        });

        setPlanItems(adjustedItems);
      };

      loadAndApplyCompletedTeeth();
    }
  }, [initialPlan]);

  // Also apply completed teeth filter when patient changes (for new plans or switching patients)
  useEffect(() => {
    const applyCompletedTeethFilter = async () => {
      if (!selectedPatientId || planItems.length === 0) {
        return;
      }

      const { data } = await supabase
        .from('appointment_treatments')
        .select('treatment_name,tooth_numbers,appointments!inner(status,patient_id)')
        .eq('appointments.status', 'completed')
        .eq('appointments.patient_id', selectedPatientId);

      const map = new Map<string, Set<number>>();
      (data || []).forEach((row: any) => {
        const name = row.treatment_name as string;
        if (!map.has(name)) map.set(name, new Set());
        (row.tooth_numbers || []).forEach((t: number) => map.get(name)!.add(t));
      });

      // Only apply if there are completed teeth
      if (map.size === 0) return;

      setPlanItems(prev =>
        prev.map(item => {
          if (!item.toothNumbers || item.toothNumbers.length === 0) return item;

          const completed = map.get(item.treatmentName);
          if (!completed || completed.size === 0) return item;

          const beforeCount = item.toothNumbers.length;
          const remainingTeeth = item.toothNumbers.filter(t => !completed.has(t));

          if (remainingTeeth.length === beforeCount) return item;

          const ratio = beforeCount > 0 ? remainingTeeth.length / beforeCount : 1;
          const nextCas = Math.round((item.cas * ratio) * 100) / 100;

          return {
            ...item,
            toothNumbers: remainingTeeth,
            cas: nextCas,
          };
        })
      );
    };

    // Don't run on initial mount or when initialPlan is being loaded
    if (!initialPlan) {
      applyCompletedTeethFilter();
    }
  }, [selectedPatientId]);

  const { loading, saveTreatmentPlan } = useTreatmentPlans();

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const selectedDoctor = doctors.find(d => d.id === selectedDoctorId);
  const activeDoctors = doctors.filter(d => d.is_active);

  const patientAge = selectedPatient?.date_of_birth 
    ? differenceInYears(new Date(), new Date(selectedPatient.date_of_birth))
    : null;

  const filteredPatients = patients.filter(p => {
    const lowerQuery = patientSearch.toLowerCase().trim();
    if (!lowerQuery) return true;
    
    const firstName = p.first_name.toLowerCase();
    const lastName = p.last_name.toLowerCase();
    const fullName = `${firstName} ${lastName}`;
    const reversedName = `${lastName} ${firstName}`;
    const phone = p.phone || '';
    
    // Split query into individual words for flexible matching
    const queryWords = lowerQuery.split(/\s+/).filter(word => word.length > 0);
    
    // If single word, check if it appears in any field
    if (queryWords.length <= 1) {
      return (
        firstName.includes(lowerQuery) ||
        lastName.includes(lowerQuery) ||
        phone.includes(patientSearch)
      );
    }
    
    // For multiple words, check if ALL words appear in name (any order)
    const allWordsMatch = queryWords.every(word =>
      firstName.includes(word) ||
      lastName.includes(word)
    );
    
    // Also check direct full name match in either order
    const directMatch = 
      fullName.includes(lowerQuery) ||
      reversedName.includes(lowerQuery);
    
    return allWordsMatch || directMatch;
  });

  const resetForm = () => {
    setSelectedDoctorId('');
    setPlanItems([]);
    setDiscountPercent(0);
    setPlanName('');
    setEditingPlanId(undefined);
  };

  const handleAddTreatment = (treatment: Treatment) => {
    const newItem: LocalTreatmentPlanItem = {
      id: `${treatment.id}-${Date.now()}`,
      treatmentId: treatment.id,
      toothNumbers: [],
      treatmentName: treatment.name,
      doctorId: selectedDoctorId || activeDoctors[0]?.id || '',
      duration: treatment.default_duration || 30,
      initialPrice: treatment.default_price || 0,
      laborator: 0,
      cas: treatment.cas || 0,
      discountPercent: 0,
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

  // Helper to count how many full arch groups are selected
  const countArchGroups = (toothNumbers: number[]): number => {
    let count = 0;
    // Check each quadrant
    if (quadrant1.every(t => toothNumbers.includes(t))) count++;
    if (quadrant2.every(t => toothNumbers.includes(t))) count++;
    if (quadrant3.every(t => toothNumbers.includes(t))) count++;
    if (quadrant4.every(t => toothNumbers.includes(t))) count++;
    return Math.max(1, count); // At least 1 if any teeth are selected
  };

  // Handle selecting/deselecting an entire arch or quadrant
  const handleArchSelection = (itemId: string, teethToToggle: number[]) => {
    setPlanItems(planItems.map(item => {
      if (item.id !== itemId) return item;
      
      // Check if all teeth in this group are already selected
      const allSelected = teethToToggle.every(t => item.toothNumbers.includes(t));
      
      let newToothNumbers: number[];
      
      if (allSelected) {
        // Deselect all teeth in the group
        newToothNumbers = item.toothNumbers.filter(t => !teethToToggle.includes(t));
      } else {
        // Select all teeth in the group that aren't already selected
        const teethToAdd = teethToToggle.filter(t => !item.toothNumbers.includes(t));
        newToothNumbers = [...item.toothNumbers, ...teethToAdd].sort((a, b) => a - b);
      }
      
      return {
        ...item,
        toothNumbers: newToothNumbers,
        isArchMode: true, // Mark as arch mode when using arch selection
      };
    }));
  };

  // Get the current selection mode for an item
  const getSelectionMode = (itemId: string): 'teeth' | 'arch' => {
    return selectionMode[itemId] || 'teeth';
  };

  const handleRemoveItem = (itemId: string) => {
    setPlanItems(planItems.filter(item => item.id !== itemId));
  };

  const handleUpdateItem = (itemId: string, field: keyof LocalTreatmentPlanItem, value: any) => {
    setPlanItems(planItems.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  // Helper to get quantity based on mode
  const getQuantity = (item: LocalTreatmentPlanItem): number => {
    if (item.toothNumbers.length === 0) return 1;
    if (item.isArchMode) {
      // In arch mode, quantity = number of complete arch groups
      return countArchGroups(item.toothNumbers);
    }
    // Individual teeth mode - quantity = number of teeth
    return item.toothNumbers.length;
  };

  // CAS is treated as TOTAL for the whole line item (not per-tooth).
  // Initial price is per tooth and multiplied by quantity (teeth or arch groups).
  const getPrice = (item: LocalTreatmentPlanItem) => {
    const quantity = getQuantity(item);
    const casPerUnit = item.cas / quantity;
    return Math.max(0, item.initialPrice - casPerUnit);
  };

  // Calculate "De plată" considering quantity, TOTAL CAS and discount
  // Formula: ((initialPrice * quantity) - cas_total) * (1 - discount/100)
  const getDePlata = (item: LocalTreatmentPlanItem) => {
    const quantity = getQuantity(item);
    const totalInitialPrice = item.initialPrice * quantity;
    const subtotalAfterCas = totalInitialPrice - item.cas;
    const discount = subtotalAfterCas * (item.discountPercent / 100);
    return Math.max(0, subtotalAfterCas - discount);
  };

  const getItemTotal = (item: LocalTreatmentPlanItem) => {
    const quantity = getQuantity(item);
    return item.initialPrice * quantity;
  };

  // Helper to check if an item is fully paid (cash, card, or achitat all count as paid)
  const isItemFullyPaid = (item: LocalTreatmentPlanItem) => 
    item.paymentStatus === 'achitat' || item.paymentStatus === 'cash' || item.paymentStatus === 'card';

  // Filter out fully paid items for totals calculation
  const unpaidItems = planItems.filter(item => !isItemFullyPaid(item));
  const paidItems = planItems.filter(item => isItemFullyPaid(item));
  
  const subtotal = planItems.reduce((sum, item) => sum + getItemTotal(item), 0);
  const totalCas = planItems.reduce((sum, item) => sum + item.cas, 0);
  const totalLaborator = planItems.reduce((sum, item) => {
    const quantity = getQuantity(item);
    return sum + (item.laborator * quantity);
  }, 0);
  
  // De plată excludes fully paid items
  const totalDePlata = unpaidItems.reduce((sum, item) => sum + getDePlata(item), 0);
  const totalPaid = paidItems.reduce((sum, item) => sum + getDePlata(item), 0);
  
  const allDePlata = planItems.reduce((sum, item) => sum + getDePlata(item), 0);
  const discountAmount = allDePlata * (discountPercent / 100);
  const total = allDePlata - discountAmount;

  const handleSave = async () => {
    if (!selectedPatientId) return;

    const itemsToSave: TreatmentPlanItemType[] = planItems.map(item => ({
      treatmentId: item.treatmentId,
      treatmentName: item.treatmentName,
      toothNumber: item.toothNumbers.length > 0 ? item.toothNumbers[0] : null,
      toothNumbers: item.toothNumbers,
      doctorId: item.doctorId,
      quantity: item.toothNumbers.length > 0 ? item.toothNumbers.length : 1,
      price: item.initialPrice,
      duration: item.duration,
      laborator: item.laborator,
      cas: item.cas,
      discountPercent: item.discountPercent,
    }));

    const savedPlanId = await saveTreatmentPlan(
      selectedPatientId,
      selectedDoctorId || undefined,
      undefined,
      undefined,
      itemsToSave,
      editingPlanId,
      discountPercent,
      planName || undefined
    );

    if (savedPlanId) {
      // Keep the plan open after saving - just update the editingPlanId to the saved one
      setEditingPlanId(savedPlanId);
      onPlanSaved?.();
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

    const html = `
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
            .tooth { width: 28px; text-align: center; font-size: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; }
            .tooth svg { width: 24px; height: 36px; }
            .tooth.selected svg { filter: drop-shadow(0 0 3px #b8860b); }
            .tooth.selected { border: 2px solid #b8860b; border-radius: 4px; background: linear-gradient(to bottom, #fef9e7, #fff8e1); }
            .tooth .checkmark { position: absolute; top: 0; right: 0; color: #228B22; font-size: 10px; font-weight: bold; background: white; border-radius: 50%; width: 12px; height: 12px; display: flex; align-items: center; justify-content: center; }
            .tooth .tooth-number { font-size: 7px; color: #666; margin-top: 1px; }
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
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    // Wait for all images to load before printing
    const images = printWindow.document.querySelectorAll('img');
    let loaded = 0;
    const total = images.length;
    if (total === 0) {
      printWindow.print();
      return;
    }
    const onImageReady = () => {
      loaded++;
      if (loaded >= total) {
        printWindow.print();
      }
    };
    images.forEach(img => {
      if (img.complete) {
        onImageReady();
      } else {
        img.addEventListener('load', onImageReady);
        img.addEventListener('error', onImageReady);
      }
    });
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
                       onKeyDown={(e) => e.stopPropagation()}
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

            {/* Plan Name */}
            <div className="space-y-2">
              <Label>Denumire plan</Label>
              <Input
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
                placeholder="ex: Plan protetică, Plan implant..."
              />
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
                    <TableHead className="w-32">Medic</TableHead>
                    <TableHead className="w-20 text-center">Durată</TableHead>
                    <TableHead className="w-24 text-right">Preț inițial</TableHead>
                    <TableHead className="w-20 text-right">Laborator</TableHead>
                    <TableHead className="w-20 text-right">Preț</TableHead>
                    <TableHead className="w-20 text-right text-green-600">CAS</TableHead>
                    <TableHead className="w-20 text-right text-orange-500">Disc. %</TableHead>
                    <TableHead className="w-24 text-right text-purple-600">De plată</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {planItems.map(item => {
                    // IMPORTANT: quantity must follow selection mode.
                    // - Dinți: number of teeth
                    // - Maxilar (cadrane/arcade): number of selected arch groups
                    const quantity = getQuantity(item);
                    const price = getPrice(item);
                    const dePlata = getDePlata(item);
                    const isCompleted = !!item.completedAt;
                    const isPaid = isItemFullyPaid(item);
                    const isPartial = item.paymentStatus === 'partial';
                    return (
                    <TableRow key={item.id} className={isPaid ? 'bg-success/10' : (isCompleted || isPartial) ? 'bg-warning/10' : ''}>
                      <TableCell>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-auto min-w-16 h-8 text-xs">
                              {item.toothNumbers.length > 0 
                                ? (item.isArchMode || getSelectionMode(item.id) === 'arch'
                                    ? `${countArchGroups(item.toothNumbers)} ${countArchGroups(item.toothNumbers) === 1 ? 'cadran' : 'cadrane'}`
                                    : (item.toothNumbers.length <= 3 
                                        ? item.toothNumbers.join(', ') 
                                        : `${item.toothNumbers.length} dinți`))
                                : '-'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3 bg-popover" align="start">
                            <ToothSelector
                              selectedTeeth={item.toothNumbers}
                              onToggleTooth={(tooth) => handleToggleTooth(item.id, tooth)}
                              onArchSelection={(teeth) => handleArchSelection(item.id, teeth)}
                              onReset={() => setPlanItems(planItems.map(pi => pi.id === item.id ? { ...pi, toothNumbers: [] } : pi))}
                              selectionMode={selectionMode[item.id] || 'teeth'}
                              onModeChange={(mode) => setSelectionMode(prev => ({ ...prev, [item.id]: mode }))}
                              isArchMode={item.isArchMode}
                              dentalStatus={patientDentalStatus}
                              conditionCodes={patientConditionCodes}
                            />
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                      <TableCell className="font-medium text-sm">{item.treatmentName}</TableCell>
                      <TableCell>
                        <Select 
                          value={item.doctorId} 
                          onValueChange={(val) => handleUpdateItem(item.id, 'doctorId', val)}
                        >
                          <SelectTrigger className="h-8 text-xs">
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
                          value={item.duration}
                          onChange={(e) => handleUpdateItem(item.id, 'duration', parseInt(e.target.value) || 0)}
                          className="w-16 h-8 text-center text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.initialPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'initialPrice', parseFloat(e.target.value) || 0)}
                          className="w-20 h-8 text-right text-xs"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.laborator}
                          onChange={(e) => handleUpdateItem(item.id, 'laborator', parseFloat(e.target.value) || 0)}
                          className="w-16 h-8 text-right text-xs"
                        />
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {(price * quantity).toFixed(0)}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.cas}
                          onChange={(e) => handleUpdateItem(item.id, 'cas', parseFloat(e.target.value) || 0)}
                          className="w-16 h-8 text-right text-xs text-green-600"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          value={item.discountPercent}
                          onChange={(e) => handleUpdateItem(item.id, 'discountPercent', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                          className="w-16 h-8 text-right text-xs text-orange-500"
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium text-purple-600">
                        {isPaid ? (
                          <span className="flex items-center justify-end gap-1 text-green-600">
                            <Check className="h-4 w-4" />
                            {dePlata.toFixed(0)}
                          </span>
                        ) : dePlata.toFixed(0)}
                      </TableCell>
                      <TableCell className="text-center">
                        {isPaid ? (
                          <Badge variant="outline" className="bg-success/20 text-success border-success/50">
                            Achitat
                          </Badge>
                        ) : item.paymentStatus === 'partial' ? (
                          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/50">
                            Parțial
                          </Badge>
                        ) : isCompleted ? (
                          <Badge variant="outline" className="bg-warning/20 text-warning border-warning/50">
                            Neachitat
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            În așteptare
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={isCompleted}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              <div className="bg-muted/50 p-3">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 text-sm">
                    <span>
                      <span className="text-muted-foreground">Preț total:</span>{' '}
                      <span className="font-medium">{subtotal.toFixed(0)} LEI</span>
                    </span>
                    <span>
                      <span className="text-muted-foreground">Laborator:</span>{' '}
                      <span className="font-medium">{totalLaborator.toFixed(0)} LEI</span>
                    </span>
                    <span>
                      <span className="text-green-600">CAS:</span>{' '}
                      <span className="font-medium text-green-600">{totalCas.toFixed(0)} LEI</span>
                    </span>
                    {totalPaid > 0 && (
                      <span>
                        <span className="text-success">Achitat:</span>{' '}
                        <span className="font-medium text-success">{totalPaid.toFixed(0)} LEI</span>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Label className="text-sm font-medium">Discount general %</Label>
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
                        (-{discountAmount.toFixed(0)} LEI)
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t flex justify-end">
                  <div className="text-right">
                    <div className="font-bold text-lg text-purple-600">
                      DE PLATĂ: {totalDePlata.toFixed(0)} LEI
                    </div>
                    {totalPaid > 0 && (
                      <div className="text-sm text-success">
                        (din total {(totalDePlata + totalPaid).toFixed(0)} LEI - achitat {totalPaid.toFixed(0)} LEI)
                      </div>
                    )}
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
              <img src={getLogoPrintUrl()} alt="Perfect Smile Logo" className="logo" />
              <div style={{ fontWeight: 'bold', fontSize: '14px' }}>
                {CLINIC.shortName}
              </div>
            </div>
            <div className="clinic-contact">
              <p>{CLINIC.phone}</p>
              <p>{CLINIC.email}</p>
              <p>{CLINIC.website}</p>
              <p>{CLINIC.address}</p>
            </div>
          </div>

          <div className="section">
            <p className="clinic-name">{CLINIC.shortName}</p>
            <p>{CLINIC.address}</p>
          </div>

          <div className="section">
            <p><strong>Medic:</strong> {escapeHtml(selectedDoctor?.name) || '-'}</p>
          </div>

          <div className="section">
            <p><strong>Pacient:</strong> {selectedPatient ? `${escapeHtml(selectedPatient.first_name)} ${escapeHtml(selectedPatient.last_name)}` : '-'}</p>
            {patientAge !== null && <p style={{ marginLeft: '60px' }}>Vârsta: {patientAge} ani</p>}
          </div>


          <div className="section">
            <p className="section-title">Diagnostic</p>
            {/* Dental Chart Visual with SVG teeth */}
            {(() => {
              const selectedTeeth = new Set(planItems.flatMap(item => item.toothNumbers));
              return (
                <div className="dental-chart">
                  <div className="dental-row">
                    {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(tooth => (
                      <div key={tooth} className={`tooth ${selectedTeeth.has(tooth) ? 'selected' : ''}`}>
                        {selectedTeeth.has(tooth) && <span className="checkmark">✓</span>}
                        <SvgTooth toothNumber={tooth} width={24} height={36} />
                        <span className="tooth-number">{tooth}</span>
                      </div>
                    ))}
                  </div>
                  <div className="dental-row">
                    {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map(tooth => (
                      <div key={tooth} className={`tooth ${selectedTeeth.has(tooth) ? 'selected' : ''}`}>
                        {selectedTeeth.has(tooth) && <span className="checkmark">✓</span>}
                        <SvgTooth toothNumber={tooth} isLower width={24} height={36} />
                        <span className="tooth-number">{tooth}</span>
                      </div>
                    ))}
                  </div>
                  <p className="disclaimer">Disclaimer plan tratament</p>
                </div>
              );
            })()}
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
                  const itemDePlata = getDePlata(item);
                  return (
                    <tr key={item.id}>
                      <td>{item.toothNumbers.length > 0 ? escapeNumberArray(item.toothNumbers, ', ') : '-'}</td>
                      <td>{escapeHtml(item.treatmentName)}</td>
                      <td>{escapeHtml(doctor?.name) || '-'}</td>
                      <td style={{ textAlign: 'center' }}>{quantity}</td>
                      <td style={{ textAlign: 'right' }}>{itemDePlata.toFixed(0)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {totalCas > 0 && (
              <p style={{ textAlign: 'right', fontSize: '12px', color: '#666' }}>CAS: {totalCas.toFixed(0)} LEI</p>
            )}
            {discountPercent > 0 && (
              <>
                <p className="total" style={{ textAlign: 'right' }}>Subtotal: {totalDePlata.toFixed(0)} LEI</p>
                <p className="total" style={{ textAlign: 'right' }}>Discount ({discountPercent}%): -{discountAmount.toFixed(0)} LEI</p>
              </>
            )}
          </div>

          <div className="total">DE PLATĂ: {total.toFixed(0)} LEI</div>
          
          <div style={{ marginTop: '30px', paddingTop: '10px', borderTop: '2px solid #b8860b' }}>
            <div style={{ textAlign: 'center', fontSize: '9px', color: '#666' }}>
              <p><strong>{CLINIC.name}</strong> | {CLINIC.address}</p>
              <p>Tel: {CLINIC.phone} | Email: {CLINIC.email} | {CLINIC.website}</p>
              <p style={{ marginTop: '5px', fontSize: '8px', color: '#999' }}>{getClinicCopyright()}</p>
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
