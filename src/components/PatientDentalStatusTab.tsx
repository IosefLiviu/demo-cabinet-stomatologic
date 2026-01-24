import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { ChevronDown, ChevronUp, History, MapPin, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useToothStatuses } from '@/hooks/useToothStatuses';
import { getToothImage } from './dental/toothImages';
import { toast } from 'sonner';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Tooth3DDialog } from './dental/Tooth3DDialog';
import { DiagnosticPoint, DiagnosticLine } from './dental/Tooth3DViewer';

// Helper to extract balanced JSON array from string
function extractBalancedJson(str: string, startIndex: number): string | null {
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
}

function stripTaggedBalanced(input: string, tag: '[DIAGNOSTICS:' | '[DIAGLINES:'): string {
  let result = input;

  // handle multiple occurrences defensively
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const tagIndex = result.indexOf(tag);
    if (tagIndex === -1) break;

    const jsonStart = tagIndex + tag.length;
    const json = extractBalancedJson(result, jsonStart);
    if (!json) {
      // If we can't parse balanced JSON, avoid infinite loop.
      break;
    }

    result = result.replace(`${tag}${json}]`, '');
  }

  return result;
}

function stripOrphanLeadingJsonArray(input: string): string {
  const trimmed = input.trimStart();

  // Heuristic for older broken saves where the start of notes contains only numeric coordinate arrays.
  // Example: [[-0.01,0.02,0.03], ...]
  if (!trimmed.startsWith('[[')) return input;

  // If there are letters, we assume it's user text.
  if (/[a-zA-ZăâîșțĂÂÎȘȚ]/.test(trimmed)) return input;

  const json = extractBalancedJson(trimmed, 0);
  if (!json) return input;

  const without = trimmed.slice(json.length);
  return without.replace(/^\s*\n+/, '').trimStart();
}

