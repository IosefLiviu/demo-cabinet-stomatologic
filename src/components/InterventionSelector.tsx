import { useState } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { TreatmentListDialog } from './TreatmentListDialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ToothStatus } from './DentalChart';
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
  status: ToothStatus;
  notes?: string;
}

export interface SelectedIntervention {
  id: string;
  treatmentId: string;
  treatmentName: string;
  price: number;
  cas: number;
  laborator: number;
  duration: number;
  selectedTeeth: number[];
  teethDetails?: ToothSelection[];
}

interface InterventionSelectorProps {
  treatments: Treatment[];
  interventions: SelectedIntervention[];
  onInterventionsChange: (interventions: SelectedIntervention[]) => void;
  isCasDisabled?: boolean;
}

// FDI notation - permanent teeth
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Status colors from DentalChart
const statusColors: Record<ToothStatus, string> = {
  healthy: 'bg-success/20 border-success text-success',
  cavity: 'bg-destructive/20 border-destructive text-destructive',
  filled: 'bg-cabinet-2/20 border-cabinet-2 text-cabinet-2',
  crown: 'bg-cabinet-4/20 border-cabinet-4 text-cabinet-4',
  missing: 'bg-muted border-muted-foreground/30 text-muted-foreground',
  implant: 'bg-cabinet-3/20 border-cabinet-3 text-cabinet-3',
  root_canal: 'bg-warning/20 border-warning text-warning',
  extraction_needed: 'bg-destructive/30 border-destructive text-destructive',
};

const statusLabels: Record<ToothStatus, string> = {
  healthy: 'Sănătos',
  cavity: 'Carie',
  filled: 'Plombat',
  crown: 'Coroană',
  missing: 'Lipsă',
  implant: 'Implant',
  root_canal: 'Canal',
  extraction_needed: 'De extras',
};

