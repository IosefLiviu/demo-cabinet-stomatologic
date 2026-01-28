import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Loader2, Save, History, ChevronDown, ChevronUp, Box, Calendar, RotateCcw } from 'lucide-react';
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
import { Slider } from '@/components/ui/slider';
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
  currentStatus: string; // Primary status (for backward compatibility)
  currentStatuses?: string[]; // Multiple statuses support
  currentNotes: string;
  patientId: string;
  activeStatuses: ToothStatus[];
  onSave: (status: string, notes: string, diagnosticPoints: DiagnosticPoint[], diagnosticLines: DiagnosticLine[], statuses?: string[]) => Promise<void>;
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
  const [diagnosticPoints, setDiagnosticPoints] = useState<DiagnosticPoint[]>([]);
  const [diagnosticLines, setDiagnosticLines] = useState<DiagnosticLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [toothHistory, setToothHistory] = useState<ToothHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('3d');
  
  // Timeline state
  const [timelineIndex, setTimelineIndex] = useState<number | null>(null); // null = current (today)
  const [isTimelineMode, setIsTimelineMode] = useState(false);

  // Helper to extract balanced JSON array from string
  const extractBalancedJson = (str: string, startIndex: number): string | null => {
    if (str[startIndex] !== '[') return null;
    
    let depth = 0;
    let endIndex = startIndex;
    
    for (let i = startIndex; i < str.length; i++) {
      if (str[i] === '[') depth++;
      else if (str[i] === ']') depth--;
      
      if (depth === 0) {
        endIndex = i;
        break;
      }
    }
    
    if (depth !== 0) return null;
    return str.slice(startIndex, endIndex + 1);
  };

  const getDiagnosticLabels = (rawNotes: string | null): string[] => {
    if (!rawNotes) return [];
    const labels: string[] = [];

    const pointsStartIndex = rawNotes.indexOf('[DIAGNOSTICS:');
    if (pointsStartIndex !== -1) {
      const jsonStart = pointsStartIndex + '[DIAGNOSTICS:'.length;
      const jsonContent = extractBalancedJson(rawNotes, jsonStart);
      if (jsonContent) {
        try {
          const parsed = JSON.parse(jsonContent);
          if (Array.isArray(parsed)) {
            parsed.forEach((p: any) => {
              const label = typeof p?.label === 'string' ? p.label.trim() : '';
              if (label) labels.push(label);
            });
          }
        } catch {
          // ignore
        }
      }
    }

    const linesStartIndex = rawNotes.indexOf('[DIAGLINES:');
    if (linesStartIndex !== -1) {
      const jsonStart = linesStartIndex + '[DIAGLINES:'.length;
      const jsonContent = extractBalancedJson(rawNotes, jsonStart);
      if (jsonContent) {
        try {
          const parsed = JSON.parse(jsonContent);
          if (Array.isArray(parsed)) {
            parsed.forEach((l: any) => {
              const label = typeof l?.label === 'string' ? l.label.trim() : '';
              if (label) labels.push(label);
            });
          }
        } catch {
          // ignore
        }
      }
    }

    return Array.from(new Set(labels));
  };

  // Helper to extract multiple statuses from notes
  const getStatusesFromNotes = (rawNotes: string | null): string[] => {
    if (!rawNotes) return [];
    
    const statusesStartIndex = rawNotes.indexOf('[STATUSES:');
    if (statusesStartIndex === -1) return [];
    
    const jsonStart = statusesStartIndex + '[STATUSES:'.length;
    const jsonContent = extractBalancedJson(rawNotes, jsonStart);
    if (!jsonContent) return [];
    
    try {
      const parsed = JSON.parse(jsonContent);
      if (Array.isArray(parsed)) {
        return parsed.filter((s): s is string => typeof s === 'string');
      }
    } catch {
      // ignore
    }
    return [];
  };

  // Helper to get clean notes without diagnostic data
  const getCleanNotes = (rawNotes: string | null): string => {
    if (!rawNotes) return '';
    
    let result = rawNotes;
    
    // Remove DIAGNOSTICS tag with balanced JSON
    const pointsStartIndex = result.indexOf('[DIAGNOSTICS:');
    if (pointsStartIndex !== -1) {
      const jsonStart = pointsStartIndex + '[DIAGNOSTICS:'.length;
      const jsonContent = extractBalancedJson(result, jsonStart);
      if (jsonContent) {
        result = result.replace(`[DIAGNOSTICS:${jsonContent}]`, '');
      }
    }
    
    // Remove DIAGLINES tag with balanced JSON
    const linesStartIndex = result.indexOf('[DIAGLINES:');
    if (linesStartIndex !== -1) {
      const jsonStart = linesStartIndex + '[DIAGLINES:'.length;
      const jsonContent = extractBalancedJson(result, jsonStart);
      if (jsonContent) {
        result = result.replace(`[DIAGLINES:${jsonContent}]`, '');
      }
    }
    
    // Remove STATUSES tag with balanced JSON
    const statusesStartIndex = result.indexOf('[STATUSES:');
    if (statusesStartIndex !== -1) {
      const jsonStart = statusesStartIndex + '[STATUSES:'.length;
      const jsonContent = extractBalancedJson(result, jsonStart);
      if (jsonContent) {
        result = result.replace(`[STATUSES:${jsonContent}]`, '');
      }
    }

    // Heuristic cleanup for older broken saves where note starts with coordinate JSON arrays
    // (e.g. leftover from a failed regex strip of nested arrays)
    const trimmed = result.trimStart();
    if (trimmed.startsWith('[[') && !/[a-zA-ZăâîșțĂÂÎȘȚ]/.test(trimmed)) {
      const leading = extractBalancedJson(trimmed, 0);
      if (leading) {
        result = trimmed.slice(leading.length).replace(/^\s*\n+/, '').trimStart();
      }
    }
    
    return result.replace(/^\n+|\n+$/g, '').trim();
  };

  // Reset state when dialog opens with new tooth
  useEffect(() => {
    if (open) {
      // Initialize with multiple statuses if available, otherwise use single status
      const initialStatuses = currentStatuses || (currentStatus && currentStatus !== 'Sănătos' ? [currentStatus] : []);
      setStatuses(initialStatuses);
      // Notes field starts empty - previous notes are shown in history
      setNotes('');
      setDiagnosticPoints([]);
      setDiagnosticLines([]);
      setHistoryExpanded(false);
      loadToothHistory();
      loadDiagnosticData();
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
        .maybeSingle();
      
      if (data?.notes) {
        // Parse diagnostic points - find balanced JSON array
        const pointsStartIndex = data.notes.indexOf('[DIAGNOSTICS:');
        if (pointsStartIndex !== -1) {
          const jsonStart = pointsStartIndex + '[DIAGNOSTICS:'.length;
          const jsonContent = extractBalancedJson(data.notes, jsonStart);
          if (jsonContent) {
            try {
              const points = JSON.parse(jsonContent);
              setDiagnosticPoints(points);
            } catch (e) {
              console.error('Error parsing diagnostic points:', e);
            }
          }
        }
        
        // Parse diagnostic lines - find balanced JSON array
        const linesStartIndex = data.notes.indexOf('[DIAGLINES:');
        if (linesStartIndex !== -1) {
          const jsonStart = linesStartIndex + '[DIAGLINES:'.length;
          const jsonContent = extractBalancedJson(data.notes, jsonStart);
          if (jsonContent) {
            try {
              const lines = JSON.parse(jsonContent);
              setDiagnosticLines(lines);
            } catch (e) {
              console.error('Error parsing diagnostic lines:', e);
            }
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
      // Primary status is the first selected, or 'Sănătos' if none selected
      const primaryStatus = statuses.length > 0 ? statuses[0] : 'Sănătos';
      await onSave(primaryStatus, notes, diagnosticPoints, diagnosticLines, statuses);
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  // Toggle status in multi-select mode
  const toggleStatus = (statusName: string) => {
    setStatuses(prev => {
      const isSelected = prev.includes(statusName);
      return isSelected 
        ? prev.filter(s => s !== statusName)
        : [...prev, statusName];
    });
  };

  // Primary status is first selected
  const primaryStatus = statuses.length > 0 ? statuses[0] : 'Sănătos';
  const hexColor = getStatusHexColor(primaryStatus);

  // Get unique dates from history for timeline (sorted oldest to newest)
  const timelineDates = useMemo(() => {
    if (toothHistory.length === 0) return [];
    const dates = toothHistory.map(h => format(new Date(h.changed_at), 'yyyy-MM-dd'));
    const uniqueDates = [...new Set(dates)].sort(); // Sort ascending (oldest first)
    return uniqueDates;
  }, [toothHistory]);

  // Reconstruct status at a specific timeline index
  const getHistoricalStatus = useMemo(() => {
    if (timelineIndex === null || timelineDates.length === 0) {
      // Current state
      return {
        status: primaryStatus,
        statuses: statuses,
        hexColor: hexColor,
        date: null as string | null,
      };
    }

    const selectedDate = timelineDates[timelineIndex];
    // Find the most recent history entry at or before this date
    const relevantEntries = toothHistory.filter(h => {
      const entryDate = format(new Date(h.changed_at), 'yyyy-MM-dd');
      return entryDate <= selectedDate;
    });

    if (relevantEntries.length === 0) {
      return {
        status: 'Sănătos',
        statuses: ['Sănătos'],
        hexColor: getStatusHexColor('Sănătos'),
        date: selectedDate,
      };
    }

    // Get the latest entry for this date
    const latestEntry = relevantEntries[0]; // Already sorted newest first
    const entryStatuses = getStatusesFromNotes(latestEntry.notes);
    const displayStatus = getStatusDisplayName(latestEntry.new_status);
    const allStatuses = entryStatuses.length > 0 ? entryStatuses : [displayStatus];
    
    return {
      status: displayStatus,
      statuses: allStatuses,
      hexColor: getStatusHexColor(displayStatus),
      date: selectedDate,
    };
  }, [timelineIndex, timelineDates, toothHistory, primaryStatus, statuses, hexColor, getStatusHexColor, getStatusDisplayName, getStatusesFromNotes]);

  // Reset timeline when exiting timeline mode
  const handleResetTimeline = () => {
    setTimelineIndex(null);
    setIsTimelineMode(false);
  };

  // The status to display (historical or current)
  const displayStatus = isTimelineMode ? getHistoricalStatus.status : primaryStatus;
  const displayStatuses = isTimelineMode ? getHistoricalStatus.statuses : statuses;
  const displayHexColor = isTimelineMode ? getHistoricalStatus.hexColor : hexColor;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[850px] max-h-[95vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Box className="h-5 w-5 text-primary" />
            <span>Dinte {toothNumber}</span>
            <Badge 
              variant="outline"
              style={{
                backgroundColor: displayHexColor ? `${displayHexColor}20` : undefined,
                borderColor: displayHexColor || undefined,
                color: displayHexColor || undefined,
              }}
            >
              {displayStatuses.length > 0 ? displayStatuses.join(', ') : 'Sănătos'}
            </Badge>
            {isTimelineMode && getHistoricalStatus.date && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(getHistoricalStatus.date), 'd MMM yyyy', { locale: ro })}
              </Badge>
            )}
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
          
          <TabsContent value="3d" className="flex-1 min-h-0 mt-4 space-y-3">
            {/* Timeline Controls */}
            {timelineDates.length > 0 && (
              <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <History className="h-4 w-4 text-primary" />
                    Timeline ({timelineDates.length} date{timelineDates.length !== 1 ? 's' : ''})
                  </div>
                  <div className="flex items-center gap-2">
                    {isTimelineMode && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleResetTimeline}
                        className="h-7 text-xs"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Azi
                      </Button>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={isTimelineMode}
                        onChange={(e) => {
                          setIsTimelineMode(e.target.checked);
                          if (e.target.checked && timelineIndex === null) {
                            setTimelineIndex(timelineDates.length - 1); // Start at most recent
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-xs text-muted-foreground">Mod istoric</span>
                    </label>
                  </div>
                </div>
                
                {isTimelineMode && (
                  <div className="space-y-2">
                    <Slider
                      value={[timelineIndex ?? timelineDates.length - 1]}
                      onValueChange={([value]) => setTimelineIndex(value)}
                      min={0}
                      max={timelineDates.length - 1}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{format(new Date(timelineDates[0]), 'd MMM yyyy', { locale: ro })}</span>
                      {timelineDates.length > 2 && (
                        <span className="text-primary font-medium">
                          {timelineIndex !== null 
                            ? format(new Date(timelineDates[timelineIndex]), 'd MMMM yyyy', { locale: ro })
                            : 'Selectează o dată'
                          }
                        </span>
                      )}
                      <span>{format(new Date(timelineDates[timelineDates.length - 1]), 'd MMM yyyy', { locale: ro })}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className={cn(
              "rounded-lg overflow-hidden border",
              timelineDates.length > 0 ? "h-[480px]" : "h-[550px]"
            )}>
              <Tooth3DViewer
                toothNumber={toothNumber}
                status={displayStatus}
                statusColor={displayHexColor || undefined}
                diagnosticPoints={isTimelineMode ? [] : diagnosticPoints}
                diagnosticLines={isTimelineMode ? [] : diagnosticLines}
                onAddDiagnostic={isTimelineMode ? () => {} : handleAddDiagnostic}
                onAddDiagnosticLine={isTimelineMode ? () => {} : handleAddDiagnosticLine}
                onRemoveDiagnostic={isTimelineMode ? () => {} : handleRemoveDiagnostic}
                onRemoveDiagnosticLine={isTimelineMode ? () => {} : handleRemoveDiagnosticLine}
              />
            </div>
            
            {isTimelineMode && (
              <p className="text-xs text-center text-muted-foreground italic">
                Mod vizualizare istoric - editarea este dezactivată
              </p>
            )}
          </TabsContent>
          
          <TabsContent value="details" className="flex-1 overflow-auto mt-4">
            <div className="space-y-4">
              {/* Status Selection - Multi-select */}
              <div className="space-y-2">
                <Label>Status (selectează unul sau mai multe)</Label>
                <div className="grid grid-cols-4 gap-2">
                  {activeStatuses.map((s) => {
                    const isSelected = statuses.includes(s.name);
                    return (
                      <button
                        key={s.id}
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

              {/* History Section - grouped by date */}
              <Collapsible open={historyExpanded} onOpenChange={setHistoryExpanded}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <History className="h-4 w-4" />
                      Istoric modificări {(() => {
                        if (toothHistory.length === 0) return '';
                        
                        // Get unique dates (sorted newest to oldest already)
                        const dates = toothHistory.map(h => format(new Date(h.changed_at), 'yyyy-MM-dd'));
                        const uniqueDates = [...new Set(dates)];
                        
                        if (uniqueDates.length === 1) {
                          // Single date
                          return format(new Date(toothHistory[0].changed_at), 'd MMMM yyyy', { locale: ro });
                        } else {
                          // Date range - oldest to newest
                          const newestDate = new Date(uniqueDates[0]);
                          const oldestDate = new Date(uniqueDates[uniqueDates.length - 1]);
                          
                          const sameMonth = newestDate.getMonth() === oldestDate.getMonth() && 
                                           newestDate.getFullYear() === oldestDate.getFullYear();
                          
                          if (sameMonth) {
                            // Same month: "15 - 24 ianuarie 2026"
                            return `${format(oldestDate, 'd', { locale: ro })} - ${format(newestDate, 'd MMMM yyyy', { locale: ro })}`;
                          } else {
                            // Different months: "15 dec 2025 - 24 ian 2026"
                            return `${format(oldestDate, 'd MMM yyyy', { locale: ro })} - ${format(newestDate, 'd MMM yyyy', { locale: ro })}`;
                          }
                        }
                      })()} ({toothHistory.length})
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
                      <ScrollArea className="h-[250px]">
                        <div className="space-y-1 p-2">
                          {/* Group entries by date - each date is collapsible */}
                          {(() => {
                            const groupedByDate = toothHistory.reduce((acc, entry) => {
                              const dateKey = format(new Date(entry.changed_at), 'yyyy-MM-dd');
                              if (!acc[dateKey]) {
                                acc[dateKey] = [];
                              }
                              acc[dateKey].push(entry);
                              return acc;
                            }, {} as Record<string, typeof toothHistory>);

                            return Object.entries(groupedByDate)
                              .sort(([a], [b]) => b.localeCompare(a)) // Sort dates descending
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
                                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                                    </button>
                                  </CollapsibleTrigger>
                                  
                                  <CollapsibleContent>
                                    <div className="ml-2 mt-1 space-y-1 border-l-2 border-muted pl-3">
                                      {/* Entries for this date */}
                                      {entries.map((entry) => {
                                        const oldColor = getStatusHexColor(getStatusDisplayName(entry.old_status || 'healthy'));
                                        const newColor = getStatusHexColor(getStatusDisplayName(entry.new_status));
                                        
                                        return (
                                          <div key={entry.id} className="py-2 space-y-1">
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
                                                {format(new Date(entry.changed_at), 'HH:mm', { locale: ro })}
                                              </span>
                                            </div>
                                            {entry.notes && (
                                              <div className="space-y-1">
                                                {/* Display multiple statuses if present */}
                                                {getStatusesFromNotes(entry.notes).length > 0 && (
                                                  <div className="flex flex-wrap gap-1">
                                                    {getStatusesFromNotes(entry.notes).map((statusName) => {
                                                      const statusColor = getStatusHexColor(statusName);
                                                      return (
                                                        <Badge 
                                                          key={`${entry.id}-status-${statusName}`}
                                                          variant="outline" 
                                                          className="text-xs"
                                                          style={{
                                                            backgroundColor: statusColor ? `${statusColor}20` : undefined,
                                                            borderColor: statusColor || undefined,
                                                            color: statusColor || undefined,
                                                          }}
                                                        >
                                                          {statusName}
                                                        </Badge>
                                                      );
                                                    })}
                                                  </div>
                                                )}
                                                {getCleanNotes(entry.notes) && (
                                                  <p className="text-sm text-muted-foreground">{getCleanNotes(entry.notes)}</p>
                                                )}
                                                {getDiagnosticLabels(entry.notes).length > 0 && (
                                                  <div className="flex flex-wrap gap-1">
                                                    {getDiagnosticLabels(entry.notes).map((label) => (
                                                      <Badge key={`${entry.id}-${label}`} variant="outline" className="text-xs">
                                                        {label}
                                                      </Badge>
                                                    ))}
                                                  </div>
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
