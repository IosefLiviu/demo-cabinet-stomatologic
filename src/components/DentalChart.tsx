import { useState } from 'react';
import { cn } from '@/lib/utils';
import { cleanDentalNotes } from '@/lib/cleanDentalNotes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Re-export from new ImageDentalChart for modern usage
export { ImageDentalChart } from './dental/ImageDentalChart';

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

interface DentalChartProps {
  dentalStatus: ToothData[];
  onToothClick?: (toothNumber: number) => void;
  readonly?: boolean;
  /** Use image-based dental chart instead of simple boxes */
  useImages?: boolean;
}

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

export function DentalChart({ dentalStatus, onToothClick, readonly = false }: DentalChartProps) {
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

  const renderTooth = (toothNumber: number, isDeciduous: boolean = false) => {
    const status = getToothStatus(toothNumber);
    const notes = getToothNotes(toothNumber);
    const cleanNotes = cleanDentalNotes(notes);
    const isHovered = hoveredTooth === toothNumber;
    const hasNotes = !!cleanNotes;

    return (
      <div key={toothNumber} className="relative">
        <button
          type="button"
          onClick={() => handleToothClick(toothNumber)}
          onMouseEnter={() => setHoveredTooth(toothNumber)}
          onMouseLeave={() => setHoveredTooth(null)}
          disabled={readonly && !notes}
          className={cn(
            'flex items-center justify-center font-medium transition-all',
            statusColors[status],
            !readonly && 'hover:scale-110 cursor-pointer',
            status === 'missing' && 'opacity-50',
            isHovered && 'ring-2 ring-primary ring-offset-2',
            hasNotes && 'ring-1 ring-primary/50',
            // Deciduous teeth: circular shape with dashed border
            isDeciduous
              ? 'w-6 h-6 sm:w-9 sm:h-9 rounded-full border-2 text-[10px] sm:text-xs border-dashed'
              : 'w-6 h-8 sm:w-10 sm:h-12 rounded-lg border-2 text-[10px] sm:text-xs'
          )}
        >
          {toothNumber}
        </button>
        
        {/* Tooltip */}
        {isHovered && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded bg-popover border shadow-lg text-xs whitespace-nowrap">
            <div className="font-medium">{statusLabels[status]}</div>
            {hasNotes && <div className="text-muted-foreground text-[10px]">Click pentru notițe</div>}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="space-y-6">
        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(statusLabels).map(([status, label]) => (
            <div
              key={status}
              className={cn(
                'px-2 py-1 rounded-md border flex items-center gap-1.5',
                statusColors[status as ToothStatus]
              )}
            >
              <span>{label}</span>
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
            <div className="flex justify-center gap-0.5 sm:gap-1 overflow-x-auto">
              {upperTeeth.map((tooth) => renderTooth(tooth, false))}
            </div>
          </div>

          {/* Upper jaw - deciduous teeth */}
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground text-center mb-2">
              Dinți temporari (de lapte) - superior
            </div>
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {upperDeciduousTeeth.map((tooth) => renderTooth(tooth, true))}
            </div>
          </div>

          {/* Divider */}
          <div className="flex justify-center">
            <div className="w-full max-w-2xl border-b-2 border-muted-foreground/30 my-2" />
          </div>

          {/* Lower jaw - deciduous teeth */}
          <div className="space-y-1">
            <div className="flex justify-center gap-0.5 sm:gap-1">
              {lowerDeciduousTeeth.map((tooth) => renderTooth(tooth, true))}
            </div>
            <div className="text-xs text-muted-foreground text-center mt-2">
              Dinți temporari (de lapte) - inferior
            </div>
          </div>

          {/* Lower jaw - permanent teeth */}
          <div className="space-y-1">
            <div className="flex justify-center gap-0.5 sm:gap-1 overflow-x-auto">
              {lowerTeeth.map((tooth) => renderTooth(tooth, false))}
            </div>
            <div className="text-xs text-muted-foreground text-center mt-2">
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
                'px-2 py-0.5 rounded text-xs',
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

// Status selector for editing
interface ToothStatusSelectorProps {
  selectedStatus: ToothStatus;
  onStatusChange: (status: ToothStatus) => void;
}

export function ToothStatusSelector({ selectedStatus, onStatusChange }: ToothStatusSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {Object.entries(statusLabels).map(([status, label]) => (
        <button
          key={status}
          type="button"
          onClick={() => onStatusChange(status as ToothStatus)}
          className={cn(
            'px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all',
            statusColors[status as ToothStatus],
            selectedStatus === status && 'ring-2 ring-primary ring-offset-2'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
