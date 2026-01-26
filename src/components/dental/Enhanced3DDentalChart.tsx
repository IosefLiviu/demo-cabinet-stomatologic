import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getToothImage } from './toothImages';
import { cleanDentalNotes } from '@/lib/cleanDentalNotes';

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

interface Enhanced3DDentalChartProps {
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

const statusGlowColors: Record<ToothStatus, string> = {
  healthy: 'hover:shadow-[0_8px_25px_-5px_rgba(34,197,94,0.4)]',
  cavity: 'hover:shadow-[0_8px_25px_-5px_rgba(239,68,68,0.5)]',
  filled: 'hover:shadow-[0_8px_25px_-5px_rgba(59,130,246,0.4)]',
  crown: 'hover:shadow-[0_8px_25px_-5px_rgba(168,85,247,0.4)]',
  missing: 'hover:shadow-[0_8px_25px_-5px_rgba(156,163,175,0.3)]',
  implant: 'hover:shadow-[0_8px_25px_-5px_rgba(20,184,166,0.4)]',
  root_canal: 'hover:shadow-[0_8px_25px_-5px_rgba(245,158,11,0.4)]',
  extraction_needed: 'hover:shadow-[0_8px_25px_-5px_rgba(239,68,68,0.5)]',
};

// FDI notation - permanent teeth
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// FDI notation - deciduous (baby) teeth
const upperDeciduousTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerDeciduousTeeth = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

export function Enhanced3DDentalChart({ dentalStatus, onToothClick, readonly = false }: Enhanced3DDentalChartProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);

  const getToothStatus = (toothNumber: number): ToothStatus => {
    const tooth = dentalStatus.find((t) => t.tooth_number === toothNumber);
    return tooth?.status || 'healthy';
  };

  const getToothNotes = (toothNumber: number): string | undefined => {
    const tooth = dentalStatus.find((t) => t.tooth_number === toothNumber);
    return tooth?.notes;
  };

  const renderTooth = (toothNumber: number, isDeciduous: boolean = false, isLower: boolean = false) => {
    const status = getToothStatus(toothNumber);
    const notes = getToothNotes(toothNumber);
    const cleanNotes = cleanDentalNotes(notes);
    const isHovered = hoveredTooth === toothNumber;
    const toothImage = getToothImage(toothNumber);

    return (
      <div 
        key={toothNumber} 
        className="relative flex flex-col items-center group"
        style={{ perspective: '500px' }}
      >
        {/* Tooth number - show above for upper teeth */}
        {!isLower && (
          <span className={cn(
            "text-[10px] font-semibold mb-1 transition-all duration-300",
            status !== 'healthy' ? 'text-foreground' : 'text-muted-foreground',
            isHovered && 'text-primary scale-110'
          )}>
            {toothNumber}
          </span>
        )}
        
        <button
          type="button"
          onClick={() => onToothClick?.(toothNumber)}
          onMouseEnter={() => setHoveredTooth(toothNumber)}
          onMouseLeave={() => setHoveredTooth(null)}
          disabled={readonly && !notes}
          className={cn(
            'relative flex items-center justify-center rounded-xl overflow-hidden',
            'transition-all duration-300 ease-out',
            'bg-gradient-to-b from-white/10 to-transparent',
            'shadow-[0_4px_15px_-3px_rgba(0,0,0,0.2)]',
            statusGlowColors[status],
            !readonly && 'cursor-pointer',
            isHovered && 'ring-2 ring-offset-2',
            isHovered && statusBorderColors[status],
            status !== 'healthy' && status !== 'missing' && 'ring-2',
            status !== 'healthy' && status !== 'missing' && statusBorderColors[status],
            // Size based on tooth type - larger for better 3D effect
            isDeciduous 
              ? 'w-10 h-12 sm:w-11 sm:h-14' 
              : 'w-11 h-14 sm:w-13 sm:h-16'
          )}
          style={{
            transform: isHovered 
              ? `rotateX(${isLower ? '8deg' : '-8deg'}) rotateY(${toothNumber % 2 === 0 ? '5deg' : '-5deg'}) scale(1.15) translateZ(10px)`
              : 'rotateX(0) rotateY(0) scale(1) translateZ(0)',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
        >
          {/* 3D Depth layer - back shadow */}
          <div 
            className={cn(
              "absolute inset-0 rounded-xl transition-opacity duration-300",
              isHovered ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(0,0,0,0.1) 100%)',
              transform: 'translateZ(-5px)',
            }}
          />

          {/* Tooth image with 3D effect */}
          {toothImage ? (
            <img 
              src={toothImage} 
              alt={`Dinte ${toothNumber}`}
              className={cn(
                "w-full h-full object-contain transition-all duration-300",
                "drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)]",
                status === 'missing' && 'opacity-20 grayscale blur-[0.5px]',
                isLower && 'rotate-180',
                isHovered && 'drop-shadow-[0_4px_8px_rgba(0,0,0,0.25)]'
              )}
              style={{
                filter: isHovered && status !== 'missing' 
                  ? 'brightness(1.1) contrast(1.05)' 
                  : undefined,
              }}
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              "bg-gradient-to-b from-muted/40 to-muted/20 border-2 rounded-lg",
              isDeciduous && 'border-dashed'
            )}>
              <span className="text-xs font-medium text-muted-foreground">
                {toothNumber}
              </span>
            </div>
          )}
          
          {/* Status overlay with gradient */}
          {status !== 'healthy' && status !== 'missing' && (
            <div className={cn(
              "absolute inset-0 pointer-events-none rounded-xl",
              "transition-opacity duration-300",
              statusOverlayColors[status],
              isHovered && 'opacity-70'
            )}>
              {/* Shine effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent"
                style={{ mixBlendMode: 'overlay' }}
              />
            </div>
          )}

          {/* Highlight shine on hover */}
          {isHovered && (
            <div 
              className="absolute inset-0 pointer-events-none rounded-xl animate-pulse"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%, transparent 100%)',
              }}
            />
          )}
        </button>
        
