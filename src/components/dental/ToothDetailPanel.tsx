import { useState } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Plus, Trash2, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DentalCondition,
  ToothCondition,
  ToothIntervention,
} from '@/hooks/useToothData';
import { Doctor } from '@/hooks/useDoctors';
import { Treatment } from '@/hooks/useTreatments';

interface ToothDetailPanelProps {
  toothNumber: number;
  patientId: string;
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
  patientId,
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
  const [showConditionsDialog, setShowConditionsDialog] = useState(false);
  const [showInterventionsDialog, setShowInterventionsDialog] = useState(false);
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

  const handleAddCondition = async (conditionId: string) => {
    await onAddCondition(toothNumber, conditionId);
  };

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
      setShowInterventionsDialog(false);
    }
  };

  return (
    <>
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

        {/* Content */}
        <div className="flex-1 overflow-auto p-3 space-y-4">
          {/* Afecțiuni section */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Afecțiuni</h4>
            {toothConditions.length > 0 && (
              <div className="space-y-1 mb-2">
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
            <button
              onClick={() => { setConditionSearch(''); setShowConditionsDialog(true); }}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors py-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Adaugă afecțiune
            </button>
          </div>

          {/* Intervenții section */}
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Intervenții</h4>
            {toothInterventions.length > 0 && (
              <div className="space-y-1 mb-2">
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
            <button
              onClick={() => { setSelectedTreatment(''); setSelectedDoctor(''); setShowInterventionsDialog(true); }}
              className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors py-1"
            >
              <Plus className="h-3.5 w-3.5" />
              Adaugă intervenție
            </button>
          </div>
        </div>
      </div>

      {/* Afecțiuni popup */}
      <Dialog open={showConditionsDialog} onOpenChange={setShowConditionsDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Adaugă afecțiune — Dinte {toothNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută afecțiune..."
                value={conditionSearch}
                onChange={e => setConditionSearch(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
            <ScrollArea className="max-h-[350px]">
              <div className="space-y-0.5">
                {filteredCatalog.map(cond => (
                  <button
                    key={cond.id}
                    onClick={() => handleAddCondition(cond.id)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/70 text-sm transition-colors text-left"
                  >
                    <span>{cond.name}</span>
                    <span className="text-muted-foreground text-xs">{cond.code}</span>
                  </button>
                ))}
                {filteredCatalog.length === 0 && (
                  <p className="text-sm text-muted-foreground py-4 text-center">Nicio afecțiune disponibilă</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Intervenții popup */}
      <Dialog open={showInterventionsDialog} onOpenChange={setShowInterventionsDialog}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-sm">Adaugă intervenție — Dinte {toothNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={selectedTreatment} onValueChange={setSelectedTreatment}>
              <SelectTrigger>
                <SelectValue placeholder="Selectează tratament..." />
              </SelectTrigger>
              <SelectContent>
                {treatments.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDoctor} onValueChange={setSelectedDoctor}>
              <SelectTrigger>
                <SelectValue placeholder="Doctor (opțional)..." />
              </SelectTrigger>
              <SelectContent>
                {doctors.map(d => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button className="w-full" onClick={handleAddIntervention} disabled={!selectedTreatment}>
              <Plus className="h-4 w-4 mr-1.5" /> Adaugă intervenție
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
