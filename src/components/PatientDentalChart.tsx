import { useState } from 'react';
import { cn } from '@/lib/utils';
import { TOOTH_STATUSES, STATUS_ENUM_TO_NAME, getStatusHexColor as getStatusHexColorUtil } from '@/constants/toothStatuses';
import { getToothImage } from './dental/toothImages';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

export function PatientDentalChart({ dentalStatus }: PatientDentalChartProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);

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

  const renderTooth = (toothNumber: number, isDeciduous: boolean = false, isLower: boolean = false) => {
    const status = getToothStatus(toothNumber);
    const notes = getToothNotes(toothNumber);
    const isHovered = hoveredTooth === toothNumber;
    const toothImage = getToothImage(toothNumber);
    const hexColor = getStatusHexColor(status);
    const hasStatus = status !== 'Sănătos' && status !== 'healthy';

    return (
      <div key={toothNumber} className="relative flex flex-col items-center">
        {!isLower && (
          <span className={cn(
            "text-[10px] font-medium mb-0.5",
            hasStatus ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {toothNumber}
          </span>
        )}
        
        <div
          onMouseEnter={() => setHoveredTooth(toothNumber)}
          onMouseLeave={() => setHoveredTooth(null)}
          onDoubleClick={() => setSelectedTooth(toothNumber)}
          className={cn(
            'relative flex items-center justify-center transition-all rounded-md overflow-hidden cursor-pointer',
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
          
          {hasStatus && hexColor && (
            <div 
              className="absolute inset-0 rounded-md"
              style={{ backgroundColor: `${hexColor}40` }}
            />
          )}
        </div>
        
        {isLower && (
          <span className={cn(
            "text-[10px] font-medium mt-0.5",
            hasStatus ? 'text-foreground' : 'text-muted-foreground'
          )}>
            {toothNumber}
          </span>
        )}
        
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
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground text-center mb-2">
            Maxilar superior (dinți permanenți)
          </div>
          <div className="flex justify-center gap-0.5">
            {upperTeeth.map(tooth => renderTooth(tooth, false, false))}
          </div>
        </div>

        <div className="space-y-1">
          <div className="text-xs text-muted-foreground text-center mb-2">
            Dinți temporari (de lapte) - superior
          </div>
          <div className="flex justify-center gap-0.5">
            {upperDeciduousTeeth.map(tooth => renderTooth(tooth, true, false))}
          </div>
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-2xl border-b-2 border-muted-foreground/30 my-2" />
        </div>

        <div className="space-y-1">
          <div className="flex justify-center gap-0.5">
            {lowerDeciduousTeeth.map(tooth => renderTooth(tooth, true, true))}
          </div>
          <div className="text-xs text-muted-foreground text-center mt-2">
            Dinți temporari (de lapte) - inferior
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex justify-center gap-0.5">
            {lowerTeeth.map(tooth => renderTooth(tooth, false, true))}
          </div>
          <div className="text-xs text-muted-foreground text-center mt-2">
            Maxilar inferior (dinți permanenți)
          </div>
        </div>
      </div>

      {/* Tooth notes dialog */}
      <Dialog open={selectedTooth !== null} onOpenChange={(open) => !open && setSelectedTooth(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dinte {selectedTooth} — Observații</DialogTitle>
          </DialogHeader>
          {selectedTooth && (() => {
            const status = getToothStatus(selectedTooth);
            const notes = getToothNotes(selectedTooth);
            const hexColor = getStatusHexColor(status);
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <span 
                    className="px-2 py-0.5 rounded text-sm font-medium"
                    style={hexColor ? { backgroundColor: `${hexColor}20`, color: hexColor } : undefined}
                  >
                    {status}
                  </span>
                </div>
                <div>
                  <span className="text-sm font-medium">Observații:</span>
                  <p className="text-sm text-muted-foreground mt-1">
                    {notes || 'Nicio observație'}
                  </p>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