export function InterventionSelector({
  treatments,
  interventions,
  onInterventionsChange,
  isCasDisabled = false,
}: InterventionSelectorProps) {
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [expandedInterventions, setExpandedInterventions] = useState<Set<string>>(new Set());
  const [toothDialog, setToothDialog] = useState<{
    open: boolean;
    interventionId: string;
    toothNumber: number;
    status: ToothStatus;
    notes: string;
  } | null>(null);
  const [hoveredTooth, setHoveredTooth] = useState<{ interventionId: string; toothNumber: number } | null>(null);

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
  const totalDePlata = totalPretInitial - totalCas;
  const totalDuration = interventions.reduce((sum, i) => sum + i.duration, 0) || 30;

  const handleAddTreatment = (treatment: Treatment) => {
    const newIntervention: SelectedIntervention = {
      id: `${treatment.id}-${Date.now()}`,
      treatmentId: treatment.id,
      treatmentName: treatment.name,
      price: treatment.default_price || 0,
      cas: 0,
      laborator: 0,
      duration: treatment.default_duration || 30,
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
    field: 'price' | 'cas' | 'duration' | 'laborator',
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

    onInterventionsChange(
      interventions.map(i => {
        if (i.id !== toothDialog.interventionId) return i;
        
        const isAlreadySelected = i.selectedTeeth.includes(toothDialog.toothNumber);
        const existingDetails = i.teethDetails || [];
        const otherDetails = existingDetails.filter(t => t.toothNumber !== toothDialog.toothNumber);
        
        return {
          ...i,
          selectedTeeth: isAlreadySelected 
            ? i.selectedTeeth 
            : [...i.selectedTeeth, toothDialog.toothNumber],
          teethDetails: [
            ...otherDetails,
            {
              toothNumber: toothDialog.toothNumber,
              status: toothDialog.status,
              notes: toothDialog.notes || undefined,
            },
          ],
        };
      })
    );

    setToothDialog(null);
  };

  const handleRemoveTooth = (interventionId: string, toothNumber: number) => {
    onInterventionsChange(
      interventions.map(i => {
        if (i.id !== interventionId) return i;
        return {
          ...i,
          selectedTeeth: i.selectedTeeth.filter(t => t !== toothNumber),
          teethDetails: (i.teethDetails || []).filter(t => t.toothNumber !== toothNumber),
        };
      })
    );
  };

  const getToothDetails = (intervention: SelectedIntervention, toothNumber: number) => {
    return intervention.teethDetails?.find(t => t.toothNumber === toothNumber);
  };

  const renderToothButton = (toothNumber: number, interventionId: string, intervention: SelectedIntervention) => {
    const isSelected = intervention.selectedTeeth.includes(toothNumber);
    const toothDetails = getToothDetails(intervention, toothNumber);
    const isHovered = hoveredTooth?.interventionId === interventionId && hoveredTooth?.toothNumber === toothNumber;
    const status: ToothStatus = toothDetails?.status || 'healthy';
    
    return (
      <div key={toothNumber} className="relative">
        <button
          type="button"
          onClick={() => openToothDialog(interventionId, toothNumber)}
          onMouseEnter={() => setHoveredTooth({ interventionId, toothNumber })}
          onMouseLeave={() => setHoveredTooth(null)}
          className={cn(
            'w-8 h-10 sm:w-10 sm:h-12 rounded-lg border-2 flex items-center justify-center text-xs font-medium transition-all hover:scale-110 cursor-pointer',
            isSelected
              ? statusColors[status]
              : statusColors.healthy,
            isHovered && 'ring-2 ring-primary ring-offset-2'
          )}
        >
          {toothNumber}
        </button>
        
        {/* Tooltip */}
        {isHovered && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-popover border shadow-lg text-xs whitespace-nowrap">
            <div className="font-medium">{isSelected ? statusLabels[status] : 'Click pentru a selecta'}</div>
            {toothDetails?.notes && <div className="text-muted-foreground max-w-[150px] truncate">{toothDetails.notes}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Intervenții *</Label>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            Durată totală: {totalDuration} min
          </span>
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
            const hasNoTeeth = !intervention.selectedTeeth || intervention.selectedTeeth.length === 0;
            return (
            <Collapsible 
              key={intervention.id} 
              open={expandedInterventions.has(intervention.id)}
              onOpenChange={() => toggleExpanded(intervention.id)}
              className={cn(
                "border rounded-lg overflow-hidden",
                hasNoTeeth && "border-destructive border-2"
              )}
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
                      <span className="font-medium">{intervention.price} lei</span>
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
                  {/* Duration and Prices Row */}
                  <div className="grid grid-cols-6 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-blue-600">Durată (min)</Label>
                      <Input
                        type="number"
                        value={intervention.duration}
                        onChange={(e) =>
                          handleUpdateIntervention(intervention.id, 'duration', parseInt(e.target.value) || 30)
                        }
                        className="h-8"
                        min={5}
                        step={5}
                      />
                    </div>
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
                      <Label className="text-xs text-orange-600">De plată</Label>
                      <Input
                        type="number"
                        value={intervention.price - intervention.cas}
                        readOnly
                        disabled
                        className="h-8 bg-muted"
                      />
                    </div>
                  </div>

                  {/* Dental Chart for Tooth Selection */}
                  <div className="space-y-4">
                    <Label className="text-xs">Selectează dinții tratați</Label>
                    
                    {/* Legend - Full status categories */}
                    <div className="flex flex-wrap gap-2 text-xs">
                      {Object.entries(statusLabels).map(([status, label]) => (
                        <div
                          key={status}
                          className={cn(
                            'px-2 py-1 rounded-md border flex items-center gap-1.5',
                            statusColors[status as ToothStatus]
                          )}
                        >
                          <span>{label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Dental Chart */}
                    <div className="space-y-4">
                      {/* Upper jaw */}
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground text-center mb-2">
                          Maxilar superior
                        </div>
                        <div className="flex justify-center gap-1">
                          {upperTeeth.map(tooth => renderToothButton(tooth, intervention.id, intervention))}
                        </div>
                        <div className="flex justify-center">
                          <div className="w-full max-w-md border-b-2 border-muted-foreground/30 my-2" />
                        </div>
                      </div>

                      {/* Lower jaw */}
                      <div className="space-y-1">
                        <div className="flex justify-center gap-1">
                          {lowerTeeth.map(tooth => renderToothButton(tooth, intervention.id, intervention))}
                        </div>
                        <div className="text-xs text-muted-foreground text-center mt-2">
                          Maxilar inferior
                        </div>
                      </div>
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
                {Object.entries(statusLabels).map(([status, label]) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setToothDialog(prev => prev ? { ...prev, status: status as ToothStatus } : null)}
                    className={cn(
                      'px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all',
                      statusColors[status as ToothStatus],
                      toothDialog?.status === status && 'ring-2 ring-primary ring-offset-2'
                    )}
                  >
                    {label}
                  </button>
                ))}
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
