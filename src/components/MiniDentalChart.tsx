import { cn } from '@/lib/utils';

// FDI notation - permanent teeth
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

interface MiniDentalChartProps {
  treatedTeeth: number[];
  className?: string;
}

export function MiniDentalChart({ treatedTeeth, className }: MiniDentalChartProps) {
  const renderTooth = (toothNumber: number) => {
    const isTreated = treatedTeeth.includes(toothNumber);

    return (
      <div
        key={toothNumber}
        className={cn(
          'w-5 h-6 rounded border flex items-center justify-center text-[9px] font-medium transition-all',
          isTreated
            ? 'bg-primary/20 border-primary text-primary'
            : 'bg-muted/30 border-border text-muted-foreground/50'
        )}
      >
        {toothNumber}
      </div>
    );
  };

  return (
    <div className={cn('space-y-2', className)}>
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
