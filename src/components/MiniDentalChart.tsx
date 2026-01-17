import { useState } from 'react';
import { cn } from '@/lib/utils';

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

interface MiniDentalChartProps {
  treatedTeeth: number[];
  teethData?: ToothData[];
  className?: string;
}

export function MiniDentalChart({ treatedTeeth, teethData = [], className }: MiniDentalChartProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);

  const getToothData = (toothNumber: number): ToothData | undefined => {
    return teethData.find((t) => t.tooth_number === toothNumber);
  };

  const renderTooth = (toothNumber: number) => {
    const isTreated = treatedTeeth.includes(toothNumber);
    const toothData = getToothData(toothNumber);
    const isHovered = hoveredTooth === toothNumber && isTreated;

    // If we have tooth data, use the status color
    const colorClass = isTreated && toothData 
      ? statusColors[toothData.status]
      : isTreated 
        ? 'bg-primary/20 border-primary text-primary'
        : 'bg-muted/30 border-border text-muted-foreground/50';

    return (
      <div key={toothNumber} className="relative">
        <div
          onMouseEnter={() => isTreated && setHoveredTooth(toothNumber)}
          onMouseLeave={() => setHoveredTooth(null)}
          className={cn(
            'w-5 h-6 rounded border flex items-center justify-center text-[9px] font-medium transition-all cursor-default',
            colorClass,
            isHovered && 'ring-1 ring-primary ring-offset-1'
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
    <div className={cn('space-y-2', className)}>
      {/* Legend - only show statuses that are used */}
      {teethData.length > 0 && (
        <div className="flex flex-wrap gap-1 text-[8px] mb-2">
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

      {/* Upper jaw */}
      <div className="space-y-0.5">
        <div className="text-[8px] text-muted-foreground text-center">Maxilar superior</div>
        <div className="flex justify-center gap-0.5">
          {upperTeeth.map(renderTooth)}
        </div>
      </div>

      {/* Divider */}
      <div className="flex justify-center">
        <div className="w-full max-w-xs border-b border-muted-foreground/30" />
      </div>

      {/* Lower jaw */}
      <div className="space-y-0.5">
        <div className="flex justify-center gap-0.5">
          {lowerTeeth.map(renderTooth)}
        </div>
        <div className="text-[8px] text-muted-foreground text-center">Maxilar inferior</div>
      </div>
    </div>
  );
}
