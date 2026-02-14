import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getToothImage } from './toothImages';
import { cleanDentalNotes } from '@/lib/cleanDentalNotes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type ToothStatus = 
  | 'healthy'
  | 'cavity'
  | 'filled'
  | 'crown'
  | 'missing'
  | 'implant'
  | 'root_canal'
  | 'extraction_needed';

interface ToothData {
  tooth_number: number;
  status: ToothStatus;
  notes?: string;
}

interface ImageDentalChartProps {
  dentalStatus: ToothData[];
  onToothClick?: (toothNumber: number) => void;
  readonly?: boolean;
}

const statusOverlayColors: Record<ToothStatus, string> = {
  healthy: '',
  cavity: 'bg-destructive/40',
  filled: 'bg-cabinet-2/40',
  crown: 'bg-cabinet-4/40',
  missing: 'bg-muted/60',
  implant: 'bg-cabinet-3/40',
  root_canal: 'bg-warning/40',
  extraction_needed: 'bg-destructive/50',
};

const statusBorderColors: Record<ToothStatus, string> = {
  healthy: 'ring-success/50',
  cavity: 'ring-destructive',
  filled: 'ring-cabinet-2',
  crown: 'ring-cabinet-4',
  missing: 'ring-muted-foreground/50',
  implant: 'ring-cabinet-3',
  root_canal: 'ring-warning',
  extraction_needed: 'ring-destructive',
};

const statusLabels: Record<ToothStatus, string> = {
  healthy: 'Sănătos',
  cavity: 'Carie',
  filled: 'Plombat',
  crown: 'Coroană',
  missing: 'Lipsă',
  implant: 'Implant',
  root_canal: 'Canal',
  extraction_needed: 'De extras',
};

// FDI notation - permanent teeth
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// FDI notation - deciduous (baby) teeth
const upperDeciduousTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerDeciduousTeeth = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

const statusColors: Record<ToothStatus, string> = {
  healthy: 'bg-success/20 border-success text-success',
  cavity: 'bg-destructive/20 border-destructive text-destructive',
  filled: 'bg-cabinet-2/20 border-cabinet-2 text-cabinet-2',
  crown: 'bg-cabinet-4/20 border-cabinet-4 text-cabinet-4',
  missing: 'bg-muted border-muted-foreground/30 text-muted-foreground',
  implant: 'bg-cabinet-3/20 border-cabinet-3 text-cabinet-3',
  root_canal: 'bg-warning/20 border-warning text-warning',
  extraction_needed: 'bg-destructive/30 border-destructive text-destructive',
};

