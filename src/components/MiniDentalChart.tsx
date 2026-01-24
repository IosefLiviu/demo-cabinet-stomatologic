import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getToothImage } from './dental/toothImages';

export type ToothStatus = 
  | 'healthy'
  | 'cavity'
  | 'filled'
  | 'crown'
  | 'missing'
  | 'implant'
  | 'root_canal'
  | 'extraction_needed';

export interface ToothData {
  tooth_number: number;
  status: ToothStatus;
  notes?: string;
}

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

interface MiniDentalChartProps {
  treatedTeeth: number[];
  teethData?: ToothData[];
  className?: string;
  useImages?: boolean;
}

export function MiniDentalChart({ treatedTeeth, teethData = [], className, useImages = true }: MiniDentalChartProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);

  const getToothData = (toothNumber: number): ToothData | undefined => {
    return teethData.find((t) => t.tooth_number === toothNumber);
  };

  const renderTooth = (toothNumber: number, isDeciduous: boolean = false, isLower: boolean = false) => {
    const isTreated = treatedTeeth.includes(toothNumber);
    const toothData = getToothData(toothNumber);
    const isHovered = hoveredTooth === toothNumber && isTreated;
    const toothImage = useImages ? getToothImage(toothNumber) : undefined;
    const status = toothData?.status || 'healthy';

    // If we have tooth data, use the status color (for non-image mode)
    const colorClass = isTreated && toothData 
      ? statusColors[toothData.status]
      : isTreated 
        ? 'bg-primary/20 border-primary text-primary'
        : 'bg-muted/30 border-border text-muted-foreground/50';

    if (useImages && toothImage) {
      return (
        <div key={toothNumber} className="relative">
          <div
            onMouseEnter={() => isTreated && setHoveredTooth(toothNumber)}
            onMouseLeave={() => setHoveredTooth(null)}
            className={cn(
              'relative flex items-center justify-center transition-all cursor-default rounded overflow-hidden',
              isHovered && 'ring-1 ring-offset-1',
              isHovered && statusBorderColors[status],
              isTreated && status !== 'healthy' && 'ring-1',
              isTreated && status !== 'healthy' && statusBorderColors[status],
              isTreated && !toothData && 'ring-1 ring-primary',
              isDeciduous ? 'w-5 h-6' : 'w-5 h-7'
            )}
          >
            <img 
              src={toothImage} 
              alt={`${toothNumber}`}
              className={cn(
                "w-full h-full object-contain",
                !isTreated && 'opacity-30 grayscale',
                status === 'missing' && 'opacity-20 grayscale',
                isLower && 'rotate-180'
              )}
            />
            
            {/* Status overlay for treated teeth */}
            {isTreated && status !== 'healthy' && status !== 'missing' && (
              <div className={cn(
                "absolute inset-0 pointer-events-none",
                statusOverlayColors[status]
              )} />
            )}
            
            {/* Treatment indicator */}
            {isTreated && status === 'healthy' && (
              <div className="absolute inset-0 bg-primary/30 pointer-events-none" />
            )}
          </div>

          {/* Tooltip */}
          {isHovered && toothData && (
            <div className={cn(
              "absolute z-50 px-2 py-1 rounded bg-popover border shadow-lg text-[10px] whitespace-nowrap",
              isLower ? 'top-full mt-1' : 'bottom-full mb-1',
              "left-1/2 -translate-x-1/2"
            )}>
              <div className="font-medium">{statusLabels[toothData.status]}</div>
              {toothData.notes && (
                <div className="text-muted-foreground max-w-[120px] truncate">{toothData.notes}</div>
              )}
            </div>
          )}
        </div>
      );
    }

    // Fallback to text-based rendering
    return (
      <div key={toothNumber} className="relative">
        <div
          onMouseEnter={() => isTreated && setHoveredTooth(toothNumber)}
          onMouseLeave={() => setHoveredTooth(null)}
          className={cn(
            'flex items-center justify-center font-medium transition-all cursor-default',
            colorClass,
            isHovered && 'ring-1 ring-primary ring-offset-1',
            isDeciduous 
              ? 'w-5 h-5 rounded-full border text-[8px] border-dashed' 
              : 'w-5 h-6 rounded border text-[9px]'
          )}
        >
          {toothNumber}
        </div>

        {/* Tooltip */}
        {isHovered && toothData && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-popover border shadow-lg text-[10px] whitespace-nowrap">
            <div className="font-medium">{statusLabels[toothData.status]}</div>
            {toothData.notes && (
              <div className="text-muted-foreground max-w-[120px] truncate">{toothData.notes}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn('space-y-1', className)}>
      {/* Legend - only show statuses that are used */}
      {teethData.length > 0 && (
        <div className="flex flex-wrap gap-1 text-[8px] mb-1">
          {Array.from(new Set(teethData.filter(t => treatedTeeth.includes(t.tooth_number)).map(t => t.status))).map((status) => (
            <div
              key={status}
              className={cn(
                'px-1.5 py-0.5 rounded border flex items-center gap-1',
                statusColors[status]
              )}
            >
              <span>{statusLabels[status]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Upper jaw - permanent teeth */}
      <div className="space-y-0.5">
        <div className="flex justify-center gap-0.5">
          {upperTeeth.map((tooth) => renderTooth(tooth, false, false))}
        </div>
      </div>

      {/* Upper jaw - deciduous teeth */}
      <div className="space-y-0.5">
        <div className="flex justify-center gap-0.5">
          {upperDeciduousTeeth.map((tooth) => renderTooth(tooth, true, false))}
        </div>
      </div>

      {/* Divider */}
      <div className="flex justify-center py-0.5">
        <div className="w-full max-w-xs border-b border-muted-foreground/30" />
      </div>

      {/* Lower jaw - deciduous teeth */}
      <div className="space-y-0.5">
        <div className="flex justify-center gap-0.5">
          {lowerDeciduousTeeth.map((tooth) => renderTooth(tooth, true, true))}
        </div>
      </div>

      {/* Lower jaw - permanent teeth */}
      <div className="space-y-0.5">
        <div className="flex justify-center gap-0.5">
          {lowerTeeth.map((tooth) => renderTooth(tooth, false, true))}
        </div>
      </div>
    </div>
  );
}
