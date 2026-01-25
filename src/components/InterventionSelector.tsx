import { useState, useEffect } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { TreatmentListDialog } from './TreatmentListDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToothStatus } from './DentalChart';
import { useToothStatuses } from '@/hooks/useToothStatuses';
import { getToothImage } from './dental/toothImages';
import { supabase } from '@/integrations/supabase/client';
import { cleanDentalNotes } from '@/lib/cleanDentalNotes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Treatment {
  id: string;
  name: string;
  default_duration: number;
  default_price?: number;
  cas?: number;
  category?: string;
}

export interface ToothSelection {
  toothNumber: number;
  status: string; // Changed to string to support custom statuses from database
  notes?: string;
}

export interface SelectedIntervention {
  id: string;
  treatmentId: string;
  treatmentName: string;
  price: number;
  basePrice?: number; // Original per-tooth price for multiplication
  cas: number;
  laborator: number;
  duration: number;
  discountPercent: number;
  selectedTeeth: number[];
  teethDetails?: ToothSelection[];
  // Link to treatment plan item for tracking completion
  planItemId?: string;
  // When true, price is NOT multiplied by teeth count (arch/quadrant mode)
  isArchMode?: boolean;
  // Count of selected arch/quadrant groups for pricing
  archGroupCount?: number;
}

interface PatientToothStatus {
  tooth_number: number;
  status: string;
  notes?: string;
}

interface InterventionSelectorProps {
  treatments: Treatment[];
  interventions: SelectedIntervention[];
  onInterventionsChange: (interventions: SelectedIntervention[]) => void;
  isCasDisabled?: boolean;
  patientId?: string;
}

// FDI notation - permanent teeth
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

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

// Fallback status colors for legacy/enum-based statuses
const fallbackStatusColors: Record<string, string> = {
  healthy: 'bg-success/20 border-success text-success',
  cavity: 'bg-destructive/20 border-destructive text-destructive',
  filled: 'bg-cabinet-2/20 border-cabinet-2 text-cabinet-2',
  crown: 'bg-cabinet-4/20 border-cabinet-4 text-cabinet-4',
  missing: 'bg-muted border-muted-foreground/30 text-muted-foreground',
  implant: 'bg-cabinet-3/20 border-cabinet-3 text-cabinet-3',
  root_canal: 'bg-warning/20 border-warning text-warning',
  extraction_needed: 'bg-destructive/30 border-destructive text-destructive',
};

// Helper to generate color classes from hex color
const getColorClassesFromHex = (hexColor: string) => {
  return {
    bg: hexColor,
    border: hexColor,
    text: hexColor,
  };
};

// Map DB enum values to display names
const statusEnumToName: Record<string, string> = {
  'healthy': 'Sănătos',
  'cavity': 'Carie',
  'filled': 'Obt Foto',
  'crown': 'Coroană',
  'missing': 'Absent',
  'implant': 'Implant',
  'root_canal': 'OBT Canal',
  'extraction_needed': 'Rest Radicular',
};

