import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Loader2, Save, History, ChevronDown, ChevronUp, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooth3DViewer, DiagnosticPoint, DiagnosticLine } from './Tooth3DViewer';

interface ToothHistoryEntry {
  id: string;
  tooth_number: number;
  old_status: string | null;
  new_status: string;
  notes: string | null;
  changed_at: string;
  changed_by: string | null;
  doctor_name?: string | null;
}

interface ToothStatus {
  id: string;
  name: string;
  color: string;
}

interface Tooth3DDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toothNumber: number;
  currentStatus: string;
  currentNotes: string;
  patientId: string;
  activeStatuses: ToothStatus[];
  onSave: (status: string, notes: string, diagnosticPoints: DiagnosticPoint[], diagnosticLines: DiagnosticLine[]) => Promise<void>;
  getStatusHexColor: (status: string) => string | null;
  getStatusDisplayName: (status: string) => string;
}

export function Tooth3DDialog({
  open,
  onOpenChange,
  toothNumber,
  currentStatus,
  currentNotes,
  patientId,
  activeStatuses,
  onSave,
  getStatusHexColor,
  getStatusDisplayName,
}: Tooth3DDialogProps) {
  const [status, setStatus] = useState(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [diagnosticPoints, setDiagnosticPoints] = useState<DiagnosticPoint[]>([]);
  const [diagnosticLines, setDiagnosticLines] = useState<DiagnosticLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [toothHistory, setToothHistory] = useState<ToothHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('3d');

  // Reset state when dialog opens with new tooth
  useEffect(() => {
    if (open) {
      setStatus(currentStatus);
      setNotes(currentNotes);
      setDiagnosticPoints([]);
      setDiagnosticLines([]);
      setHistoryExpanded(false);
      loadToothHistory();
      loadDiagnosticData();
    }
  }, [open, toothNumber, currentStatus, currentNotes]);

  const loadToothHistory = async () => {
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
      
      // Fetch doctor names
      const userIds = [...new Set((data || []).map(d => d.changed_by).filter(Boolean))];
      let doctorMap: Record<string, string> = {};
      
      if (userIds.length > 0) {
        const { data: doctorsData } = await supabase
          .from('doctors')
          .select('user_id, name')
          .in('user_id', userIds);
        
        doctorMap = (doctorsData || []).reduce((acc, doc) => {
          if (doc.user_id) acc[doc.user_id] = doc.name;
          return acc;
        }, {} as Record<string, string>);
      }
      
      const entriesWithDoctorNames = (data || []).map(entry => ({
        ...entry,
        doctor_name: entry.changed_by ? doctorMap[entry.changed_by] || null : null
      }));
      
      setToothHistory(entriesWithDoctorNames);
    } catch (error) {
      console.error('Error loading tooth history:', error);
      setToothHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadDiagnosticData = async () => {
    // Load diagnostic points and lines from notes
    try {
      const { data } = await supabase
        .from('dental_status')
        .select('notes')
        .eq('patient_id', patientId)
        .eq('tooth_number', toothNumber)
        .single();
      
      if (data?.notes) {
        // Parse diagnostic points
        const pointsMatch = data.notes.match(/\[DIAGNOSTICS:(\[[\s\S]*?\])\]/);
        if (pointsMatch) {
          try {
            const points = JSON.parse(pointsMatch[1]);
            setDiagnosticPoints(points);
          } catch (e) {
            console.error('Error parsing diagnostic points:', e);
          }
        }
        
        // Parse diagnostic lines
        const linesMatch = data.notes.match(/\[DIAGLINES:(\[[\s\S]*?\])\]/);
        if (linesMatch) {
          try {
            const lines = JSON.parse(linesMatch[1]);
            setDiagnosticLines(lines);
          } catch (e) {
            console.error('Error parsing diagnostic lines:', e);
          }
        }
      }
    } catch (error) {
      // Tooth might not exist yet, ignore
    }
  };

  const handleAddDiagnostic = (position: [number, number, number], label: string) => {
    const newPoint: DiagnosticPoint = {
      id: crypto.randomUUID(),
      position,
      label,
    };
    setDiagnosticPoints(prev => [...prev, newPoint]);
  };

  const handleAddDiagnosticLine = (points: [number, number, number][], label: string) => {
    const newLine: DiagnosticLine = {
      id: crypto.randomUUID(),
      points,
      label,
    };
    setDiagnosticLines(prev => [...prev, newLine]);
  };

  const handleRemoveDiagnostic = (id: string) => {
    setDiagnosticPoints(prev => prev.filter(p => p.id !== id));
  };

  const handleRemoveDiagnosticLine = (id: string) => {
    setDiagnosticLines(prev => prev.filter(l => l.id !== id));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(status, notes, diagnosticPoints, diagnosticLines);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const hexColor = getStatusHexColor(status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Box className="h-5 w-5 text-primary" />
            <span>Dinte {toothNumber}</span>
            <Badge 
              variant="outline"
              style={{
                backgroundColor: hexColor ? `${hexColor}20` : undefined,
                borderColor: hexColor || undefined,
                color: hexColor || undefined,
              }}
            >
              {status}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="3d" className="flex items-center gap-2">
              <Box className="h-4 w-4" />
              Vizualizare 3D
            </TabsTrigger>
            <TabsTrigger value="details">Detalii & Istoric</TabsTrigger>
          </TabsList>
          
          <TabsContent value="3d" className="flex-1 min-h-0 mt-4">
            <div className="h-[450px] rounded-lg overflow-hidden border">
              <Tooth3DViewer
                toothNumber={toothNumber}
                status={status}
                statusColor={hexColor || undefined}
                diagnosticPoints={diagnosticPoints}
                diagnosticLines={diagnosticLines}
                onAddDiagnostic={handleAddDiagnostic}
                onAddDiagnosticLine={handleAddDiagnosticLine}
                onRemoveDiagnostic={handleRemoveDiagnostic}
                onRemoveDiagnosticLine={handleRemoveDiagnosticLine}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="details" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              {/* Status Selection */}
              <div className="space-y-2">
                <Label>Status</Label>
                <div className="grid grid-cols-4 gap-2">
                  {activeStatuses.map((s) => {
                    const isSelected = status === s.name;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setStatus(s.name)}
                        className={cn(
                          'px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all',
                          isSelected && 'ring-2 ring-primary ring-offset-2'
                        )}
                        style={{
                          backgroundColor: `${s.color}20`,
                          borderColor: s.color,
                          color: s.color,
                        }}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                      <ScrollArea className="h-[150px]">
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
                                    {entry.doctor_name && (
                                      <span className="font-medium mr-1">{entry.doctor_name} •</span>
                                    )}
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
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Anulează
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
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
  );
}
