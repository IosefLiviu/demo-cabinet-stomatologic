import { useState, useMemo } from 'react';
import { format, isToday } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Plus, Trash2, X, Search, Clock, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [treatmentSearch, setTreatmentSearch] = useState('');

  const toothConditions = conditions.filter(c => c.tooth_number === toothNumber);
  const toothInterventions = interventions.filter(i => i.tooth_number === toothNumber);
  const todayInterventions = toothInterventions.filter(i => isToday(new Date(i.performed_at)));
  const historyInterventions = toothInterventions.filter(i => !isToday(new Date(i.performed_at)));

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
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <Tabs defaultValue="today" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="mx-3 mt-2 grid grid-cols-2">
            <TabsTrigger value="today" className="text-xs gap-1">
              <Clock className="h-3 w-3" />
              Azi
              {todayInterventions.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">{todayInterventions.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs gap-1">
              <History className="h-3 w-3" />
              Istoric
              {historyInterventions.length > 0 && (
                <Badge variant="secondary" className="h-4 px-1 text-[10px]">{historyInterventions.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Tab AZI */}
          <TabsContent value="today" className="flex-1 overflow-auto p-3 space-y-4 mt-0">
            {/* Afecțiuni existente */}
            {toothConditions.length > 0 && (
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
            <button
              onClick={() => { setConditionSearch(''); setShowConditionsDialog(true); }}
              className="flex items-center gap-2 text-xs text-foreground hover:text-foreground/80 transition-colors py-1"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white">
                <Plus className="h-3 w-3" />
              </span>
              Adaugă afecțiune
            </button>

            {/* Intervenții existente azi */}
            {todayInterventions.length > 0 && (
              <div className="space-y-1">
                {todayInterventions.map(ti => (
                  <div key={ti.id} className="py-1.5 px-2 rounded bg-muted/50 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ti.treatment_name}</span>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onRemoveIntervention(ti.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                    <div className="text-muted-foreground flex gap-2 mt-0.5">
                      {ti.doctor?.name && <span>{ti.doctor.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => { setSelectedTreatment(''); setSelectedDoctor(''); setShowInterventionsDialog(true); }}
              className="flex items-center gap-2 text-xs text-foreground hover:text-foreground/80 transition-colors py-1"
            >
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 text-white">
                <Plus className="h-3 w-3" />
              </span>
              Adaugă intervenție
            </button>
          </TabsContent>

          {/* Tab ISTORIC */}
          <TabsContent value="history" className="flex-1 overflow-auto p-3 space-y-4 mt-0">
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Istoric intervenții ({historyInterventions.length})
              </h4>
              {historyInterventions.length > 0 ? (
                <div className="space-y-1">
                  {historyInterventions.map(ti => (
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
              ) : (
                <p className="text-xs text-muted-foreground">Nicio intervenție anterioară</p>
              )}
            </div>

            {/* Afecțiuni also visible in history for reference */}
            {toothConditions.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Afecțiuni active</h4>
                <div className="space-y-1">
                  {toothConditions.map(tc => (
                    <div key={tc.id} className="py-1.5 px-2 rounded bg-muted/50 text-xs">
                      <span className="font-medium">{tc.condition?.name}</span>
                      <span className="text-muted-foreground ml-1">({tc.condition?.code})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
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
            <div className="overflow-y-auto max-h-[350px] space-y-0.5">
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
          </div>
        </DialogContent>
      </Dialog>

      {/* Intervenții popup */}
      <Dialog open={showInterventionsDialog} onOpenChange={(open) => {
        setShowInterventionsDialog(open);
        if (!open) setTreatmentSearch('');
      }}>
        <DialogContent className="sm:max-w-[500px] h-[70vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-sm">Adaugă intervenție — Dinte {toothNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 flex flex-col flex-1 min-h-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Caută tratament..."
                value={treatmentSearch}
                onChange={e => setTreatmentSearch(e.target.value)}
                className="pl-8"
                autoFocus
              />
            </div>
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
            <ScrollArea className="flex-1 min-h-0">
              <div className="space-y-3 pb-2">
                {(() => {
                  const normalizeText = (text: string) =>
                    text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                  const searchNorm = normalizeText(treatmentSearch);
                  const filtered = treatments.filter(t =>
                    normalizeText(t.name).includes(searchNorm) ||
                    (t.category && normalizeText(t.category).includes(searchNorm))
                  );
                  const grouped = filtered.reduce((acc, t) => {
                    const cat = t.category || 'Alte tratamente';
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(t);
                    return acc;
                  }, {} as Record<string, Treatment[]>);
                  const cats = Object.keys(grouped).sort();

                  if (filtered.length === 0) {
                    return <p className="text-sm text-muted-foreground py-4 text-center">Niciun tratament găsit</p>;
                  }

                  return cats.map(cat => (
                    <div key={cat} className="space-y-0.5">
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide sticky top-0 bg-background py-1 px-1">
                        {cat}
                      </h4>
                      {grouped[cat].map(t => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setSelectedTreatment(t.id);
                            const treatment = t;
                            if (treatment) {
                              onAddIntervention(
                                toothNumber,
                                treatment.name,
                                treatment.id,
                                selectedDoctor || undefined,
                              ).then(ok => {
                                if (ok) {
                                  setSelectedTreatment('');
                                  setSelectedDoctor('');
                                  setTreatmentSearch('');
                                  setShowInterventionsDialog(false);
                                }
                              });
                            }
                          }}
                          className={cn(
                            'w-full text-left py-2 px-3 rounded-lg text-sm transition-colors',
                            'hover:bg-accent hover:text-accent-foreground',
                            'flex justify-between items-center gap-2'
                          )}
                        >
                          <span className="truncate">{t.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {t.default_price?.toFixed(0) || '0'} lei
                          </span>
                        </button>
                      ))}
                    </div>
                  ));
                })()}
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
