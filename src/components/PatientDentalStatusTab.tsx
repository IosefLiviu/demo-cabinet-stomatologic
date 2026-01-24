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
  const [saving, setSaving] = useState(false);
  const [toothHistory, setToothHistory] = useState<ToothHistoryEntry[]>([]);
  const [allHistoryEntries, setAllHistoryEntries] = useState<ToothHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  
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
      
      setToothHistory(entriesWithDoctorNames);
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
      
      // Reload history after save to show the new entry
      if (oldDbStatus !== dbStatus) {
        await loadAllTeethHistoryFn();
        await loadToothHistory(toothDialog.toothNumber);
      }
      
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
            'relative flex items-center justify-center rounded-xl overflow-hidden',
            'transition-all duration-300 ease-out',
            'bg-gradient-to-b from-white/10 to-transparent',
            'shadow-[0_4px_15px_-3px_rgba(0,0,0,0.2)]',
            'cursor-pointer',
            isHovered && 'ring-2 ring-offset-2 ring-primary',
            hasStatus && !isMissing && 'ring-2',
            // Larger sizes for better 3D effect
            isDeciduous 
              ? 'w-10 h-12 sm:w-11 sm:h-14' 
              : 'w-11 h-14 sm:w-13 sm:h-16'
          )}
          style={{
            transform: isHovered 
              ? `rotateX(${isLower ? '8deg' : '-8deg'}) rotateY(${toothNumber % 2 === 0 ? '5deg' : '-5deg'}) scale(1.15) translateZ(10px)`
              : 'rotateX(0) rotateY(0) scale(1) translateZ(0)',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            boxShadow: hasStatus && hexColor 
              ? `0 0 0 2px ${hexColor}, ${isHovered ? `0 8px 25px -5px ${hexColor}80` : '0 4px 15px -3px rgba(0,0,0,0.2)'}`
              : isHovered 
                ? '0 8px 25px -5px rgba(34,197,94,0.4)' 
                : '0 4px 15px -3px rgba(0,0,0,0.2)',
          }}
        >
          {/* 3D Depth layer */}
          <div 
            className={cn(
              "absolute inset-0 rounded-xl transition-opacity duration-300",
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.1) 100%)',
              transform: 'translateZ(-5px)',
            }}
          />

          {/* Tooth image with 3D effect */}
          {toothImage ? (
            <img 
              src={toothImage} 
              alt={`Dinte ${toothNumber}`}
              className={cn(
                "w-full h-full object-contain transition-all duration-300",
                "drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]",
                isMissing && 'opacity-20 grayscale blur-[0.5px]',
                isLower && 'rotate-180',
                isHovered && 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]'
              )}
              style={{
                filter: isHovered && !isMissing 
                  ? 'brightness(1.1) contrast(1.05)' 
                  : undefined,
              }}
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              "bg-gradient-to-b from-muted/40 to-muted/20 border-2 rounded-lg",
              isDeciduous && 'border-dashed'
            )}>
              <span className="text-xs font-medium text-muted-foreground">
                {toothNumber}
              </span>
            </div>
          )}
          
          {/* Status overlay with gradient */}
          {hasStatus && hexColor && !isMissing && (
            <div 
              className={cn(
                "absolute inset-0 pointer-events-none rounded-xl",
                "transition-opacity duration-300",
                isHovered && 'opacity-70'
              )}
              style={{ backgroundColor: `${hexColor}40` }}
            >
              {/* Shine effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent"
                style={{ mixBlendMode: 'overlay' }}
              />
            </div>
          )}

          {/* Highlight shine on hover */}
          {isHovered && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl animate-pulse"
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
        className="relative rounded-2xl p-6 overflow-hidden"
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
            <div className="flex justify-center gap-1">
              {upperTeeth.map(tooth => renderTooth(tooth, false, false))}
            </div>
          </div>

          {/* Upper jaw - deciduous teeth */}
          <div className="space-y-2 mt-4">
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase opacity-70">
              Dinți Temporari — Superior
            </div>
            <div className="flex justify-center gap-1">
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
            <div className="flex justify-center gap-1">
              {lowerDeciduousTeeth.map(tooth => renderTooth(tooth, true, true))}
            </div>
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase opacity-70">
              Dinți Temporari — Inferior
            </div>
          </div>

          {/* Lower jaw - permanent teeth */}
          <div className="space-y-2 mt-4">
            <div className="flex justify-center gap-1">
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
        <div className="mt-6 border rounded-lg bg-muted/20 p-4">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <History className="h-4 w-4" />
            Istoric modificări status dentar
          </h4>
          <div className="space-y-4 max-h-[400px] overflow-y-auto">
            {Object.entries(historyByDate)
              .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
              .map(([dateKey, entries], index) => (
                <Collapsible key={dateKey} defaultOpen={index === 0}>
                  <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between gap-2 text-sm font-medium text-muted-foreground hover:bg-muted/50 p-2 rounded-lg transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="bg-muted px-2 py-1 rounded">
                          {format(new Date(dateKey), 'dd MMMM yyyy', { locale: ro })}
                        </span>
                        <span className="text-xs">
                          {entries.length} {entries.length === 1 ? 'modificare' : 'modificări'}
                        </span>
                      </div>
                      <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-2 pl-2 border-l-2 border-muted mt-2">
                      {entries.map((entry) => {
                        const oldColor = getStatusHexColor(getStatusDisplayName(entry.old_status || 'healthy'));
                        const newColor = getStatusHexColor(getStatusDisplayName(entry.new_status));
                        
                        return (
                          <div 
                            key={entry.id} 
                            className="flex items-start gap-3 p-3 bg-background rounded-md border"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-md bg-muted flex items-center justify-center">
                              <span className="text-sm font-bold">{entry.tooth_number}</span>
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
                                  {entry.doctor_name && (
                                    <span className="font-medium mr-1">{entry.doctor_name} •</span>
                                  )}
                                  {format(new Date(entry.changed_at), 'HH:mm', { locale: ro })}
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
                  </CollapsibleContent>
                </Collapsible>
              ))}
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
