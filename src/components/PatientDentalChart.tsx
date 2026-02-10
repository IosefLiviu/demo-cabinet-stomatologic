import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { TOOTH_STATUSES, STATUS_ENUM_TO_NAME, STATUS_NAME_TO_ENUM, getStatusHexColor as getStatusHexColorUtil } from '@/constants/toothStatuses';
import { supabase } from '@/integrations/supabase/client';
import { getToothImage } from './dental/toothImages';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface ToothData {
  tooth_number: number;
  status: string;
  notes?: string;
}

interface PatientDentalChartProps {
  patientId: string;
  dentalStatus: ToothData[];
  onStatusChange?: (newStatus: ToothData[]) => void;
  readonly?: boolean;
}

// FDI notation - permanent teeth
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// FDI notation - deciduous (baby) teeth
const upperDeciduousTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerDeciduousTeeth = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

export function PatientDentalChart({ patientId, dentalStatus, onStatusChange, readonly = false }: PatientDentalChartProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [toothDialog, setToothDialog] = useState<{
    open: boolean;
    toothNumber: number;
    status: string;
    notes: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const statusList = TOOTH_STATUSES;

  const getToothStatus = (toothNumber: number): string => {
    const tooth = dentalStatus.find((t) => t.tooth_number === toothNumber);
    if (!tooth) return 'Sănătos';
    return STATUS_ENUM_TO_NAME[tooth.status] || tooth.status;
  };

  const getToothNotes = (toothNumber: number): string | undefined => {
    const tooth = dentalStatus.find((t) => t.tooth_number === toothNumber);
    return tooth?.notes;
  };

  const getStatusHexColor = (statusName: string): string | null => {
    return getStatusHexColorUtil(statusName);
  };

  const openToothDialog = (toothNumber: number) => {
    if (readonly) return;
    const currentStatus = getToothStatus(toothNumber);
    const currentNotes = getToothNotes(toothNumber) || '';
    
    setToothDialog({
      open: true,
      toothNumber,
      status: currentStatus,
      notes: currentNotes,
    });
  };


  const handleSaveToothDialog = async () => {
    if (!toothDialog) return;
    setSaving(true);

    try {
      const dbStatus = STATUS_NAME_TO_ENUM[toothDialog.status] || 'healthy';
      
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

      // Update local state - store display name for consistency
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
        {/* Tooth number - show above for upper teeth */}
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
          disabled={readonly}
          className={cn(
            'relative flex items-center justify-center transition-all rounded-md overflow-hidden',
            !readonly && 'hover:scale-105 cursor-pointer',
            readonly && 'cursor-default',
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
          {/* Tooth image */}
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
          
          {/* Status overlay when has status */}
          {hasStatus && hexColor && (
            <div 
              className="absolute inset-0 rounded-md"
              style={{ backgroundColor: `${hexColor}40` }}
            />
          )}
        </button>
        
        {/* Tooth number - show below for lower teeth */}
        {isLower && (
          <span className={cn(
            "text-[10px] font-medium mt-0.5",
            hasStatus ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {toothNumber}
          </span>
        )}
        
        {/* Tooltip */}
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
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        {statusList.map((status) => (
          <div
            key={status.dbValue}
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

      {/* Tooth Edit Dialog */}
      <Dialog open={!!toothDialog?.open} onOpenChange={() => setToothDialog(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Dinte {toothDialog?.toothNumber}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <div className="grid grid-cols-4 gap-2">
                {statusList.map((status) => {
                  const isSelected = toothDialog?.status === status.name;
                  return (
                    <button
                      key={status.dbValue}
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
                rows={3}
              />
            </div>
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
