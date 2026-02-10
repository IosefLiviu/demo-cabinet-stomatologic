import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getToothImage } from './dental/toothImages';
import { TOOTH_STATUSES, getStatusHexColor as getStatusHexColorUtil } from '@/constants/toothStatuses';

export interface ToothData {
  tooth_number: number;
  status: string;
  notes?: string;
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

  // Get display name for status (handles both enum values and display names)
  const getStatusDisplayName = (status: string): string => {
    return statusEnumToName[status] || status;
  };

  // Get hex color for status from database
  const getStatusHexColor = (status: string): string | null => {
    const displayName = getStatusDisplayName(status);
    return getStatusHexColorUtil(displayName);
  };

  // Check if status is healthy (either enum or name)
  const isHealthyStatus = (status: string): boolean => {
    return status === 'healthy' || status === 'Sănătos';
  };

  // Check if status is missing (either enum or name)
  const isMissingStatus = (status: string): boolean => {
    return status === 'missing' || status === 'Absent';
  };

  const renderTooth = (toothNumber: number, isDeciduous: boolean = false, isLower: boolean = false) => {
    const isTreated = treatedTeeth.includes(toothNumber);
    const toothData = getToothData(toothNumber);
    const isHovered = hoveredTooth === toothNumber && isTreated;
    const toothImage = useImages ? getToothImage(toothNumber) : undefined;
    const status = toothData?.status || 'healthy';
    const hexColor = getStatusHexColor(status);
    const hasNonHealthyStatus = !isHealthyStatus(status);

    if (useImages && toothImage) {
      return (
        <div key={toothNumber} className="relative">
          <div
            onMouseEnter={() => isTreated && setHoveredTooth(toothNumber)}
            onMouseLeave={() => setHoveredTooth(null)}
            className={cn(
              'relative flex items-center justify-center transition-all cursor-default rounded overflow-hidden',
              isHovered && 'ring-1 ring-offset-1 ring-primary',
              isTreated && hasNonHealthyStatus && 'ring-1',
              isTreated && !toothData && 'ring-1 ring-primary',
              isDeciduous ? 'w-5 h-6' : 'w-5 h-7'
            )}
            style={isTreated && hasNonHealthyStatus && hexColor ? {
              boxShadow: `0 0 0 1px ${hexColor}`,
            } : undefined}
          >
            <img 
              src={toothImage} 
              alt={`${toothNumber}`}
              className={cn(
                "w-full h-full object-contain",
                !isTreated && 'opacity-30 grayscale',
                isMissingStatus(status) && 'opacity-20 grayscale',
                isLower && 'rotate-180'
              )}
            />
            
            {/* Status overlay for treated teeth */}
            {isTreated && hasNonHealthyStatus && !isMissingStatus(status) && hexColor && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{ backgroundColor: `${hexColor}40` }}
              />
            )}
            
            {/* Treatment indicator */}
            {isTreated && isHealthyStatus(status) && (
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
              <div className="font-medium">{getStatusDisplayName(toothData.status)}</div>
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
            'flex items-center justify-center font-medium transition-all cursor-default border',
            isHovered && 'ring-1 ring-primary ring-offset-1',
            isDeciduous 
              ? 'w-5 h-5 rounded-full text-[8px] border-dashed' 
              : 'w-5 h-6 rounded text-[9px]',
            !isTreated && 'bg-muted/30 border-border text-muted-foreground/50'
          )}
          style={isTreated && hexColor ? {
            backgroundColor: `${hexColor}20`,
            borderColor: hexColor,
            color: hexColor,
          } : isTreated ? {
            backgroundColor: 'hsl(var(--primary) / 0.2)',
            borderColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary))',
          } : undefined}
        >
          {toothNumber}
        </div>

        {/* Tooltip */}
        {isHovered && toothData && (
          <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded bg-popover border shadow-lg text-[10px] whitespace-nowrap">
            <div className="font-medium">{getStatusDisplayName(toothData.status)}</div>
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
          {Array.from(new Set(teethData.filter(t => treatedTeeth.includes(t.tooth_number)).map(t => t.status))).map((status) => {
            const hexColor = getStatusHexColor(status);
            return (
              <div
                key={status}
                className="px-1.5 py-0.5 rounded border flex items-center gap-1"
                style={hexColor ? {
                  backgroundColor: `${hexColor}20`,
                  borderColor: hexColor,
                  color: hexColor,
                } : undefined}
              >
                <span>{getStatusDisplayName(status)}</span>
              </div>
            );
          })}
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
