import { useState, useEffect, useMemo } from 'react';
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
  name: string;
  color: string;
  dbValue: string;
}

interface Tooth3DDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toothNumber: number;
  currentStatus: string;
  currentStatuses?: string[];
  currentNotes: string;
  patientId: string;
  activeStatuses: ToothStatus[];
  onSave: (status: string, notes: string, statuses?: string[]) => Promise<void>;
  getStatusHexColor: (status: string) => string | null;
  getStatusDisplayName: (status: string) => string;
}

export function Tooth3DDialog({
  open,
  onOpenChange,
  toothNumber,
  currentStatus,
  currentStatuses,
  currentNotes,
  patientId,
  activeStatuses,
  onSave,
  getStatusHexColor,
  getStatusDisplayName,
}: Tooth3DDialogProps) {
  const [statuses, setStatuses] = useState<string[]>(currentStatuses || (currentStatus ? [currentStatus] : []));
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [toothHistory, setToothHistory] = useState<ToothHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);

  // Helper to extract balanced JSON array from string
  const extractBalancedJson = (str: string, startIndex: number): string | null => {
    if (str[startIndex] !== '[') return null;
    let depth = 0;
    let endIndex = startIndex;
    for (let i = startIndex; i < str.length; i++) {
      if (str[i] === '[') depth++;
      else if (str[i] === ']') depth--;
      if (depth === 0) { endIndex = i; break; }
    }
    if (depth !== 0) return null;
    return str.slice(startIndex, endIndex + 1);
  };

  // Helper to extract multiple statuses from notes
  const getStatusesFromNotes = (rawNotes: string | null): string[] => {
    if (!rawNotes) return [];
    const idx = rawNotes.indexOf('[STATUSES:');
    if (idx === -1) return [];
    const jsonStart = idx + '[STATUSES:'.length;
    const jsonContent = extractBalancedJson(rawNotes, jsonStart);
    if (!jsonContent) return [];
    try {
      const parsed = JSON.parse(jsonContent);
      if (Array.isArray(parsed)) return parsed.filter((s): s is string => typeof s === 'string');
    } catch { /* ignore */ }
    return [];
  };

  // Helper to get clean notes without technical data
  const getCleanNotes = (rawNotes: string | null): string => {
    if (!rawNotes) return '';
    let result = rawNotes;
    // Remove all tagged data
    for (const tag of ['[DIAGNOSTICS:', '[DIAGLINES:', '[STATUSES:']) {
      let idx = result.indexOf(tag);
      while (idx !== -1) {
        const jsonStart = idx + tag.length;
        const json = extractBalancedJson(result, jsonStart);
        if (!json) break;
        result = result.replace(`${tag}${json}]`, '');
        idx = result.indexOf(tag);
      }
    }
    // Remove orphan leading JSON arrays
    const trimmed = result.trimStart();
    if (trimmed.startsWith('[[') && !/[a-zA-ZăâîșțĂÂÎȘȚ]/.test(trimmed)) {
      const json = extractBalancedJson(trimmed, 0);
      if (json) result = trimmed.slice(json.length).replace(/^\s*\n+/, '').trimStart();
    }
    return result.replace(/^\n+|\n+$/g, '').trim();
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      const initialStatuses = currentStatuses || (currentStatus && currentStatus !== 'Sănătos' ? [currentStatus] : []);
      setStatuses(initialStatuses);
      setNotes('');
      setHistoryExpanded(false);
      loadToothHistory();
    }
  }, [open, toothNumber, currentStatus, currentStatuses, currentNotes]);

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
      
      setToothHistory((data || []).map(entry => ({
        ...entry,
        doctor_name: entry.changed_by ? doctorMap[entry.changed_by] || null : null
      })));
    } catch (error) {
      console.error('Error loading tooth history:', error);
      setToothHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const primaryStatus = statuses.length > 0 ? statuses[0] : 'Sănătos';
      await onSave(primaryStatus, notes, statuses);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = (statusName: string) => {
    setStatuses(prev => {
      const isSelected = prev.includes(statusName);
      return isSelected ? prev.filter(s => s !== statusName) : [...prev, statusName];
    });
  };

  const primaryStatus = statuses.length > 0 ? statuses[0] : 'Sănătos';
  const hexColor = getStatusHexColor(primaryStatus);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>Dinte {toothNumber}</span>
            <Badge 
              variant="outline"
              style={{
                backgroundColor: hexColor ? `${hexColor}20` : undefined,
                borderColor: hexColor || undefined,
                color: hexColor || undefined,
              }}
            >
              {statuses.length > 0 ? statuses.join(', ') : 'Sănătos'}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto space-y-4">
          {/* Status Selection - Multi-select */}
          <div className="space-y-2">
            <Label>Status (selectează unul sau mai multe)</Label>
            <div className="grid grid-cols-4 gap-2">
              {activeStatuses.map((s) => {
                const isSelected = statuses.includes(s.name);
                return (
                  <button
                    key={s.dbValue}
                    type="button"
                    onClick={() => toggleStatus(s.name)}
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
            {statuses.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Selectate: {statuses.join(', ')}
              </p>
            )}
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
                {historyExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
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
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-1 p-2">
                      {(() => {
                        const groupedByDate = toothHistory.reduce((acc, entry) => {
                          const dateKey = format(new Date(entry.changed_at), 'yyyy-MM-dd');
                          if (!acc[dateKey]) acc[dateKey] = [];
                          acc[dateKey].push(entry);
                          return acc;
                        }, {} as Record<string, typeof toothHistory>);

                        return Object.entries(groupedByDate)
                          .sort(([a], [b]) => b.localeCompare(a))
                          .map(([dateKey, entries], index) => (
                            <Collapsible key={dateKey} defaultOpen={index === 0}>
                              <CollapsibleTrigger asChild>
                                <button className="w-full flex items-center justify-between bg-muted/50 hover:bg-muted/70 rounded-lg px-3 py-2 transition-colors cursor-pointer">
                                  <div className="flex items-center gap-2">
                                    <History className="h-3.5 w-3.5 text-primary" />
                                    <span className="text-xs font-medium">
                                      {format(new Date(dateKey), 'd MMMM yyyy', { locale: ro })} ({entries.length})
                                    </span>
                                  </div>
                                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                </button>
                              </CollapsibleTrigger>
                              <CollapsibleContent>
                                <div className="ml-2 mt-1 space-y-1 border-l-2 border-muted pl-3">
                                  {entries.map((entry) => {
                                    const oldColor = getStatusHexColor(getStatusDisplayName(entry.old_status || 'healthy'));
                                    const newColor = getStatusHexColor(getStatusDisplayName(entry.new_status));
                                    return (
                                      <div key={entry.id} className="py-2 space-y-1">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2 text-sm">
                                            {entry.old_status && (
                                              <>
                                                <Badge variant="outline" className="text-xs" style={{ backgroundColor: oldColor ? `${oldColor}20` : undefined, borderColor: oldColor || undefined, color: oldColor || undefined }}>
                                                  {getStatusDisplayName(entry.old_status)}
                                                </Badge>
                                                <span className="text-muted-foreground">→</span>
                                              </>
                                            )}
                                            <Badge variant="outline" className="text-xs" style={{ backgroundColor: newColor ? `${newColor}20` : undefined, borderColor: newColor || undefined, color: newColor || undefined }}>
                                              {getStatusDisplayName(entry.new_status)}
                                            </Badge>
                                          </div>
                                          <span className="text-xs text-muted-foreground">
                                            {entry.doctor_name && <span className="font-medium mr-1">{entry.doctor_name} •</span>}
                                            {format(new Date(entry.changed_at), 'HH:mm', { locale: ro })}
                                          </span>
                                        </div>
                                        {entry.notes && (
                                          <div className="space-y-1">
                                            {getStatusesFromNotes(entry.notes).length > 0 && (
                                              <div className="flex flex-wrap gap-1">
                                                {getStatusesFromNotes(entry.notes).map((statusName) => {
                                                  const statusColor = getStatusHexColor(statusName);
                                                  return (
                                                    <Badge key={`${entry.id}-status-${statusName}`} variant="outline" className="text-xs" style={{ backgroundColor: statusColor ? `${statusColor}20` : undefined, borderColor: statusColor || undefined, color: statusColor || undefined }}>
                                                      {statusName}
                                                    </Badge>
                                                  );
                                                })}
                                              </div>
                                            )}
                                            {getCleanNotes(entry.notes) && (
                                              <p className="text-sm text-muted-foreground">{getCleanNotes(entry.notes)}</p>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </CollapsibleContent>
                            </Collapsible>
                          ));
                      })()}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Anulează
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Salvează
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