export function InterventionSelector({
  treatments,
  interventions,
  onInterventionsChange,
  isCasDisabled = false,
  patientId,
}: InterventionSelectorProps) {
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [expandedInterventions, setExpandedInterventions] = useState<Set<string>>(new Set());
  const [toothDialog, setToothDialog] = useState<{
    open: boolean;
    interventionId: string;
    toothNumber: number;
    status: string; // Changed from ToothStatus to string to support custom statuses
    notes: string;
  } | null>(null);
  const [hoveredTooth, setHoveredTooth] = useState<{ interventionId: string; toothNumber: number } | null>(null);
  // Selection mode per intervention: 'teeth' for individual, 'arch' for quadrant/arch selection
  const [selectionMode, setSelectionMode] = useState<Record<string, 'teeth' | 'arch'>>({});
  // Patient dental status loaded from database
  const [patientDentalStatus, setPatientDentalStatus] = useState<PatientToothStatus[]>([]);
  
  // Fetch custom tooth statuses from database
  const { activeStatuses } = useToothStatuses();

  // Load patient dental status when patientId changes
  useEffect(() => {
    const loadPatientDentalStatus = async () => {
      if (!patientId) {
        setPatientDentalStatus([]);
        return;
      }

      const { data, error } = await supabase
        .from('dental_status')
        .select('tooth_number, status, notes')
        .eq('patient_id', patientId);

      if (error) {
        console.error('Error loading patient dental status:', error);
        return;
      }

      // Convert DB enum status to display names
      const convertedData = (data || []).map(d => ({
        tooth_number: d.tooth_number,
        status: statusEnumToName[d.status] || d.status,
        notes: d.notes || undefined,
      }));

      setPatientDentalStatus(convertedData);
    };

    loadPatientDentalStatus();
  }, [patientId]);

  // Get patient's saved dental status for a tooth
  const getPatientToothStatus = (toothNumber: number): PatientToothStatus | undefined => {
    return patientDentalStatus.find(t => t.tooth_number === toothNumber);
  };
  
  // Build dynamic status colors and labels from database
  const getStatusColor = (statusName: string): string => {
    const dbStatus = activeStatuses.find(s => s.name.toLowerCase() === statusName.toLowerCase());
    if (dbStatus) {
      return ''; // Will use inline style instead
    }
    return fallbackStatusColors[statusName] || fallbackStatusColors.healthy;
  };
  
  const getStatusHexColor = (statusName: string): string | null => {
    const dbStatus = activeStatuses.find(s => s.name.toLowerCase() === statusName.toLowerCase());
    return dbStatus?.color || null;
  };
  
  const getStatusLabel = (statusName: string): string => {
    const dbStatus = activeStatuses.find(s => s.name.toLowerCase() === statusName.toLowerCase());
    return dbStatus?.name || statusName;
  };

  const toggleExpanded = (interventionId: string) => {
    setExpandedInterventions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(interventionId)) {
        newSet.delete(interventionId);
      } else {
        newSet.add(interventionId);
      }
      return newSet;
    });
  };

  // Calculate totals
  const totalPretInitial = interventions.reduce((sum, i) => sum + i.price, 0);
  const totalLaborator = interventions.reduce((sum, i) => sum + (i.laborator || 0), 0);
  const totalPret = totalPretInitial - totalLaborator;
  const totalCas = interventions.reduce((sum, i) => sum + i.cas, 0);
  // Calculate De Plată with discount: (price - cas) * (1 - discount%)
  const totalDePlata = interventions.reduce((sum, i) => {
    const priceAfterCas = i.price - i.cas;
    const discountAmount = priceAfterCas * ((i.discountPercent || 0) / 100);
    return sum + (priceAfterCas - discountAmount);
  }, 0);
  const totalDuration = interventions.reduce((sum, i) => sum + i.duration, 0) || 30;

  const handleAddTreatment = (treatment: Treatment) => {
    const basePrice = treatment.default_price || 0;
    const newIntervention: SelectedIntervention = {
      id: `${treatment.id}-${Date.now()}`,
      treatmentId: treatment.id,
      treatmentName: treatment.name,
      price: basePrice,
      basePrice: basePrice,
      cas: 0,
      laborator: 0,
      duration: treatment.default_duration || 30,
      discountPercent: 0,
      selectedTeeth: [],
      teethDetails: [],
    };

    onInterventionsChange([...interventions, newIntervention]);
  };

  const handleRemoveIntervention = (interventionId: string) => {
    onInterventionsChange(interventions.filter(i => i.id !== interventionId));
  };

  const handleUpdateIntervention = (
    interventionId: string,
    field: 'price' | 'cas' | 'duration' | 'laborator' | 'discountPercent',
    value: number
  ) => {
    onInterventionsChange(
      interventions.map(i =>
        i.id === interventionId ? { ...i, [field]: value } : i
      )
    );
  };

  const openToothDialog = (interventionId: string, toothNumber: number) => {
    const intervention = interventions.find(i => i.id === interventionId);
    const existingDetail = intervention?.teethDetails?.find(t => t.toothNumber === toothNumber);
    
    setToothDialog({
      open: true,
      interventionId,
      toothNumber,
      status: existingDetail?.status || 'healthy',
      notes: existingDetail?.notes || '',
    });
  };

  const handleSaveToothDialog = () => {
    if (!toothDialog) return;

    // If status is 'healthy', remove the tooth from selection
    if (toothDialog.status === 'healthy') {
      handleRemoveTooth(toothDialog.interventionId, toothDialog.toothNumber);
      setToothDialog(null);
      return;
    }

    onInterventionsChange(
      interventions.map(i => {
        if (i.id !== toothDialog.interventionId) return i;
        
        const isAlreadySelected = i.selectedTeeth.includes(toothDialog.toothNumber);
        const existingDetails = i.teethDetails || [];
        const otherDetails = existingDetails.filter(t => t.toothNumber !== toothDialog.toothNumber);
        
        const newSelectedTeeth = isAlreadySelected 
          ? i.selectedTeeth 
          : [...i.selectedTeeth, toothDialog.toothNumber];
        
        // Calculate new price based on mode
        const basePrice = i.basePrice ?? i.price;
        let newPrice: number;
        if (i.isArchMode) {
          // In arch mode, count complete arch groups
          const archGroupCount = countArchGroups(newSelectedTeeth);
          newPrice = newSelectedTeeth.length > 0 ? basePrice * archGroupCount : basePrice;
        } else {
          // Individual teeth mode - price per tooth
          const teethCount = newSelectedTeeth.length;
          newPrice = teethCount > 0 ? basePrice * teethCount : basePrice;
        }
        
        return {
          ...i,
          selectedTeeth: newSelectedTeeth,
          teethDetails: [
            ...otherDetails,
            {
              toothNumber: toothDialog.toothNumber,
              status: toothDialog.status,
              notes: toothDialog.notes || undefined,
            },
          ],
          basePrice: basePrice,
          price: newPrice,
          archGroupCount: i.isArchMode ? countArchGroups(newSelectedTeeth) : undefined,
        };
      })
    );

    setToothDialog(null);
  };

  const handleRemoveTooth = (interventionId: string, toothNumber: number) => {
    onInterventionsChange(
      interventions.map(i => {
        if (i.id !== interventionId) return i;
        
        const newSelectedTeeth = i.selectedTeeth.filter(t => t !== toothNumber);
        const basePrice = i.basePrice ?? i.price;
        
        let newPrice: number;
        if (i.isArchMode) {
          // In arch mode, count complete arch groups
          const archGroupCount = countArchGroups(newSelectedTeeth);
          newPrice = newSelectedTeeth.length > 0 ? basePrice * archGroupCount : basePrice;
        } else {
          // Individual teeth mode - price per tooth
          const teethCount = newSelectedTeeth.length;
          newPrice = teethCount > 0 ? basePrice * teethCount : basePrice;
        }
        
        return {
          ...i,
          selectedTeeth: newSelectedTeeth,
          teethDetails: (i.teethDetails || []).filter(t => t.toothNumber !== toothNumber),
          price: newPrice,
          basePrice: basePrice,
          archGroupCount: i.isArchMode ? countArchGroups(newSelectedTeeth) : undefined,
        };
      })
    );
  };

  const getToothDetails = (intervention: SelectedIntervention, toothNumber: number) => {
    return intervention.teethDetails?.find(t => t.toothNumber === toothNumber);
  };

  // Get the current selection mode for an intervention
  const getSelectionMode = (interventionId: string): 'teeth' | 'arch' => {
    return selectionMode[interventionId] || 'teeth';
  };

  // Helper to count how many full arch groups are selected
  const countArchGroups = (selectedTeeth: number[]): number => {
    let count = 0;
    // Check each quadrant
    if (quadrant1.every(t => selectedTeeth.includes(t))) count++;
    if (quadrant2.every(t => selectedTeeth.includes(t))) count++;
    if (quadrant3.every(t => selectedTeeth.includes(t))) count++;
    if (quadrant4.every(t => selectedTeeth.includes(t))) count++;
    return Math.max(1, count); // At least 1 if any teeth are selected
  };

  // Handle selecting/deselecting an entire arch or quadrant
  const handleArchSelection = (interventionId: string, teethToToggle: number[], defaultStatus: string = 'Sănătos') => {
    onInterventionsChange(
      interventions.map(i => {
        if (i.id !== interventionId) return i;
        
        // Check if all teeth in this group are already selected
        const allSelected = teethToToggle.every(t => i.selectedTeeth.includes(t));
        
        let newSelectedTeeth: number[];
        let newTeethDetails = i.teethDetails || [];
        
        if (allSelected) {
          // Deselect all teeth in the group
          newSelectedTeeth = i.selectedTeeth.filter(t => !teethToToggle.includes(t));
          newTeethDetails = newTeethDetails.filter(t => !teethToToggle.includes(t.toothNumber));
        } else {
          // Select all teeth in the group that aren't already selected
          const teethToAdd = teethToToggle.filter(t => !i.selectedTeeth.includes(t));
          newSelectedTeeth = [...i.selectedTeeth, ...teethToAdd];
          // Add default status for newly added teeth
          for (const tooth of teethToAdd) {
            if (!newTeethDetails.find(t => t.toothNumber === tooth)) {
              newTeethDetails.push({
                toothNumber: tooth,
                status: defaultStatus,
              });
            }
          }
        }
        
        // In arch mode, price = basePrice * number of selected arch groups (not teeth)
        const basePrice = i.basePrice ?? i.price;
        const archGroupCount = countArchGroups(newSelectedTeeth);
        const newPrice = newSelectedTeeth.length > 0 ? basePrice * archGroupCount : basePrice;
        
        return {
          ...i,
          selectedTeeth: newSelectedTeeth,
          teethDetails: newTeethDetails,
          basePrice: basePrice,
          price: newPrice,
          isArchMode: true,
          archGroupCount: archGroupCount,
        };
      })
    );
  };

  const renderToothButton = (toothNumber: number, interventionId: string, intervention: SelectedIntervention, isDeciduous: boolean = false, isLower: boolean = false) => {
    const isSelected = intervention.selectedTeeth.includes(toothNumber);
    const toothDetails = getToothDetails(intervention, toothNumber);
    const isHovered = hoveredTooth?.interventionId === interventionId && hoveredTooth?.toothNumber === toothNumber;
    const toothImage = getToothImage(toothNumber);
    
    // Get patient's saved dental status for this tooth
    const patientStatus = getPatientToothStatus(toothNumber);
    
    // Use intervention status if selected, otherwise use patient's saved status
    const status = isSelected 
      ? (toothDetails?.status || patientStatus?.status || 'Sănătos')
      : (patientStatus?.status || 'Sănătos');
    
    const hexColor = getStatusHexColor(status);
    const hasPatientStatus = patientStatus && patientStatus.status !== 'Sănătos';
    const isMissingTooth = status === 'Absent' || status === 'missing';
    
    return (
      <div key={toothNumber} className="relative flex flex-col items-center">
        {/* Tooth number - show above for upper teeth */}
        {!isLower && (
          <span className={cn(
            "text-[10px] font-medium mb-0.5",
            isSelected ? 'text-foreground' : hasPatientStatus ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {toothNumber}
          </span>
        )}
        
        <button
          type="button"
          onClick={() => openToothDialog(interventionId, toothNumber)}
          onMouseEnter={() => setHoveredTooth({ interventionId, toothNumber })}
          onMouseLeave={() => setHoveredTooth(null)}
          className={cn(
            'relative flex items-center justify-center transition-all rounded-md overflow-hidden',
            'hover:scale-105 cursor-pointer',
            isHovered && 'ring-2 ring-offset-1 ring-primary',
            isSelected && 'ring-2',
            hasPatientStatus && !isSelected && 'ring-1',
            isDeciduous 
              ? 'w-7 h-9 sm:w-8 sm:h-10' 
              : 'w-8 h-11 sm:w-9 sm:h-13'
          )}
          style={
            isSelected && hexColor 
              ? { boxShadow: `0 0 0 2px ${hexColor}` }
              : hasPatientStatus && hexColor 
                ? { boxShadow: `0 0 0 1px ${hexColor}` }
                : undefined
          }
        >
          {/* Tooth image */}
          {toothImage ? (
            <img 
              src={toothImage} 
              alt={`Dinte ${toothNumber}`}
              className={cn(
                "w-full h-full object-contain",
                isLower && 'rotate-180',
                isMissingTooth && 'opacity-30 grayscale'
              )}
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center bg-muted/20 border rounded text-xs",
              isDeciduous && 'rounded-full border-dashed'
            )}>
              {toothNumber}
            </div>
          )}
          
          {/* Status overlay when selected */}
          {isSelected && hexColor && (
            <div 
              className="absolute inset-0 rounded-md"
              style={{ backgroundColor: `${hexColor}40` }}
            />
          )}
          
          {/* Patient status overlay when NOT selected but has status */}
          {!isSelected && hasPatientStatus && hexColor && !isMissingTooth && (
            <div 
              className="absolute inset-0 rounded-md"
              style={{ backgroundColor: `${hexColor}30` }}
            />
          )}
        </button>
        
        {/* Tooth number - show below for lower teeth */}
        {isLower && (
          <span className={cn(
            "text-[10px] font-medium mt-0.5",
            isSelected ? 'text-foreground' : hasPatientStatus ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {toothNumber}
          </span>
        )}
        
        {/* Tooltip */}
        {isHovered && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-popover border shadow-lg text-xs whitespace-nowrap">
            <div className="font-medium">
              {isSelected ? getStatusLabel(status) : hasPatientStatus ? getStatusLabel(status) : 'Click pentru a selecta'}
            </div>
            {(() => {
              const cleanNotes = cleanDentalNotes(toothDetails?.notes || patientStatus?.notes);
              return cleanNotes ? (
                <div className="text-muted-foreground max-w-[150px] truncate">{cleanNotes}</div>
              ) : null;
            })()}
          </div>
        )}
      </div>
    );
  };

  // Render an arch/quadrant selection button
  const renderArchButton = (
    interventionId: string, 
    intervention: SelectedIntervention, 
    teethGroup: number[], 
    label: string,
    description: string
  ) => {
    const selectedCount = teethGroup.filter(t => intervention.selectedTeeth.includes(t)).length;
    const allSelected = selectedCount === teethGroup.length;
    const someSelected = selectedCount > 0 && selectedCount < teethGroup.length;
    
    return (
      <button
        type="button"
        onClick={() => handleArchSelection(interventionId, teethGroup)}
        className={cn(
          'p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 hover:scale-105',
          allSelected ? 'bg-primary/20 border-primary text-primary' :
          someSelected ? 'bg-warning/20 border-warning text-warning' :
          'bg-muted/30 border-muted-foreground/30 hover:border-primary/50'
        )}
      >
        <span className="font-bold text-lg">{label}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
        <span className="text-sm">
          {selectedCount}/{teethGroup.length} dinți
        </span>
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Intervenții *</Label>
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-1"
            onClick={() => setTreatmentDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Intervenții
          </Button>
        </div>
      </div>

      {/* Interventions List */}
      {interventions.length > 0 && (
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {interventions.map((intervention) => {
            return (
            <Collapsible 
              key={intervention.id} 
              open={expandedInterventions.has(intervention.id)}
              onOpenChange={() => toggleExpanded(intervention.id)}
              className="border rounded-lg overflow-hidden"
            >
              {/* Intervention Header */}
              <CollapsibleTrigger asChild>
                <div className="bg-muted/30 p-3 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 shrink-0 transition-transform duration-200",
                        expandedInterventions.has(intervention.id) ? "rotate-0" : "-rotate-90"
                      )} 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{intervention.treatmentName}</div>
                      {intervention.selectedTeeth.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Dinți: {intervention.selectedTeeth.sort((a, b) => a - b).join(', ')}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm shrink-0">
                      <span className="font-medium">{Number(intervention.price).toFixed(2)} lei</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveIntervention(intervention.id);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CollapsibleTrigger>

              {/* Collapsible Content */}
              <CollapsibleContent>
                <div className="p-3 space-y-4 border-t">
                  {/* Prices Row */}
                  <div className="grid grid-cols-6 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Preț inițial</Label>
                      <Input
                        type="number"
                        value={intervention.price}
                        onChange={(e) =>
                          handleUpdateIntervention(intervention.id, 'price', parseFloat(e.target.value) || 0)
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-purple-600">Laborator</Label>
                      <Input
                        type="number"
                        value={intervention.laborator || 0}
                        onChange={(e) =>
                          handleUpdateIntervention(intervention.id, 'laborator', parseFloat(e.target.value) || 0)
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Preț</Label>
                      <Input
                        type="number"
                        value={intervention.price - (intervention.laborator || 0)}
                        readOnly
                        disabled
                        className="h-8 bg-muted"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className={`text-xs ${isCasDisabled ? 'text-muted-foreground' : 'text-green-600'}`}>CAS</Label>
                      <Input
                        type="number"
                        value={intervention.cas}
                        onChange={(e) =>
                          handleUpdateIntervention(intervention.id, 'cas', parseFloat(e.target.value) || 0)
                        }
                        className={`h-8 ${isCasDisabled ? 'bg-muted cursor-not-allowed opacity-50' : ''}`}
                        disabled={isCasDisabled}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-pink-600">Discount %</Label>
                      <Input
                        type="number"
                        value={intervention.discountPercent || 0}
                        onChange={(e) =>
                          handleUpdateIntervention(intervention.id, 'discountPercent', Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))
                        }
                        className="h-8"
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-orange-600">De plată</Label>
                      <Input
                        type="number"
                        value={(() => {
                          const priceAfterCas = intervention.price - intervention.cas;
                          const discountAmount = priceAfterCas * ((intervention.discountPercent || 0) / 100);
                          return (priceAfterCas - discountAmount).toFixed(0);
                        })()}
                        readOnly
                        disabled
                        className="h-8 bg-muted"
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
            );
          })}

          {/* Totals */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="grid grid-cols-6 gap-2 text-sm">
              <div className="font-bold">TOTAL</div>
              <div className="text-right font-bold">{totalPretInitial.toFixed(2)} lei</div>
              <div className="text-right font-bold text-purple-600">{totalLaborator.toFixed(2)} lei</div>
              <div className="text-right font-bold">{totalPret.toFixed(2)} lei</div>
              <div className="text-right font-bold text-green-600">{totalCas.toFixed(2)} lei</div>
              <div className="text-right font-bold text-orange-600">{totalDePlata.toFixed(2)} lei</div>
            </div>
          </div>
        </div>
      )}

      {interventions.length === 0 && (
        <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
          Apasă butonul "Intervenții" pentru a adăuga tratamente
        </div>
      )}

      {/* Treatment List Dialog */}
      <TreatmentListDialog
        open={treatmentDialogOpen}
        onClose={() => setTreatmentDialogOpen(false)}
        treatments={treatments}
        onSelectTreatment={handleAddTreatment}
      />

      {/* Tooth Selection Dialog */}
      <Dialog open={!!toothDialog?.open} onOpenChange={() => setToothDialog(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Dinte {toothDialog?.toothNumber}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="grid grid-cols-4 gap-2">
                {activeStatuses.map((status) => {
                  const hexColor = status.color;
                  const isSelected = toothDialog?.status === status.name;
                  return (
                    <button
                      key={status.id}
                      type="button"
                      onClick={() => setToothDialog(prev => prev ? { ...prev, status: status.name } : null)}
                      className={cn(
                        'px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all',
                        isSelected && 'ring-2 ring-primary ring-offset-2'
                      )}
                      style={{
                        backgroundColor: `${hexColor}20`,
                        borderColor: hexColor,
                        color: hexColor,
                      }}
                    >
                      {status.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={toothDialog?.notes || ''}
                onChange={(e) => setToothDialog(prev => prev ? { ...prev, notes: e.target.value } : null)}
                placeholder="Adaugă note despre dinte..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setToothDialog(null)}>
              Anulează
            </Button>
            <Button type="button" onClick={handleSaveToothDialog}>
              Salvează
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