        {/* Tooth number - show below for lower teeth */}
        {isLower && (
          <span className={cn(
            "text-[10px] font-semibold mt-1 transition-all duration-300",
            status !== 'healthy' ? 'text-foreground' : 'text-muted-foreground',
            isHovered && 'text-primary scale-110'
          )}>
            {toothNumber}
          </span>
        )}
        
        {/* Enhanced 3D Tooltip */}
        {isHovered && (
          <div 
            className={cn(
              "absolute z-50 px-3 py-2 rounded-xl",
              "bg-popover/95 backdrop-blur-sm border shadow-xl",
              "text-xs whitespace-nowrap",
              "animate-in fade-in-0 zoom-in-95 duration-200",
              isLower ? 'top-full mt-2' : 'bottom-full mb-2',
              "left-1/2 -translate-x-1/2"
            )}
            style={{
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.3)',
            }}
          >
            <div className="font-semibold text-foreground">{statusLabels[status]}</div>
            {/* Tooltip arrow */}
            <div 
              className={cn(
                "absolute left-1/2 -translate-x-1/2 w-2 h-2 rotate-45",
                "bg-popover/95 border",
                isLower ? '-top-1 border-t border-l' : '-bottom-1 border-b border-r'
              )}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced Legend with 3D effect */}
      <div className="flex flex-wrap justify-center gap-2 text-xs">
        {Object.entries(statusLabels).map(([status, label]) => (
          <div
            key={status}
            className={cn(
              'px-3 py-1.5 rounded-lg border-2 flex items-center gap-2',
              'shadow-sm transition-all duration-200 hover:scale-105',
              'cursor-default',
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
            {/* Status indicator dot with glow */}
            <div 
              className={cn(
                "w-2 h-2 rounded-full",
                status === 'healthy' && 'bg-success shadow-[0_0_6px_rgba(34,197,94,0.6)]',
                status === 'cavity' && 'bg-destructive shadow-[0_0_6px_rgba(239,68,68,0.6)]',
                status === 'filled' && 'bg-cabinet-2 shadow-[0_0_6px_rgba(59,130,246,0.6)]',
                status === 'crown' && 'bg-cabinet-4 shadow-[0_0_6px_rgba(168,85,247,0.6)]',
                status === 'missing' && 'bg-muted-foreground/50',
                status === 'implant' && 'bg-cabinet-3 shadow-[0_0_6px_rgba(20,184,166,0.6)]',
                status === 'root_canal' && 'bg-warning shadow-[0_0_6px_rgba(245,158,11,0.6)]',
                status === 'extraction_needed' && 'bg-destructive shadow-[0_0_6px_rgba(239,68,68,0.6)]'
              )}
            />
            <span className="font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* 3D Dental Chart Container */}
      <div 
        className="relative rounded-2xl p-6 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, hsl(var(--muted)/0.3) 0%, hsl(var(--muted)/0.1) 100%)',
          boxShadow: 'inset 0 2px 20px rgba(0,0,0,0.05), 0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {/* Ambient light effect */}
        <div 
          className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center top, rgba(255,255,255,0.15) 0%, transparent 70%)',
          }}
        />

        <div className="space-y-4 relative z-10">
          {/* Upper jaw - permanent teeth */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase">
              Maxilar Superior — Dinți Permanenți
            </div>
            <div className="flex justify-center gap-1">
              {upperTeeth.map((tooth) => renderTooth(tooth, false, false))}
            </div>
          </div>

          {/* Upper jaw - deciduous teeth */}
          <div className="space-y-2 mt-4">
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase opacity-70">
              Dinți Temporari — Superior
            </div>
            <div className="flex justify-center gap-1">
              {upperDeciduousTeeth.map((tooth) => renderTooth(tooth, true, false))}
            </div>
          </div>

          {/* Enhanced Divider with glow */}
          <div className="flex justify-center py-4">
            <div 
              className="w-full max-w-3xl h-px"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, hsl(var(--muted-foreground)/0.3) 20%, hsl(var(--muted-foreground)/0.5) 50%, hsl(var(--muted-foreground)/0.3) 80%, transparent 100%)',
              }}
            />
          </div>

          {/* Lower jaw - deciduous teeth */}
          <div className="space-y-2">
            <div className="flex justify-center gap-1">
              {lowerDeciduousTeeth.map((tooth) => renderTooth(tooth, true, true))}
            </div>
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase opacity-70">
              Dinți Temporari — Inferior
            </div>
          </div>

          {/* Lower jaw - permanent teeth */}
          <div className="space-y-2 mt-4">
            <div className="flex justify-center gap-1">
              {lowerTeeth.map((tooth) => renderTooth(tooth, false, true))}
            </div>
            <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase">
              Maxilar Inferior — Dinți Permanenți
            </div>
          </div>
        </div>

        {/* Bottom shadow gradient */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, hsl(var(--muted)/0.2) 0%, transparent 100%)',
          }}
        />
      </div>
    </div>
  );
}

// Re-export ToothStatusSelector for compatibility
export { ToothStatusSelector } from '../DentalChart';