// Helper function to parse diagnostic data from notes
function parseDiagnosticData(notes: string | null): { points: number; lines: number } {
  if (!notes) return { points: 0, lines: 0 };
  
  let points = 0;
  let lines = 0;
  
  // Parse diagnostic points - find balanced JSON array
  const pointsStartIndex = notes.indexOf('[DIAGNOSTICS:');
  if (pointsStartIndex !== -1) {
    const jsonStart = pointsStartIndex + '[DIAGNOSTICS:'.length;
    const jsonContent = extractBalancedJson(notes, jsonStart);
    if (jsonContent) {
      try {
        const parsed = JSON.parse(jsonContent);
        points = Array.isArray(parsed) ? parsed.length : 0;
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
  
  // Parse diagnostic lines - find balanced JSON array
  const linesStartIndex = notes.indexOf('[DIAGLINES:');
  if (linesStartIndex !== -1) {
    const jsonStart = linesStartIndex + '[DIAGLINES:'.length;
    const jsonContent = extractBalancedJson(notes, jsonStart);
    if (jsonContent) {
      try {
        const parsed = JSON.parse(jsonContent);
        lines = Array.isArray(parsed) ? parsed.length : 0;
      } catch (e) {
        // Ignore parse errors
      }
    }
  }
  
  return { points, lines };
}

function parseDiagnosticLabels(notes: string | null): { pointLabels: string[]; lineLabels: string[] } {
  if (!notes) return { pointLabels: [], lineLabels: [] };

  const pointLabels: string[] = [];
  const lineLabels: string[] = [];

  const pointsStartIndex = notes.indexOf('[DIAGNOSTICS:');
  if (pointsStartIndex !== -1) {
    const jsonStart = pointsStartIndex + '[DIAGNOSTICS:'.length;
    const jsonContent = extractBalancedJson(notes, jsonStart);
    if (jsonContent) {
      try {
        const parsed = JSON.parse(jsonContent);
        if (Array.isArray(parsed)) {
          parsed.forEach((p: any) => {
            const label = typeof p?.label === 'string' ? p.label.trim() : '';
            if (label) pointLabels.push(label);
          });
        }
      } catch {
        // ignore
      }
    }
  }

  const linesStartIndex = notes.indexOf('[DIAGLINES:');
  if (linesStartIndex !== -1) {
    const jsonStart = linesStartIndex + '[DIAGLINES:'.length;
    const jsonContent = extractBalancedJson(notes, jsonStart);
    if (jsonContent) {
      try {
        const parsed = JSON.parse(jsonContent);
        if (Array.isArray(parsed)) {
          parsed.forEach((l: any) => {
            const label = typeof l?.label === 'string' ? l.label.trim() : '';
            if (label) lineLabels.push(label);
          });
        }
      } catch {
        // ignore
      }
    }
  }

  // unique
  return {
    pointLabels: Array.from(new Set(pointLabels)),
    lineLabels: Array.from(new Set(lineLabels)),
  };
}

// Helper to get clean notes without diagnostic data
function getCleanNotes(notes: string | null): string {
  if (!notes) return '';
  
  let result = notes;

  // Remove tagged technical data
  result = stripTaggedBalanced(result, '[DIAGNOSTICS:');
  result = stripTaggedBalanced(result, '[DIAGLINES:');

  // Remove any orphaned leading JSON arrays from older broken regex-strips
  result = stripOrphanLeadingJsonArray(result);

  return result.replace(/^\n+|\n+$/g, '').trim();
}

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
  changed_by: string | null;
  doctor_name?: string | null;
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
  const [allHistoryEntries, setAllHistoryEntries] = useState<ToothHistoryEntry[]>([]);
  
  const { activeStatuses } = useToothStatuses();

  // Load all history entries
  useEffect(() => {
    loadAllTeethHistoryFn();
  }, [patientId, dentalStatus]);

  const loadAllTeethHistoryFn = async () => {
    try {
      const { data, error } = await supabase
        .from('dental_status_history')
        .select('*')
        .eq('patient_id', patientId)
        .order('changed_at', { ascending: false });

      if (error) throw error;
      
      // Fetch doctor names for changed_by user IDs
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
      
      setAllHistoryEntries(entriesWithDoctorNames);
    } catch (error) {
      console.error('Error loading all teeth history:', error);
    }
  };

  // Group history entries by date
  const historyByDate = allHistoryEntries.reduce((acc, entry) => {
    const dateKey = format(new Date(entry.changed_at), 'yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, ToothHistoryEntry[]>);

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

  const openToothDialog = (toothNumber: number) => {
    const currentStatus = getToothStatus(toothNumber);
    const currentNotes = getToothNotes(toothNumber) || '';
    
    setToothDialog({
      open: true,
      toothNumber,
      status: currentStatus,
      notes: currentNotes,
    });
  };

  const handleSaveToothStatus = async (status: string, notes: string, diagnosticPoints: DiagnosticPoint[], diagnosticLines: DiagnosticLine[] = []) => {
    if (!toothDialog) return;

    try {
      const oldStatus = getToothStatus(toothDialog.toothNumber);
      const oldNotes = getToothNotes(toothDialog.toothNumber) || '';
      const dbStatus = statusNameToEnum[status] || 'healthy';
      const oldDbStatus = statusNameToEnum[oldStatus] || 'healthy';

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Prepare notes with diagnostic points and lines
      let finalNotes = notes.trim();

      // Remove any existing diagnostic data from notes before adding new (balanced-safe)
      finalNotes = stripTaggedBalanced(finalNotes, '[DIAGNOSTICS:');
      finalNotes = stripTaggedBalanced(finalNotes, '[DIAGLINES:');
      finalNotes = stripOrphanLeadingJsonArray(finalNotes);
      finalNotes = finalNotes.trim();

      if (diagnosticPoints.length > 0) {
        const diagnosticsJson = JSON.stringify(diagnosticPoints);
        finalNotes = finalNotes ? `${finalNotes}\n[DIAGNOSTICS:${diagnosticsJson}]` : `[DIAGNOSTICS:${diagnosticsJson}]`;
      }
      if (diagnosticLines.length > 0) {
        const linesJson = JSON.stringify(diagnosticLines);
        finalNotes = finalNotes ? `${finalNotes}\n[DIAGLINES:${linesJson}]` : `[DIAGLINES:${linesJson}]`;
      }

      // Check if there are any changes (status, notes, diagnostics)
      const hasStatusChange = oldDbStatus !== dbStatus;
      const hasNotesChange = oldNotes !== finalNotes;
      const hasAnyChange = hasStatusChange || hasNotesChange;

      // Save history entry if anything changed
      if (hasAnyChange) {
        const { error: historyError } = await supabase
          .from('dental_status_history')
          .insert({
            patient_id: patientId,
            tooth_number: toothDialog.toothNumber,
            old_status: oldDbStatus,
            new_status: dbStatus,
            notes: finalNotes || null,
            changed_by: user?.id || null,
          });

        if (historyError) throw historyError;
      }

      // Upsert the dental status (and return row for state sync)
      const { data: savedRow, error: upsertError } = await supabase
        .from('dental_status')
        .upsert({
          patient_id: patientId,
          tooth_number: toothDialog.toothNumber,
          status: dbStatus as any,
          notes: finalNotes || null,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'patient_id,tooth_number',
        })
        .select('tooth_number,status,notes')
        .maybeSingle();

      if (upsertError) throw upsertError;

      const syncedStatus = savedRow?.status ?? dbStatus;
      const syncedNotes = (savedRow?.notes ?? finalNotes) || '';

      // Update local state
      const newStatus = dentalStatus.filter(t => t.tooth_number !== toothDialog.toothNumber);
      if (status !== 'Sănătos' || syncedNotes) {
        newStatus.push({
          tooth_number: toothDialog.toothNumber,
          status: syncedStatus,
          notes: syncedNotes || undefined,
        });
      }

      onStatusChange?.(newStatus);

      // Reload history after save if there were changes
      if (hasAnyChange) {
        await loadAllTeethHistoryFn();
      }

      toast.success('Status dentar salvat');
      setToothDialog(null);
    } catch (e: any) {
      console.error('Save dental status failed:', e);
      toast.error('Nu s-a putut salva. Verifică și încearcă din nou.');
      throw e;
    }
  };

  const renderTooth = (toothNumber: number, isDeciduous: boolean = false, isLower: boolean = false) => {
    const status = getToothStatus(toothNumber);
    const notes = getToothNotes(toothNumber);
    const isHovered = hoveredTooth === toothNumber;
    const toothImage = getToothImage(toothNumber);
    const hexColor = getStatusHexColor(status);
    const hasStatus = status !== 'Sănătos' && status !== 'healthy';
    const isMissing = status === 'missing' || status === 'Absent';

    return (
      <div 
        key={toothNumber} 
        className="relative flex flex-col items-center group"
        style={{ perspective: '500px' }}
      >
        {/* Tooth number - above for upper teeth */}
        {!isLower && (
          <span className={cn(
            "text-[10px] font-semibold mb-1 transition-all duration-300",
            hasStatus ? 'text-foreground' : 'text-muted-foreground',
            isHovered && 'text-primary scale-110'
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
            'relative flex items-center justify-center rounded-lg overflow-hidden',
            'transition-all duration-300 ease-out',
            'bg-muted/30',
            'cursor-pointer p-1',
            'hover:bg-muted/50',
            isHovered && 'ring-2 ring-offset-1 ring-primary z-10',
            hasStatus && !isMissing && 'ring-2',
            // Adjusted sizes for proper image framing
            isDeciduous 
              ? 'w-9 h-11 sm:w-10 sm:h-12' 
              : 'w-10 h-14 sm:w-11 sm:h-16'
          )}
          style={{
            transform: isHovered 
              ? 'scale(1.15) translateY(-4px)'
              : 'scale(1) translateY(0)',
            boxShadow: isHovered 
              ? hasStatus && hexColor 
                ? `0 0 0 2px ${hexColor}, 0 8px 20px -4px ${hexColor}60, 0 4px 12px rgba(0,0,0,0.15)`
                : '0 8px 20px -4px rgba(34,197,94,0.3), 0 4px 12px rgba(0,0,0,0.15)'
              : hasStatus && hexColor 
                ? `0 0 0 2px ${hexColor}`
                : 'none',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease-out',
          }}
        >
          {/* Tooth image - properly framed */}
          {toothImage ? (
            <img 
              src={toothImage} 
              alt={`Dinte ${toothNumber}`}
              className={cn(
                "w-full h-full object-contain",
                "transition-all duration-300",
                isMissing && 'opacity-20 grayscale',
                isLower && 'rotate-180',
              )}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                filter: isHovered && !isMissing 
                  ? 'brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))' 
                  : undefined,
              }}
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              "bg-gradient-to-b from-muted/40 to-muted/20 border-2 rounded-lg",
              "transition-all duration-300",
              isDeciduous && 'border-dashed',
              isHovered && 'from-muted/60 to-muted/40'
            )}>
              <span className={cn(
                "text-xs font-medium text-muted-foreground transition-colors duration-300",
                isHovered && 'text-foreground'
              )}>
                {toothNumber}
              </span>
            </div>
          )}
          
          {/* Status overlay with hover glow */}
          {hasStatus && hexColor && !isMissing && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-lg transition-all duration-300"
              style={{ 
                backgroundColor: isHovered ? `${hexColor}50` : `${hexColor}30`,
              }}
            />
          )}

          {/* Shine effect on hover */}
          {isHovered && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-lg overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, transparent 100%)',
              }}
            />
          )}
        </button>
        
        {/* Tooth number - below for lower teeth */}
        {isLower && (
          <span className={cn(
            "text-[10px] font-semibold mt-1 transition-all duration-300",
            hasStatus ? 'text-foreground' : 'text-muted-foreground',
            isHovered && 'text-primary scale-110'
          )}>
            {toothNumber}
          </span>
        )}
        
        {/* Enhanced 3D Tooltip */}
        {isHovered && (
          <div 
            className={cn(
              "absolute z-50 px-3 py-2 rounded-xl",
              "bg-popover/95 backdrop-blur-sm border shadow-xl",
              "text-xs whitespace-nowrap",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              isLower ? 'top-full mt-2' : 'bottom-full mb-2',
              "left-1/2 -translate-x-1/2"
            )}
            style={{
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
            }}
          >
            <div className="font-semibold text-foreground">{status}</div>
            {notes && (
              <div className="text-muted-foreground max-w-[180px] truncate mt-0.5">
                {notes}
              </div>
            )}
            {/* Tooltip arrow */}
            <div 
              className={cn(
                "absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45",
                "bg-popover/95 border",
                isLower ? '-top-1 border-t border-l' : '-bottom-1 border-b border-r'
              )}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced 3D Legend */}
      <div className="flex flex-wrap justify-center gap-2 text-xs">
        {activeStatuses.map((status) => (
          <div
            key={status.id}
            className="px-3 py-1.5 rounded-lg border-2 flex items-center gap-2 shadow-sm transition-all duration-200 hover:scale-105 cursor-default"
            style={{
              backgroundColor: `${status.color}20`,
              borderColor: status.color,
              color: status.color,
            }}
          >
            {/* Status indicator dot with glow */}
            <div 
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: status.color,
                boxShadow: `0 0 6px ${status.color}99`,
              }}
            />
            <span className="font-medium">{status.name}</span>
          </div>
        ))}
      </div>

      {/* 3D Dental Chart Container */}
      <div 
        className="relative rounded-2xl p-4 sm:p-6"
        style={{
          background: 'linear-gradient(180deg, hsl(var(--muted)/0.3) 0%, hsl(var(--muted)/0.1) 100%)',
          boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {/* Ambient light effect */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.15) 0%, transparent 70%)',
          }}
        />

        <div className="space-y-4 relative z-10">
          {/* Upper jaw - permanent teeth */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase">
              Maxilar Superior — Dinți Permanenți
            </div>
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {upperTeeth.map(tooth => renderTooth(tooth, false, false))}
            </div>
          </div>

          {/* Upper jaw - deciduous teeth */}
          <div className="space-y-2 mt-4">
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase opacity-70">
              Dinți Temporari — Superior
            </div>
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {upperDeciduousTeeth.map(tooth => renderTooth(tooth, true, false))}
            </div>
          </div>

          {/* Enhanced Divider with glow */}
          <div className="flex justify-center py-4">
            <div 
              className="w-full max-w-3xl h-px"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, hsl(var(--muted-foreground)/0.3) 20%, hsl(var(--muted-foreground)/0.5) 50%, hsl(var(--muted-foreground)/0.3) 80%, transparent 100%)',
              }}
            />
          </div>

          {/* Lower jaw - deciduous teeth */}
          <div className="space-y-2">
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {lowerDeciduousTeeth.map(tooth => renderTooth(tooth, true, true))}
            </div>
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase opacity-70">
              Dinți Temporari — Inferior
            </div>
          </div>

          {/* Lower jaw - permanent teeth */}
          <div className="space-y-2 mt-4">
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {lowerTeeth.map(tooth => renderTooth(tooth, false, true))}
            </div>
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase">
              Maxilar Inferior — Dinți Permanenți
            </div>
          </div>
        </div>

        {/* Bottom shadow gradient */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, hsl(var(--muted)/0.2) 0%, transparent 100%)',
          }}
        />
      </div>

      {/* History Section - visible below the chart */}
      {allHistoryEntries.length > 0 && (
        <div className="mt-6 border rounded-xl bg-gradient-to-b from-muted/30 to-muted/10 p-4 shadow-sm">
          <h4 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <History className="h-4 w-4 text-primary" />
            </div>
            Istoric modificări status dentar
            <Badge variant="secondary" className="ml-auto">
              {allHistoryEntries.length} total
            </Badge>
          </h4>
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {Object.entries(historyByDate)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([dateKey, entries], index) => {
                // Calculate summary for the date
                const teethModified = new Set(entries.map(e => e.tooth_number)).size;
                const totalDiagnostics = entries.reduce((acc, e) => {
                  const d = parseDiagnosticData(e.notes);
                  return acc + d.points + d.lines;
                }, 0);
                
                return (
                  <Collapsible key={dateKey} defaultOpen={index === 0}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center justify-between gap-3 text-sm font-medium hover:bg-muted/60 p-3 rounded-xl transition-all border bg-background/80 backdrop-blur-sm group">
                        <div className="flex items-center gap-3">
                          {/* Date indicator */}
                          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary">
                            <span className="text-lg font-bold leading-none">
                              {format(new Date(dateKey), 'dd', { locale: ro })}
                            </span>
                            <span className="text-[10px] uppercase leading-tight">
                              {format(new Date(dateKey), 'MMM', { locale: ro })}
                            </span>
                          </div>
                          
                          {/* Summary info */}
                          <div className="flex flex-col items-start gap-1">
                            <span className="font-semibold text-foreground">
                              {format(new Date(dateKey), 'EEEE, yyyy', { locale: ro })}
                            </span>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-blue-500" />
                                {teethModified} {teethModified === 1 ? 'dinte' : 'dinți'}
                              </span>
                              <span>•</span>
                              <span>{entries.length} {entries.length === 1 ? 'modificare' : 'modificări'}</span>
                              {totalDiagnostics > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {totalDiagnostics} diagnostic
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-300 group-data-[state=open]:rotate-180" />
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-3 ml-6 space-y-2 border-l-2 border-primary/20 pl-4">
                        {entries.map((entry, entryIndex) => {
                          const oldColor = getStatusHexColor(getStatusDisplayName(entry.old_status || 'healthy'));
                          const newColor = getStatusHexColor(getStatusDisplayName(entry.new_status));
                          const diagnosticData = parseDiagnosticData(entry.notes);
                          const cleanNotes = getCleanNotes(entry.notes);
                          const diagnosticLabels = parseDiagnosticLabels(entry.notes);
                          const hasDiagnostics = diagnosticData.points > 0 || diagnosticData.lines > 0;
                          const statusChanged = entry.old_status !== entry.new_status;
                          
                          return (
                            <div 
                              key={entry.id} 
                              className="relative flex items-start gap-3 p-3 bg-background rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                            >
                              {/* Timeline dot */}
                              <div 
                                className="absolute -left-[1.35rem] top-4 w-2.5 h-2.5 rounded-full border-2 border-background"
                                style={{ backgroundColor: newColor || 'hsl(var(--primary))' }}
                              />
                              
                              {/* Tooth number badge */}
                              <div 
                                className="flex-shrink-0 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold"
                                style={{
                                  backgroundColor: newColor ? `${newColor}15` : 'hsl(var(--muted))',
                                  color: newColor || 'hsl(var(--foreground))',
                                }}
                              >
                                <span className="text-lg">{entry.tooth_number}</span>
                              </div>
                              
                              <div className="flex-1 min-w-0 space-y-2">
                                {/* Status change row */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  {statusChanged && entry.old_status ? (
                                    <>
                                      <Badge 
                                        variant="outline" 
                                        className="text-xs font-medium"
                                        style={{
                                          backgroundColor: oldColor ? `${oldColor}20` : undefined,
                                          borderColor: oldColor || undefined,
                                          color: oldColor || undefined,
                                        }}
                                      >
                                        {getStatusDisplayName(entry.old_status)}
                                      </Badge>
                                      <span className="text-muted-foreground font-medium">→</span>
                                      <Badge 
                                        variant="outline"
                                        className="text-xs font-medium"
                                        style={{
                                          backgroundColor: newColor ? `${newColor}20` : undefined,
                                          borderColor: newColor || undefined,
                                          color: newColor || undefined,
                                        }}
                                      >
                                        {getStatusDisplayName(entry.new_status)}
                                      </Badge>
                                    </>
                                  ) : (
                                    <Badge 
                                      variant="outline"
                                      className="text-xs font-medium"
                                      style={{
                                        backgroundColor: newColor ? `${newColor}20` : undefined,
                                        borderColor: newColor || undefined,
                                        color: newColor || undefined,
                                      }}
                                    >
                                      {getStatusDisplayName(entry.new_status)}
                                    </Badge>
                                  )}
                                  
                                  {/* Time and doctor */}
                                  <span className="text-xs text-muted-foreground ml-auto flex items-center gap-1.5">
                                    {entry.doctor_name && (
                                      <span className="font-medium text-foreground/70">{entry.doctor_name}</span>
                                    )}
                                    <span className="bg-muted px-1.5 py-0.5 rounded text-[10px]">
                                      {format(new Date(entry.changed_at), 'HH:mm', { locale: ro })}
                                    </span>
                                  </span>
                                </div>
                                
                                {/* Diagnostic badges row */}
                                {hasDiagnostics && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {diagnosticData.points > 0 && (
                                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 gap-1.5">
                                        <MapPin className="h-3 w-3 text-red-500" />
                                        {diagnosticData.points} {diagnosticData.points === 1 ? 'punct diagnostic' : 'puncte diagnostic'}
                                      </Badge>
                                    )}
                                    {diagnosticData.lines > 0 && (
                                      <Badge variant="secondary" className="text-[10px] px-2 py-0.5 gap-1.5">
                                        <Pencil className="h-3 w-3 text-orange-500" />
                                        {diagnosticData.lines} {diagnosticData.lines === 1 ? 'traseu diagnostic' : 'trasee diagnostic'}
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                {/* Diagnostic labels (e.g. the text you wrote on the red line) */}
                                {(diagnosticLabels.pointLabels.length > 0 || diagnosticLabels.lineLabels.length > 0) && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {diagnosticLabels.pointLabels.map((label) => (
                                      <Badge key={`p-${entry.id}-${label}`} variant="outline" className="text-[10px]">
                                        {label}
                                      </Badge>
                                    ))}
                                    {diagnosticLabels.lineLabels.map((label) => (
                                      <Badge key={`l-${entry.id}-${label}`} variant="outline" className="text-[10px]">
                                        {label}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                
                                {/* Notes */}
                                {cleanNotes && (
                                  <p className="text-sm text-muted-foreground bg-muted/50 rounded-md px-2 py-1.5 italic">
                                    "{cleanNotes}"
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
          </div>
        </div>
      )}

      {/* 3D Tooth Dialog */}
      {toothDialog && (
        <Tooth3DDialog
          open={toothDialog.open}
          onOpenChange={(open) => {
            if (!open) setToothDialog(null);
          }}
          toothNumber={toothDialog.toothNumber}
          currentStatus={toothDialog.status}
          currentNotes={toothDialog.notes}
          patientId={patientId}
          activeStatuses={activeStatuses}
          onSave={handleSaveToothStatus}
          getStatusHexColor={getStatusHexColor}
          getStatusDisplayName={getStatusDisplayName}
        />
      )}
    </div>
  );
}