export function ImageDentalChart({ dentalStatus, onToothClick, readonly = false }: ImageDentalChartProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

  const getToothStatus = (toothNumber: number): ToothStatus => {
    const tooth = dentalStatus.find((t) => t.tooth_number === toothNumber);
    return tooth?.status || 'healthy';
  };

  const getToothNotes = (toothNumber: number): string | undefined => {
    const tooth = dentalStatus.find((t) => t.tooth_number === toothNumber);
    return tooth?.notes;
  };

  const handleToothClick = (toothNumber: number) => {
    const notes = getToothNotes(toothNumber);
    const cleanNotes = cleanDentalNotes(notes);
    if (cleanNotes) {
      setSelectedTooth(toothNumber);
    }
    onToothClick?.(toothNumber);
  };

  const selectedToothStatus = selectedTooth ? getToothStatus(selectedTooth) : 'healthy';
  const selectedToothNotes = selectedTooth ? cleanDentalNotes(getToothNotes(selectedTooth)) : '';

  const renderTooth = (toothNumber: number, isDeciduous: boolean = false, isLower: boolean = false) => {
    const status = getToothStatus(toothNumber);
    const notes = getToothNotes(toothNumber);
    const cleanNotes = cleanDentalNotes(notes);
    const isHovered = hoveredTooth === toothNumber;
    const toothImage = getToothImage(toothNumber);
    const hasNotes = !!cleanNotes;

    return (
      <div key={toothNumber} className="relative flex flex-col items-center">
        {/* Tooth number - show above for upper teeth, below for lower teeth */}
        {!isLower && (
          <span className={cn(
            "text-[8px] sm:text-[10px] font-medium mb-0.5",
            status !== 'healthy' ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {toothNumber}
          </span>
        )}
        
        <button
          type="button"
          onClick={() => handleToothClick(toothNumber)}
          onMouseEnter={() => setHoveredTooth(toothNumber)}
          onMouseLeave={() => setHoveredTooth(null)}
          disabled={readonly && !notes}
          className={cn(
            'relative flex items-center justify-center transition-all rounded-md overflow-hidden',
            !readonly && 'hover:scale-105 cursor-pointer',
            isHovered && 'ring-2 ring-offset-1',
            isHovered && statusBorderColors[status],
            status !== 'healthy' && 'ring-2',
            status !== 'healthy' && statusBorderColors[status],
            hasNotes && 'ring-1 ring-primary/50',
            // Size based on tooth type
            isDeciduous
              ? 'w-5 h-7 sm:w-9 sm:h-11'
              : 'w-6 h-8 sm:w-10 sm:h-14'
          )}
        >
          {/* Tooth image */}
          {toothImage ? (
            <img 
              src={toothImage} 
              alt={`Dinte ${toothNumber}`}
              className={cn(
                "w-full h-full object-contain",
                status === 'missing' && 'opacity-30 grayscale',
                isLower && 'rotate-180'
              )}
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center bg-muted/20 border rounded",
              isDeciduous && 'border-dashed'
            )}>
              {toothNumber}
            </div>
          )}
          
          {/* Status overlay */}
          {status !== 'healthy' && status !== 'missing' && (
            <div className={cn(
              "absolute inset-0 pointer-events-none",
              statusOverlayColors[status]
            )} />
          )}
        </button>
        
        {/* Tooth number - show below for lower teeth */}
        {isLower && (
          <span className={cn(
            "text-[8px] sm:text-[10px] font-medium mt-0.5",
            status !== 'healthy' ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {toothNumber}
          </span>
        )}
        
        {/* Tooltip */}
        {isHovered && (
          <div className={cn(
            "absolute z-50 px-2 py-1 rounded bg-popover border shadow-lg text-xs whitespace-nowrap",
            isLower ? 'top-full mt-1' : 'bottom-full mb-1',
            "left-1/2 -translate-x-1/2"
          )}>
            <div className="font-medium">{statusLabels[status]}</div>
            {hasNotes && <div className="text-muted-foreground text-[10px]">Click pentru notițe</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-4">
        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div
              key={status}
              className={cn(
                'px-2 py-1 rounded-md border flex items-center gap-1.5',
                status === 'healthy' && 'bg-success/20 border-success text-success',
                status === 'cavity' && 'bg-destructive/20 border-destructive text-destructive',
                status === 'filled' && 'bg-cabinet-2/20 border-cabinet-2 text-cabinet-2',
                status === 'crown' && 'bg-cabinet-4/20 border-cabinet-4 text-cabinet-4',
                status === 'missing' && 'bg-muted border-muted-foreground/30 text-muted-foreground',
                status === 'implant' && 'bg-cabinet-3/20 border-cabinet-3 text-cabinet-3',
                status === 'root_canal' && 'bg-warning/20 border-warning text-warning',
                status === 'extraction_needed' && 'bg-destructive/30 border-destructive text-destructive'
              )}
            >
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Dental Chart */}
        <div className="space-y-2 bg-muted/20 rounded-lg p-2 sm:p-4">
          {/* Upper jaw - permanent teeth */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground text-center mb-1">
              Maxilar superior (dinți permanenți)
            </div>
            <div className="flex justify-center gap-0.5">
              {upperTeeth.map((tooth) => renderTooth(tooth, false, false))}
            </div>
          </div>

          {/* Upper jaw - deciduous teeth */}
          <div className="space-y-1 mt-3">
            <div className="text-xs text-muted-foreground text-center mb-1">
              Dinți temporari (de lapte) - superior
            </div>
            <div className="flex justify-center gap-0.5">
              {upperDeciduousTeeth.map((tooth) => renderTooth(tooth, true, false))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex justify-center py-2">
            <div className="w-full max-w-3xl border-b-2 border-muted-foreground/30" />
          </div>

          {/* Lower jaw - deciduous teeth */}
          <div className="space-y-1">
            <div className="flex justify-center gap-0.5">
              {lowerDeciduousTeeth.map((tooth) => renderTooth(tooth, true, true))}
            </div>
            <div className="text-xs text-muted-foreground text-center mt-1">
              Dinți temporari (de lapte) - inferior
            </div>
          </div>

          {/* Lower jaw - permanent teeth */}
          <div className="space-y-1 mt-3">
            <div className="flex justify-center gap-0.5">
              {lowerTeeth.map((tooth) => renderTooth(tooth, false, true))}
            </div>
            <div className="text-xs text-muted-foreground text-center mt-1">
              Maxilar inferior (dinți permanenți)
            </div>
          </div>
        </div>
      </div>

      {/* Notes Dialog */}
      <Dialog open={selectedTooth !== null} onOpenChange={(open) => !open && setSelectedTooth(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>Dinte {selectedTooth}</span>
              <span className={cn(
                'px-2 py-0.5 rounded text-xs border',
                statusColors[selectedToothStatus]
              )}>
                {statusLabels[selectedToothStatus]}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Notițe:</div>
            <div className="p-3 bg-muted/50 rounded-lg text-sm whitespace-pre-wrap">
              {selectedToothNotes || 'Fără notițe'}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Re-export ToothStatusSelector for compatibility
export { ToothStatusSelector } from '../DentalChart';
