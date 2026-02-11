import { cn } from '@/lib/utils';
import { SvgTooth, getToothDimensions } from './SvgTooth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { QuadrantCircle } from './QuadrantCircle';

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

const MINI_SCALE = 0.4;

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
    const patientStatus = getPatientToothStatus(toothNumber);
    const status = patientStatus?.status || 'Sănătos';
    const hexColor = getStatusHexColor?.(status) || null;
    const hasPatientStatus = patientStatus && status !== 'Sănătos';
    const isMissing = status === 'Absent' || status === 'missing';

    const dims = getToothDimensions(toothNumber, isDeciduous);
    const w = Math.round(dims.width * MINI_SCALE);
    const h = Math.round(dims.height * MINI_SCALE);

    const button = (
      <button
        type="button"
        onClick={() => onToothClick(toothNumber)}
        onDoubleClick={() => onToothDoubleClick?.(toothNumber)}
        className={cn(
          'relative flex flex-col items-center transition-all rounded',
          'hover:scale-110 cursor-pointer',
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
        {!isLower && (
          <span className={cn(
            "text-[7px] font-medium leading-none",
            isSelected ? 'text-primary' : hasPatientStatus ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {toothNumber}
          </span>
        )}

        <SvgTooth
          toothNumber={toothNumber}
          isLower={isLower}
          isMissing={isMissing}
          statusColor={hasPatientStatus ? hexColor : null}
          isHovered={false}
          width={w}
          height={h}
        />

        {isLower && (
          <span className={cn(
            "text-[7px] font-medium leading-none",
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
        <div className="flex justify-center gap-px">
          {upperTeeth.map(t => renderTooth(t, false, false))}
        </div>
        <div className="flex justify-center gap-px">
          {upperDeciduousTeeth.map(t => renderTooth(t, true, false))}
        </div>
        <div className="flex justify-center py-0.5">
          <QuadrantCircle
            selectedTeeth={selectedTeeth}
            onZoneClick={(teeth) => teeth.forEach(t => {
              if (!selectedTeeth.includes(t)) onToothClick(t);
            })}
            size={70}
          />
        </div>
        <div className="flex justify-center gap-px">
          {lowerDeciduousTeeth.map(t => renderTooth(t, true, true))}
        </div>
        <div className="flex justify-center gap-px">
          {lowerTeeth.map(t => renderTooth(t, false, true))}
        </div>
        {selectedTeeth.length > 0 && (
          <div className="text-center text-[10px] text-muted-foreground pt-1">
            <span className="font-medium text-foreground">{selectedTeeth.length}</span> dinți selectați: {selectedTeeth.sort((a, b) => a - b).join(', ')}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
