import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Loader2, Save, History, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToothStatuses } from '@/hooks/useToothStatuses';
import { getToothImage } from './dental/toothImages';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface ToothData {
  tooth_number: number;
  status: string;
  notes?: string;
}

interface ToothHistoryEntry {
  id: string;
  tooth_number: number;
  old_status: string | null;
  new_status: string;
  notes: string | null;
  changed_at: string;
}

interface PatientDentalStatusTabProps {
  patientId: string;
  dentalStatus: ToothData[];
  onStatusChange?: (newStatus: ToothData[]) => void;
}

// FDI notation - permanent teeth
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// FDI notation - deciduous (baby) teeth
const upperDeciduousTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerDeciduousTeeth = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

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

// Map display name to DB enum value
const statusNameToEnum: Record<string, string> = {
  'Sănătos': 'healthy',
  'Carie': 'cavity',
  'Obt Foto': 'filled',
  'Coroană': 'crown',
  'Absent': 'missing',
  'Implant': 'implant',
  'OBT Canal': 'root_canal',
  'Rest Radicular': 'extraction_needed',
  'RCR': 'extraction_needed',
};

export function PatientDentalStatusTab({ patientId, dentalStatus, onStatusChange }: PatientDentalStatusTabProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [toothDialog, setToothDialog] = useState<{
    open: boolean;
    toothNumber: number;
    status: string;
    notes: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [toothHistory, setToothHistory] = useState<ToothHistoryEntry[]>([]);
  const [allTeethHistory, setAllTeethHistory] = useState<Record<number, ToothHistoryEntry>>({});
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  
  const { activeStatuses } = useToothStatuses();

  // Load latest history entry for all teeth with non-healthy status
  useEffect(() => {
    const loadAllTeethHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('dental_status_history')
          .select('*')
          .eq('patient_id', patientId)
          .order('changed_at', { ascending: false });

        if (error) throw error;
        
        // Group by tooth_number, keeping only the latest entry for each
        const historyByTooth: Record<number, ToothHistoryEntry> = {};
        (data || []).forEach(entry => {
          if (!historyByTooth[entry.tooth_number]) {
            historyByTooth[entry.tooth_number] = entry;
          }
        });
        
        setAllTeethHistory(historyByTooth);
      } catch (error) {
        console.error('Error loading all teeth history:', error);
      }
    };
    
    loadAllTeethHistory();
  }, [patientId, dentalStatus]);

  const getToothStatus = (toothNumber: number): string => {
    const tooth = dentalStatus.find((t) => t.tooth_number === toothNumber);
    if (!tooth) return 'Sănătos';
    const displayName = statusEnumToName[tooth.status] || tooth.status;
    return displayName;
  };

  const getToothNotes = (toothNumber: number): string | undefined => {
    const tooth = dentalStatus.find((t) => t.tooth_number === toothNumber);
    return tooth?.notes;
  };

  const getStatusHexColor = (statusName: string): string | null => {
    const dbStatus = activeStatuses.find(s => s.name.toLowerCase() === statusName.toLowerCase());
    return dbStatus?.color || null;
  };

  const getStatusDisplayName = (status: string): string => {
    return statusEnumToName[status] || status;
  };

  const loadToothHistory = async (toothNumber: number) => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('dental_status_history')
        .select('*')
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber)
        .order('changed_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setToothHistory(data || []);
    } catch (error) {
      console.error('Error loading tooth history:', error);
      setToothHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const openToothDialog = async (toothNumber: number) => {
    const currentStatus = getToothStatus(toothNumber);
    const currentNotes = getToothNotes(toothNumber) || '';
    
    setToothDialog({
      open: true,
      toothNumber,
      status: currentStatus,
      notes: currentNotes,
    });
    setHistoryExpanded(false);
    await loadToothHistory(toothNumber);
  };

  const handleSaveToothDialog = async () => {
    if (!toothDialog) return;
    setSaving(true);

    try {
      const oldStatus = getToothStatus(toothDialog.toothNumber);
      const dbStatus = statusNameToEnum[toothDialog.status] || 'healthy';
      const oldDbStatus = statusNameToEnum[oldStatus] || 'healthy';
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save history entry if status changed
      if (oldDbStatus !== dbStatus) {
        await supabase
          .from('dental_status_history')
          .insert({
            patient_id: patientId,
            tooth_number: toothDialog.toothNumber,
            old_status: oldDbStatus,
            new_status: dbStatus,
            notes: toothDialog.notes || null,
            changed_by: user?.id || null,
          });
      }
      
      // Upsert the dental status
      const { error } = await supabase
        .from('dental_status')
        .upsert({
          patient_id: patientId,
          tooth_number: toothDialog.toothNumber,
          status: dbStatus as any,
          notes: toothDialog.notes || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'patient_id,tooth_number',
        });

      if (error) throw error;

      // Update local state
      const newStatus = dentalStatus.filter(t => t.tooth_number !== toothDialog.toothNumber);
      if (toothDialog.status !== 'Sănătos' || toothDialog.notes) {
        newStatus.push({
          tooth_number: toothDialog.toothNumber,
          status: dbStatus,
          notes: toothDialog.notes || undefined,
        });
      }
      
      onStatusChange?.(newStatus);
      toast.success('Status dentar salvat');
      setToothDialog(null);
    } catch (error) {
      console.error('Error saving tooth status:', error);
      toast.error('Eroare la salvare');
    } finally {
      setSaving(false);
    }
  };

  const renderTooth = (toothNumber: number, isDeciduous: boolean = false, isLower: boolean = false) => {
    const status = getToothStatus(toothNumber);
    const notes = getToothNotes(toothNumber);
    const isHovered = hoveredTooth === toothNumber;
    const toothImage = getToothImage(toothNumber);
    const hexColor = getStatusHexColor(status);
    const hasStatus = status !== 'Sănătos' && status !== 'healthy';

    return (
      <div key={toothNumber} className="relative flex flex-col items-center">
        {!isLower && (
          <span className={cn(
            "text-[10px] font-medium mb-0.5",
            hasStatus ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {toothNumber}
          </span>
        )}
        
        <button
          type="button"
          onClick={() => openToothDialog(toothNumber)}
          onMouseEnter={() => setHoveredTooth(toothNumber)}
          onMouseLeave={() => setHoveredTooth(null)}
          className={cn(
            'relative flex items-center justify-center transition-all rounded-md overflow-hidden',
            'hover:scale-105 cursor-pointer',
            isHovered && 'ring-2 ring-offset-1 ring-primary',
            hasStatus && 'ring-2',
            isDeciduous 
              ? 'w-7 h-9 sm:w-8 sm:h-10' 
              : 'w-8 h-11 sm:w-9 sm:h-13'
          )}
          style={hasStatus && hexColor ? {
            boxShadow: `0 0 0 2px ${hexColor}`,
          } : undefined}
        >
          {toothImage ? (
            <img 
              src={toothImage} 
              alt={`Dinte ${toothNumber}`}
              className={cn(
                "w-full h-full object-contain",
                isLower && 'rotate-180',
                status === 'missing' || status === 'Absent' ? 'opacity-30 grayscale' : ''
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
          
          {hasStatus && hexColor && (
            <div 
              className="absolute inset-0 rounded-md"
              style={{ backgroundColor: `${hexColor}40` }}
            />
          )}
        </button>
        
        {isLower && (
          <span className={cn(
            "text-[10px] font-medium mt-0.5",
            hasStatus ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {toothNumber}
          </span>
        )}
        
        {isHovered && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-popover border shadow-lg text-xs whitespace-nowrap">
            <div className="font-medium">{status}</div>
            {notes && <div className="text-muted-foreground max-w-[150px] truncate">{notes}</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {activeStatuses.map((status) => (
          <div
            key={status.id}
            className="px-2 py-1 rounded-md border flex items-center gap-1.5"
            style={{
              backgroundColor: `${status.color}20`,
              borderColor: status.color,
              color: status.color,
            }}
          >
            <span>{status.name}</span>
          </div>
        ))}
      </div>

      {/* Dental Chart */}
      <div className="space-y-4">
        {/* Upper jaw - permanent teeth */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground text-center mb-2">
            Maxilar superior (dinți permanenți)
          </div>
          <div className="flex justify-center gap-0.5">
            {upperTeeth.map(tooth => renderTooth(tooth, false, false))}
          </div>
        </div>

        {/* Upper jaw - deciduous teeth */}
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground text-center mb-2">
            Dinți temporari (de lapte) - superior
          </div>
          <div className="flex justify-center gap-0.5">
            {upperDeciduousTeeth.map(tooth => renderTooth(tooth, true, false))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl border-b-2 border-muted-foreground/30 my-2" />
        </div>

        {/* Lower jaw - deciduous teeth */}
        <div className="space-y-1">
          <div className="flex justify-center gap-0.5">
            {lowerDeciduousTeeth.map(tooth => renderTooth(tooth, true, true))}
          </div>
          <div className="text-xs text-muted-foreground text-center mt-2">
            Dinți temporari (de lapte) - inferior
          </div>
        </div>

        {/* Lower jaw - permanent teeth */}
        <div className="space-y-1">
          <div className="flex justify-center gap-0.5">
            {lowerTeeth.map(tooth => renderTooth(tooth, false, true))}
          </div>
          <div className="text-xs text-muted-foreground text-center mt-2">
            Maxilar inferior (dinți permanenți)
          </div>
        </div>
      </div>

      {/* History Section - visible below the chart */}
      {Object.keys(allTeethHistory).length > 0 && (
        <div className="mt-6 border rounded-lg bg-muted/20 p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <History className="h-4 w-4" />
            Istoric modificări status dentar
          </h4>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {Object.entries(allTeethHistory)
              .sort(([, a], [, b]) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime())
              .map(([toothNum, entry]) => {
                const oldColor = getStatusHexColor(getStatusDisplayName(entry.old_status || 'healthy'));
                const newColor = getStatusHexColor(getStatusDisplayName(entry.new_status));
                
                return (
                  <div 
                    key={entry.id} 
                    className="flex items-start gap-3 p-3 bg-background rounded-md border"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                      <span className="text-sm font-bold">{toothNum}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {entry.old_status && (
                          <>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{
                                backgroundColor: oldColor ? `${oldColor}20` : undefined,
                                borderColor: oldColor || undefined,
                                color: oldColor || undefined,
                              }}
                            >
                              {getStatusDisplayName(entry.old_status)}
                            </Badge>
                            <span className="text-muted-foreground">→</span>
                          </>
                        )}
                        <Badge 
                          variant="outline"
                          className="text-xs"
                          style={{
                            backgroundColor: newColor ? `${newColor}20` : undefined,
                            borderColor: newColor || undefined,
                            color: newColor || undefined,
                          }}
                        >
                          {getStatusDisplayName(entry.new_status)}
                        </Badge>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {format(new Date(entry.changed_at), 'dd MMM yyyy, HH:mm', { locale: ro })}
                        </span>
                      </div>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Tooth Edit Dialog with History */}
      <Dialog open={!!toothDialog?.open} onOpenChange={() => setToothDialog(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Dinte {toothDialog?.toothNumber}
              {toothDialog && (
                <Badge 
                  variant="outline"
                  style={{
                    backgroundColor: `${getStatusHexColor(toothDialog.status)}20`,
                    borderColor: getStatusHexColor(toothDialog.status) || undefined,
                    color: getStatusHexColor(toothDialog.status) || undefined,
                  }}
                >
                  {toothDialog.status}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="grid grid-cols-4 gap-2">
                {activeStatuses.map((status) => {
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
                        backgroundColor: `${status.color}20`,
                        borderColor: status.color,
                        color: status.color,
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
                rows={2}
              />
            </div>

            {/* History Section */}
            <Collapsible open={historyExpanded} onOpenChange={setHistoryExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Istoric modificări ({toothHistory.length})
                  </span>
                  {historyExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 border rounded-lg">
                  {loadingHistory ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : toothHistory.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Nu există istoric pentru acest dinte
                    </div>
                  ) : (
                    <ScrollArea className="h-[200px]">
                      <div className="divide-y">
                        {toothHistory.map((entry) => {
                          const oldColor = getStatusHexColor(getStatusDisplayName(entry.old_status || 'healthy'));
                          const newColor = getStatusHexColor(getStatusDisplayName(entry.new_status));
                          
                          return (
                            <div key={entry.id} className="p-3 space-y-1">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm">
                                  {entry.old_status && (
                                    <>
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs"
                                        style={{
                                          backgroundColor: oldColor ? `${oldColor}20` : undefined,
                                          borderColor: oldColor || undefined,
                                          color: oldColor || undefined,
                                        }}
                                      >
                                        {getStatusDisplayName(entry.old_status)}
                                      </Badge>
                                      <span className="text-muted-foreground">→</span>
                                    </>
                                  )}
                                  <Badge 
                                    variant="outline"
                                    className="text-xs"
                                    style={{
                                      backgroundColor: newColor ? `${newColor}20` : undefined,
                                      borderColor: newColor || undefined,
                                      color: newColor || undefined,
                                    }}
                                  >
                                    {getStatusDisplayName(entry.new_status)}
                                  </Badge>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(entry.changed_at), 'dd MMM yyyy, HH:mm', { locale: ro })}
                                </span>
                              </div>
                              {entry.notes && (
                                <p className="text-xs text-muted-foreground">{entry.notes}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setToothDialog(null)}>
              Anulează
            </Button>
            <Button type="button" onClick={handleSaveToothDialog} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvează
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
