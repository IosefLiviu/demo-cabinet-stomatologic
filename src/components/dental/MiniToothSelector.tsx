import { cn } from '@/lib/utils';
import { getToothImage } from './toothImages';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// FDI notation - permanent teeth
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// FDI notation - deciduous (baby) teeth
const upperDeciduousTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerDeciduousTeeth = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

interface PatientToothStatus {
  tooth_number: number;
  status: string;
  notes?: string;
}

interface MiniToothSelectorProps {
  selectedTeeth: number[];
  onToothClick: (toothNumber: number) => void;
  onToothDoubleClick?: (toothNumber: number) => void;
  patientDentalStatus?: PatientToothStatus[];
  getStatusHexColor?: (status: string) => string | null;
  className?: string;
}

export function MiniToothSelector({
  selectedTeeth,
  onToothClick,
  onToothDoubleClick,
  patientDentalStatus = [],
  getStatusHexColor,
  className,
}: MiniToothSelectorProps) {
  const getPatientToothStatus = (toothNumber: number) => {
    return patientDentalStatus.find(t => t.tooth_number === toothNumber);
  };

  const renderTooth = (toothNumber: number, isDeciduous: boolean = false, isLower: boolean = false) => {
    const isSelected = selectedTeeth.includes(toothNumber);
    const toothImage = getToothImage(toothNumber);
    const patientStatus = getPatientToothStatus(toothNumber);
    const status = patientStatus?.status || 'Sănătos';
    const hexColor = getStatusHexColor?.(status) || null;
    const hasPatientStatus = patientStatus && status !== 'Sănătos';
    const isMissing = status === 'Absent' || status === 'missing';

    const button = (
      <button
        type="button"
        onClick={() => onToothClick(toothNumber)}
        onDoubleClick={() => onToothDoubleClick?.(toothNumber)}
        className={cn(
          'relative flex flex-col items-center transition-all rounded overflow-hidden',
          'hover:scale-110 cursor-pointer',
          isDeciduous ? 'w-5' : 'w-6',
          isSelected && 'ring-2 ring-primary ring-offset-1',
          hasPatientStatus && !isSelected && 'ring-1'
        )}
        style={
          isSelected && hexColor
            ? { boxShadow: `0 0 0 2px ${hexColor}` }
            : hasPatientStatus && hexColor
              ? { boxShadow: `0 0 0 1px ${hexColor}` }
              : undefined
        }
      >
        {/* Tooth number - show above for upper teeth */}
        {!isLower && (
          <span className={cn(
            "text-[8px] font-medium leading-none",
            isSelected ? 'text-primary' : hasPatientStatus ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {toothNumber}
          </span>
        )}

        {/* Tooth image */}
        <div className={cn(
          'relative flex items-center justify-center',
          isDeciduous ? 'w-4 h-5' : 'w-5 h-6'
        )}>
          {toothImage ? (
            <img
              src={toothImage}
              alt={`${toothNumber}`}
              className={cn(
                'w-full h-full object-contain',
                isLower && 'rotate-180',
                isMissing && 'opacity-30 grayscale',
                !isSelected && !hasPatientStatus && 'opacity-50'
              )}
            />
          ) : (
            <div className={cn(
              'w-full h-full flex items-center justify-center text-[8px] font-medium',
              isSelected ? 'bg-primary/20 text-primary' : 'bg-muted/50'
            )}>
              {toothNumber}
            </div>
          )}

          {/* Selection overlay */}
          {isSelected && (
            <div 
              className="absolute inset-0 rounded"
              style={{ backgroundColor: hexColor ? `${hexColor}40` : 'hsl(var(--primary) / 0.3)' }}
            />
          )}

          {/* Patient status overlay */}
          {!isSelected && hasPatientStatus && hexColor && !isMissing && (
            <div 
              className="absolute inset-0 rounded"
              style={{ backgroundColor: `${hexColor}25` }}
            />
          )}
        </div>

        {/* Tooth number - show below for lower teeth */}
        {isLower && (
          <span className={cn(
            "text-[8px] font-medium leading-none",
            isSelected ? 'text-primary' : hasPatientStatus ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {toothNumber}
          </span>
        )}
      </button>
    );

    if (hasPatientStatus || isSelected) {
      return (
        <Tooltip key={toothNumber}>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent side={isLower ? 'bottom' : 'top'} className="text-xs">
            <span className="font-medium">{toothNumber}</span>
            {hasPatientStatus && <span className="ml-1">- {status}</span>}
            {isSelected && <span className="ml-1 text-primary">(selectat)</span>}
          </TooltipContent>
        </Tooltip>
      );
    }

    return <span key={toothNumber}>{button}</span>;
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className={cn('space-y-0.5', className)}>
        {/* Upper permanent */}
        <div className="flex justify-center gap-px">
          {upperTeeth.map(t => renderTooth(t, false, false))}
        </div>
        
        {/* Upper deciduous */}
        <div className="flex justify-center gap-px">
          {upperDeciduousTeeth.map(t => renderTooth(t, true, false))}
        </div>

        {/* Divider */}
        <div className="flex justify-center py-0.5">
          <div className="w-full max-w-[200px] border-b border-muted-foreground/30" />
        </div>

        {/* Lower deciduous */}
        <div className="flex justify-center gap-px">
          {lowerDeciduousTeeth.map(t => renderTooth(t, true, true))}
        </div>

        {/* Lower permanent */}
        <div className="flex justify-center gap-px">
          {lowerTeeth.map(t => renderTooth(t, false, true))}
        </div>

        {/* Selected teeth summary */}
        {selectedTeeth.length > 0 && (
          <div className="text-center text-[10px] text-muted-foreground pt-1">
            <span className="font-medium text-foreground">{selectedTeeth.length}</span> dinți selectați: {selectedTeeth.sort((a, b) => a - b).join(', ')}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
