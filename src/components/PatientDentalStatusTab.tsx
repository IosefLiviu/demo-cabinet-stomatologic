import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { TOOTH_STATUSES, getStatusHexColor as getStatusHexColorUtil } from '@/constants/toothStatuses';
import { getToothImage } from './dental/toothImages';

export interface ToothData {
  tooth_number: number;
  status: string;
  notes?: string;
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

export function PatientDentalStatusTab({ patientId, dentalStatus, onStatusChange }: PatientDentalStatusTabProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [dialogNotes, setDialogNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  
  
  const activeStatuses = TOOTH_STATUSES;


  const getToothStatus = (toothNumber: number): string => {
    const tooth = dentalStatus.find((t) => t.tooth_number === toothNumber);
    if (!tooth) return 'Sănătos';
    return statusEnumToName[tooth.status] || tooth.status;
  };

  const getStatusHexColor = (statusName: string): string | null => {
    return getStatusHexColorUtil(statusName);
  };

  const getStatusDisplayName = (status: string): string => {
    return statusEnumToName[status] || status;
  };

  const getToothNotes = (toothNumber: number): string | undefined => {
    const tooth = dentalStatus.find((t) => t.tooth_number === toothNumber);
    return tooth?.notes;
  };

  const openToothDialog = (toothNumber: number) => {
    setSelectedTooth(toothNumber);
    setDialogNotes(getToothNotes(toothNumber) || '');
  };

  const handleSaveNotes = async () => {
    if (!selectedTooth) return;
    setSavingNotes(true);
    try {
      const existing = dentalStatus.find(t => t.tooth_number === selectedTooth);
      if (existing) {
        const { error } = await supabase
          .from('dental_status')
          .update({ notes: dialogNotes || null })
          .eq('patient_id', patientId)
          .eq('tooth_number', selectedTooth);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('dental_status')
          .insert({ patient_id: patientId, tooth_number: selectedTooth, status: 'healthy', notes: dialogNotes || null });
        if (error) throw error;
      }
      onStatusChange?.(dentalStatus.map(t => 
        t.tooth_number === selectedTooth ? { ...t, notes: dialogNotes || undefined } : t
      ));
      toast({ title: 'Observații salvate', description: `Dinte ${selectedTooth}` });
      setSelectedTooth(null);
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({ title: 'Eroare', description: 'Nu s-au putut salva observațiile', variant: 'destructive' });
    } finally {
      setSavingNotes(false);
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
      >
        {!isLower && (
          <span className={cn(
            "text-[10px] font-semibold mb-1 transition-all duration-300",
            hasStatus ? 'text-foreground' : 'text-muted-foreground',
            isHovered && 'text-primary scale-110'
          )}>
            {toothNumber}
          </span>
        )}
        
        <div
          onMouseEnter={() => setHoveredTooth(toothNumber)}
          onMouseLeave={() => setHoveredTooth(null)}
          onDoubleClick={() => openToothDialog(toothNumber)}
          className={cn(
            'relative flex items-center justify-center rounded-lg overflow-hidden',
            'transition-all duration-300 ease-out',
            'bg-muted/30 cursor-pointer p-1',
            isHovered && 'ring-2 ring-offset-1 ring-primary z-10',
            hasStatus && !isMissing && 'ring-2',
            isDeciduous 
              ? 'w-9 h-11 sm:w-10 sm:h-12' 
              : 'w-10 h-14 sm:w-11 sm:h-16'
          )}
          style={{
            transform: isHovered ? 'scale(1.15) translateY(-4px)' : 'scale(1) translateY(0)',
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
          {toothImage ? (
            <img 
              src={toothImage} 
              alt={`Dinte ${toothNumber}`}
              className={cn(
                "w-full h-full object-contain transition-all duration-300",
                isMissing && 'opacity-20 grayscale',
                isLower && 'rotate-180',
              )}
              style={{
                filter: isHovered && !isMissing 
                  ? 'brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))' 
                  : undefined,
              }}
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              "bg-gradient-to-b from-muted/40 to-muted/20 border-2 rounded-lg",
              isDeciduous && 'border-dashed',
            )}>
              <span className="text-xs font-medium text-muted-foreground">
                {toothNumber}
              </span>
            </div>
          )}
          
          {hasStatus && hexColor && !isMissing && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-lg transition-all duration-300"
              style={{ backgroundColor: isHovered ? `${hexColor}50` : `${hexColor}30` }}
            />
          )}

          {/* Notes indicator */}
          {notes && (
            <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary border border-background shadow-sm" />
          )}
        </div>
        
        {isLower && (
          <span className={cn(
            "text-[10px] font-semibold mt-1 transition-all duration-300",
            hasStatus ? 'text-foreground' : 'text-muted-foreground',
            isHovered && 'text-primary scale-110'
          )}>
            {toothNumber}
          </span>
        )}
        
        {isHovered && (
          <div className={cn(
            "absolute z-50 px-3 py-2 rounded-xl",
            "bg-popover/95 backdrop-blur-sm border shadow-xl text-xs whitespace-nowrap",
            isLower ? 'top-full mt-2' : 'bottom-full mb-2',
            "left-1/2 -translate-x-1/2"
          )}>
            <div className="font-semibold text-foreground">{status}</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">


      {/* Dental Chart */}
      <div 
        className="relative rounded-2xl p-4 sm:p-6"
        style={{
          background: 'linear-gradient(180deg, hsl(var(--muted)/0.3) 0%, hsl(var(--muted)/0.1) 100%)',
          boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <div className="space-y-4 relative z-10">
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase">
              Maxilar Superior — Dinți Permanenți
            </div>
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {upperTeeth.map(tooth => renderTooth(tooth, false, false))}
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase opacity-70">
              Dinți Temporari — Superior
            </div>
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {upperDeciduousTeeth.map(tooth => renderTooth(tooth, true, false))}
            </div>
          </div>

          <div className="flex justify-center py-4">
            <div 
              className="w-full max-w-3xl h-px"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, hsl(var(--muted-foreground)/0.3) 20%, hsl(var(--muted-foreground)/0.5) 50%, hsl(var(--muted-foreground)/0.3) 80%, transparent 100%)',
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {lowerDeciduousTeeth.map(tooth => renderTooth(tooth, true, true))}
            </div>
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase opacity-70">
              Dinți Temporari — Inferior
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {lowerTeeth.map(tooth => renderTooth(tooth, false, true))}
            </div>
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase">
              Maxilar Inferior — Dinți Permanenți
            </div>
          </div>
        </div>
      </div>

      {/* Tooth notes dialog */}
      <Dialog open={selectedTooth !== null} onOpenChange={(open) => !open && setSelectedTooth(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Dinte {selectedTooth}</DialogTitle>
          </DialogHeader>
          {selectedTooth && (() => {
            const status = getToothStatus(selectedTooth);
            const hexColor = getStatusHexColor(status);
            return (
              <div className="space-y-4 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <span 
                    className="px-2 py-0.5 rounded text-sm font-medium"
                    style={hexColor ? { backgroundColor: `${hexColor}20`, color: hexColor } : undefined}
                  >
                    {status}
                  </span>
                </div>
                <div className="space-y-2">
                  <Label>Observații</Label>
                  <Textarea
                    value={dialogNotes}
                    onChange={(e) => setDialogNotes(e.target.value)}
                    placeholder="Adaugă observații despre dinte..."
                    rows={3}
                  />
                </div>
              </div>
            );
          })()}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setSelectedTooth(null)}>
              Anulează
            </Button>
            <Button type="button" onClick={handleSaveNotes} disabled={savingNotes}>
              {savingNotes ? 'Se salvează...' : 'Salvează'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
