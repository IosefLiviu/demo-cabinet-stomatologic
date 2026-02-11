import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Plus, Trash2, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  DentalCondition,
  ToothCondition,
  ToothIntervention,
} from '@/hooks/useToothData';
import { Doctor } from '@/hooks/useDoctors';
import { Treatment } from '@/hooks/useTreatments';

interface ToothDetailPanelProps {
  toothNumber: number;
  toothStatus: string;
  statusColor: string | null;
  conditions: ToothCondition[];
  interventions: ToothIntervention[];
  conditionsCatalog: DentalCondition[];
  doctors: Doctor[];
  treatments: Treatment[];
  onAddCondition: (toothNumber: number, conditionId: string) => Promise<boolean>;
  onRemoveCondition: (id: string) => Promise<boolean>;
  onAddIntervention: (toothNumber: number, treatmentName: string, treatmentId?: string, doctorId?: string) => Promise<boolean>;
  onRemoveIntervention: (id: string) => Promise<boolean>;
  onClose: () => void;
}

export function ToothDetailPanel({
  toothNumber,
  toothStatus,
  statusColor,
  conditions,
  interventions,
  conditionsCatalog,
  doctors,
  treatments,
  onAddCondition,
  onRemoveCondition,
  onAddIntervention,
  onRemoveIntervention,
  onClose,
}: ToothDetailPanelProps) {
  const [conditionSearch, setConditionSearch] = useState('');
  const [selectedTreatment, setSelectedTreatment] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');

  const toothConditions = conditions.filter(c => c.tooth_number === toothNumber);
  const toothInterventions = interventions.filter(i => i.tooth_number === toothNumber);

  const existingConditionIds = new Set(toothConditions.map(c => c.condition_id));
  const filteredCatalog = conditionsCatalog.filter(c =>
    !existingConditionIds.has(c.id) &&
    (conditionSearch === '' || c.name.toLowerCase().includes(conditionSearch.toLowerCase()) || c.code.toLowerCase().includes(conditionSearch.toLowerCase()))
  );

  const handleAddIntervention = async () => {
    if (!selectedTreatment) return;
    const treatment = treatments.find(t => t.id === selectedTreatment);
    if (!treatment) return;
    const ok = await onAddIntervention(
      toothNumber,
      treatment.name,
      treatment.id,
      selectedDoctor || undefined,
    );
    if (ok) {
      setSelectedTreatment('');
      setSelectedDoctor('');
    }
  };

  return (
    <div className="h-full flex flex-col border-l bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm">Dinte {toothNumber}</span>
          {statusColor && (
            <Badge
              variant="outline"
              className="text-xs"
              style={{ backgroundColor: `${statusColor}20`, borderColor: statusColor, color: statusColor }}
            >
              {toothStatus}
            </Badge>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Tabs defaultValue="conditions" className="flex-1 flex flex-col min-h-0">
        <TabsList className="mx-3 mt-2 w-auto">
          <TabsTrigger value="conditions" className="text-xs">Afecțiuni ({toothConditions.length})</TabsTrigger>
          <TabsTrigger value="interventions" className="text-xs">Intervenții ({toothInterventions.length})</TabsTrigger>
        </TabsList>

        {/* Afecțiuni tab */}
        <TabsContent value="conditions" className="flex-1 flex flex-col min-h-0 px-3 pb-3">
          {/* Existing conditions */}
          <ScrollArea className="flex-1 min-h-0 mb-2">
            {toothConditions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nicio afecțiune</p>
            ) : (
              <div className="space-y-1">
                {toothConditions.map(tc => (
                  <div key={tc.id} className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/50 text-xs">
                    <div>
                      <span className="font-medium">{tc.condition?.name}</span>
                      <span className="text-muted-foreground ml-1">({tc.condition?.code})</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveCondition(tc.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Add condition */}
          <div className="border-t pt-2 space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Caută afecțiune..."
                value={conditionSearch}
                onChange={e => setConditionSearch(e.target.value)}
                className="h-8 text-xs pl-7"
              />
            </div>
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-0.5">
                {filteredCatalog.map(cond => (
                  <button
                    key={cond.id}
                    onClick={() => onAddCondition(toothNumber, cond.id)}
                    className="w-full flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/70 text-xs transition-colors text-left"
                  >
                    <span>{cond.name}</span>
                    <span className="text-muted-foreground">{cond.code}</span>
                  </button>
                ))}
                {filteredCatalog.length === 0 && (
                  <p className="text-xs text-muted-foreground py-2 text-center">Nicio afecțiune disponibilă</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </TabsContent>

        {/* Intervenții tab */}
        <TabsContent value="interventions" className="flex-1 flex flex-col min-h-0 px-3 pb-3">
          <ScrollArea className="flex-1 min-h-0 mb-2">
            {toothInterventions.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">Nicio intervenție</p>
            ) : (
              <div className="space-y-1">
                {toothInterventions.map(ti => (
                  <div key={ti.id} className="py-1.5 px-2 rounded bg-muted/50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ti.treatment_name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveIntervention(ti.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="text-muted-foreground flex gap-2 mt-0.5">
                      {ti.doctor?.name && <span>{ti.doctor.name}</span>}
                      <span>{format(new Date(ti.performed_at), 'dd.MM.yyyy', { locale: ro })}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Add intervention */}
          <div className="border-t pt-2 space-y-2">
            <Select value={selectedTreatment} onValueChange={setSelectedTreatment}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Selectează intervenție..." />
              </SelectTrigger>
              <SelectContent>
                {treatments.map(t => (
                  <SelectItem key={t.id} value={t.id} className="text-xs">{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Doctor (opțional)..." />
              </SelectTrigger>
              <SelectContent>
                {doctors.map(d => (
                  <SelectItem key={d.id} value={d.id} className="text-xs">{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="w-full h-8 text-xs" onClick={handleAddIntervention} disabled={!selectedTreatment}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Adaugă intervenție
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
