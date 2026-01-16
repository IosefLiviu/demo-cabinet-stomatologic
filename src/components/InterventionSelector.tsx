import { useState } from 'react';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
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

export interface SelectedIntervention {
  id: string;
  treatmentId: string;
  treatmentName: string;
  price: number;
  decont: number;
  coPlata: number;
  selectedTeeth: number[];
}

interface InterventionSelectorProps {
  treatments: Treatment[];
  interventions: SelectedIntervention[];
  onInterventionsChange: (interventions: SelectedIntervention[]) => void;
}

// FDI notation - permanent teeth
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export function InterventionSelector({
  treatments,
  interventions,
  onInterventionsChange,
}: InterventionSelectorProps) {
  const [treatmentDialogOpen, setTreatmentDialogOpen] = useState(false);
  const [treatmentSearch, setTreatmentSearch] = useState('');
  const [selectedTreatmentForTeeth, setSelectedTreatmentForTeeth] = useState<string | null>(null);
  const [expandedInterventions, setExpandedInterventions] = useState<Set<string>>(new Set());

  // Calculate totals
  const totalPrice = interventions.reduce((sum, i) => sum + i.price, 0);
  const totalDecont = interventions.reduce((sum, i) => sum + i.decont, 0);
  const totalCoPlata = interventions.reduce((sum, i) => sum + i.coPlata, 0);
  const totalDuration = interventions.reduce((sum, i) => {
    const treatment = treatments.find(t => t.id === i.treatmentId);
    return sum + (treatment?.default_duration || 30);
  }, 0) || 30;

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

  const handleAddTreatment = (treatment: Treatment) => {
    const newIntervention: SelectedIntervention = {
      id: `${treatment.id}-${Date.now()}`,
      treatmentId: treatment.id,
      treatmentName: treatment.name,
      price: treatment.default_price || 0,
      decont: treatment.decont || 0,
      coPlata: treatment.co_plata || 0,
      selectedTeeth: [],
    };

    onInterventionsChange([...interventions, newIntervention]);
    setTreatmentDialogOpen(false);
    setTreatmentSearch('');
    // Auto-expand and show teeth selector
    setSelectedTreatmentForTeeth(newIntervention.id);
    setExpandedInterventions(prev => new Set([...prev, newIntervention.id]));
  };

  const handleRemoveIntervention = (interventionId: string) => {
    onInterventionsChange(interventions.filter(i => i.id !== interventionId));
    if (selectedTreatmentForTeeth === interventionId) {
      setSelectedTreatmentForTeeth(null);
    }
  };

  const handleUpdateIntervention = (
    interventionId: string,
    field: 'price' | 'decont' | 'coPlata',
    value: number
  ) => {
    onInterventionsChange(
      interventions.map(i =>
        i.id === interventionId ? { ...i, [field]: value } : i
      )
    );
  };

  const handleToothToggle = (interventionId: string, toothNumber: number) => {
    onInterventionsChange(
      interventions.map(i => {
        if (i.id !== interventionId) return i;
        const hasSelected = i.selectedTeeth.includes(toothNumber);
        return {
          ...i,
          selectedTeeth: hasSelected
            ? i.selectedTeeth.filter(t => t !== toothNumber)
            : [...i.selectedTeeth, toothNumber],
        };
      })
    );
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

  const renderToothButton = (toothNumber: number, interventionId: string, selectedTeeth: number[]) => {
    const isSelected = selectedTeeth.includes(toothNumber);
    return (
      <button
        key={toothNumber}
        type="button"
        onClick={() => handleToothToggle(interventionId, toothNumber)}
        className={cn(
          'w-7 h-9 sm:w-8 sm:h-10 rounded-md border-2 flex items-center justify-center text-xs font-medium transition-all hover:scale-105',
          isSelected
            ? 'bg-primary border-primary text-primary-foreground'
            : 'bg-muted/30 border-border hover:border-primary/50'
        )}
      >
        {toothNumber}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>Intervenții *</Label>
        <span className="text-sm text-muted-foreground">
          Durată totală: {totalDuration} min
        </span>
      </div>

      {/* Interventions List */}
      {interventions.length > 0 && (
        <div className="space-y-2">
          {interventions.map((intervention) => {
            const isExpanded = expandedInterventions.has(intervention.id);
            return (
              <Collapsible
                key={intervention.id}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(intervention.id)}
              >
                <div className="border rounded-lg overflow-hidden">
                  {/* Intervention Header */}
                  <div className="bg-muted/30 p-3">
                    <div className="flex items-center gap-2">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
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
                          onClick={() => handleRemoveIntervention(intervention.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <CollapsibleContent>
                    <div className="p-3 space-y-4 border-t">
                      {/* Prices Row */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Preț</Label>
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
                          <Label className="text-xs text-green-600">Decont</Label>
                          <Input
                            type="number"
                            value={intervention.decont}
                            onChange={(e) =>
                              handleUpdateIntervention(intervention.id, 'decont', parseFloat(e.target.value) || 0)
                            }
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-orange-600">Co-plată</Label>
                          <Input
                            type="number"
                            value={intervention.coPlata}
                            onChange={(e) =>
                              handleUpdateIntervention(intervention.id, 'coPlata', parseFloat(e.target.value) || 0)
                            }
                            className="h-8"
                          />
                        </div>
                      </div>

                      {/* Dental Chart for Tooth Selection */}
                      <div className="space-y-2">
                        <Label className="text-xs">Selectează dinții tratați</Label>
                        <div className="bg-muted/20 rounded-lg p-3 space-y-3">
                          {/* Upper jaw */}
                          <div className="space-y-1">
                            <div className="text-[10px] text-muted-foreground text-center">
                              Maxilar superior
                            </div>
                            <div className="flex justify-center gap-0.5 flex-wrap">
                              {upperTeeth.map(tooth => renderToothButton(tooth, intervention.id, intervention.selectedTeeth))}
                            </div>
                          </div>

                          {/* Divider */}
                          <div className="flex justify-center">
                            <div className="w-full max-w-sm border-b-2 border-muted-foreground/20" />
                          </div>

                          {/* Lower jaw */}
                          <div className="space-y-1">
                            <div className="flex justify-center gap-0.5 flex-wrap">
                              {lowerTeeth.map(tooth => renderToothButton(tooth, intervention.id, intervention.selectedTeeth))}
                            </div>
                            <div className="text-[10px] text-muted-foreground text-center">
                              Maxilar inferior
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}

          {/* Totals */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="grid grid-cols-4 gap-2 text-sm">
              <div className="font-bold">TOTAL</div>
              <div className="text-right font-bold">{totalPrice.toFixed(2)} lei</div>
              <div className="text-right font-bold text-green-600">{totalDecont.toFixed(2)} lei</div>
              <div className="text-right font-bold text-orange-600">{totalCoPlata.toFixed(2)} lei</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Intervention Button */}
      <Button
        type="button"
        variant="outline"
        className="w-full gap-2"
        onClick={() => setTreatmentDialogOpen(true)}
      >
        <Plus className="h-4 w-4" />
        Adaugă intervenție
      </Button>

      {/* Treatment Selection Dialog */}
      <Dialog open={treatmentDialogOpen} onOpenChange={setTreatmentDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Selectează tratamentul</DialogTitle>
          </DialogHeader>
          <Command className="flex-1">
            <CommandInput
              placeholder="Caută tratament..."
              value={treatmentSearch}
              onValueChange={setTreatmentSearch}
            />
            <CommandList className="max-h-[400px]">
              <CommandEmpty>Niciun tratament găsit</CommandEmpty>
              <ScrollArea className="h-[400px]">
                {Object.entries(groupedTreatments).map(([category, categoryTreatments]) => (
                  <CommandGroup key={category} heading={category}>
                    {categoryTreatments.map((treatment) => (
                      <CommandItem
                        key={treatment.id}
                        value={treatment.name}
                        onSelect={() => handleAddTreatment(treatment)}
                        className="cursor-pointer py-3"
                      >
                        <div className="flex justify-between w-full items-center">
                          <span className="font-medium">{treatment.name}</span>
                          <div className="flex gap-3 text-xs text-muted-foreground">
                            <span className="font-medium">{treatment.default_price || 0} lei</span>
                            {treatment.decont ? (
                              <span className="text-green-600">D: {treatment.decont}</span>
                            ) : null}
                            {treatment.co_plata ? (
                              <span className="text-orange-600">C: {treatment.co_plata}</span>
                            ) : null}
                          </div>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </ScrollArea>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </div>
  );
}
