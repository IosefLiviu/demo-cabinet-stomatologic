import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toothImages } from './toothImages';
import { cn } from '@/lib/utils';
import { cleanDentalNotes } from '@/lib/cleanDentalNotes';
import { QuadrantCircle } from './QuadrantCircle';

// FDI notation - permanent teeth
const upperPermanentTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerPermanentTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// FDI notation - deciduous (baby) teeth
const upperDeciduousTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerDeciduousTeeth = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

// Quadrant-based teeth groupings
const quadrant1 = [18, 17, 16, 15, 14, 13, 12, 11]; // Upper right
const quadrant2 = [21, 22, 23, 24, 25, 26, 27, 28]; // Upper left
const quadrant3 = [31, 32, 33, 34, 35, 36, 37, 38]; // Lower left
const quadrant4 = [48, 47, 46, 45, 44, 43, 42, 41]; // Lower right
const upperArch = [...quadrant1, ...quadrant2];
const lowerArch = [...quadrant4, ...quadrant3];

// Status display names in Romanian
const statusDisplayNames: Record<string, string> = {
  healthy: 'Sănătos',
  cavity: 'Carie',
  filled: 'Obturat',
  crown: 'Coroană',
  missing: 'Absent',
  implant: 'Implant',
  root_canal: 'Canal radicular',
  extraction_needed: 'Extracție necesară',
};

// Status colors for visual indicator
const statusColors: Record<string, string> = {
  healthy: 'bg-green-500',
  cavity: 'bg-red-500',
  filled: 'bg-blue-500',
  crown: 'bg-yellow-500',
  missing: 'bg-gray-400',
  implant: 'bg-purple-500',
  root_canal: 'bg-orange-500',
  extraction_needed: 'bg-red-700',
};

interface ToothSelectorProps {
  selectedTeeth: number[];
  onToggleTooth: (tooth: number) => void;
  onArchSelection: (teeth: number[]) => void;
  onReset: () => void;
  selectionMode: 'teeth' | 'arch';
  onModeChange: (mode: 'teeth' | 'arch') => void;
  isArchMode?: boolean;
  dentalStatus?: Record<number, { status: string; notes?: string }>;
}

// Helper to count arch groups
const countArchGroups = (toothNumbers: number[]): number => {
  let count = 0;
  if (quadrant1.every(t => toothNumbers.includes(t))) count++;
  if (quadrant2.every(t => toothNumbers.includes(t))) count++;
  if (quadrant3.every(t => toothNumbers.includes(t))) count++;
  if (quadrant4.every(t => toothNumbers.includes(t))) count++;
  return Math.max(1, count);
};

// Notes are cleaned centrally to prevent technical arrays from leaking into UI.

export function ToothSelector({
  selectedTeeth,
  onToggleTooth,
  onArchSelection,
  onReset,
  selectionMode,
  onModeChange,
  isArchMode,
  dentalStatus = {},
}: ToothSelectorProps) {
  const renderToothButton = (tooth: number, isDeciduous: boolean = false) => {
    const isSelected = selectedTeeth.includes(tooth);
    const toothImage = toothImages[tooth];
    const status = dentalStatus[tooth];
    const statusName = status?.status || 'healthy';
    const statusDisplay = statusDisplayNames[statusName] || statusName;
    const statusColor = statusColors[statusName] || 'bg-muted';
    const cleanNotes = cleanDentalNotes(status?.notes);
    const isMissing = statusName === 'missing';
    
    const toothContent = (
      <button
        key={tooth}
        type="button"
        onClick={() => onToggleTooth(tooth)}
        className={cn(
          "relative flex flex-col items-center gap-0.5 p-1 rounded-lg transition-all duration-200",
          "hover:scale-110 hover:z-10",
          isSelected 
            ? "bg-primary/20 ring-2 ring-primary shadow-lg" 
            : "hover:bg-muted/50",
          isDeciduous && "opacity-90",
          isMissing && "opacity-40 grayscale"
        )}
      >
        {/* Status indicator dot */}
        {status && statusName !== 'healthy' && (
          <div className={cn(
            "absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-background",
            statusColor
          )} />
        )}
        {toothImage ? (
          <img 
            src={toothImage} 
            alt={`Dinte ${tooth}`}
            className={cn(
              "h-8 w-auto object-contain transition-all",
              isSelected && "drop-shadow-[0_0_4px_hsl(var(--primary))]"
            )}
          />
        ) : (
          <div className={cn(
            "h-8 w-6 flex items-center justify-center text-xs font-medium rounded",
            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
          )}>
            {tooth}
          </div>
        )}
        <span className={cn(
          "text-[9px] font-medium",
          isSelected ? "text-primary" : "text-muted-foreground"
        )}>
          {tooth}
        </span>
      </button>
    );
    
    // Wrap with tooltip if there's status info
    if (status) {
      return (
        <Tooltip key={tooth}>
          <TooltipTrigger asChild>
            {toothContent}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", statusColor)} />
              <span className="font-medium text-xs">{statusDisplay}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      );
    }
    
    return toothContent;
  };

  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium">Selectează dinții</p>
        <div className="flex gap-1">
          <Button
            type="button"
            variant={selectionMode === 'teeth' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onModeChange('teeth')}
          >
            Dinți
          </Button>
          <Button
            type="button"
            variant={selectionMode === 'arch' ? 'default' : 'outline'}
            size="sm"
            className="h-7 text-xs"
            onClick={() => onModeChange('arch')}
          >
            Maxilar
          </Button>
        </div>
      </div>
      
      {selectionMode === 'teeth' ? (
        <>
          {/* Individual teeth selection with images */}
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground text-center">Superior permanent</div>
            <div className="flex justify-center">
              {upperPermanentTeeth.map(tooth => renderToothButton(tooth))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground text-center">De lapte superior</div>
            <div className="flex justify-center gap-0.5">
              {upperDeciduousTeeth.map(tooth => renderToothButton(tooth, true))}
            </div>
          </div>
          <div className="flex justify-center py-1">
            <QuadrantCircle
              selectedTeeth={selectedTeeth}
              onZoneClick={(teeth) => onArchSelection(teeth)}
              size={80}
            />
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground text-center">De lapte inferior</div>
            <div className="flex justify-center gap-0.5">
              {lowerDeciduousTeeth.map(tooth => renderToothButton(tooth, true))}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[10px] text-muted-foreground text-center">Inferior permanent</div>
            <div className="flex justify-center">
              {lowerPermanentTeeth.map(tooth => renderToothButton(tooth))}
            </div>
          </div>
        </>
      ) : (
        /* Arch/Quadrant Selection Mode */
        <div className="space-y-3">
          {/* Arcade */}
          <div className="space-y-2">
            <div className="text-[10px] text-muted-foreground font-medium">Arcade</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={upperArch.every(t => selectedTeeth.includes(t)) ? "default" : 
                        upperArch.some(t => selectedTeeth.includes(t)) ? "secondary" : "outline"}
                size="sm"
                className="h-12 flex flex-col gap-0.5"
                onClick={() => onArchSelection(upperArch)}
              >
                <span className="font-bold text-xs">Maxilar Sus</span>
                <span className="text-[10px] opacity-70">{upperArch.filter(t => selectedTeeth.includes(t)).length}/16</span>
              </Button>
              <Button
                variant={lowerArch.every(t => selectedTeeth.includes(t)) ? "default" : 
                        lowerArch.some(t => selectedTeeth.includes(t)) ? "secondary" : "outline"}
                size="sm"
                className="h-12 flex flex-col gap-0.5"
                onClick={() => onArchSelection(lowerArch)}
              >
                <span className="font-bold text-xs">Mandibular Jos</span>
                <span className="text-[10px] opacity-70">{lowerArch.filter(t => selectedTeeth.includes(t)).length}/16</span>
              </Button>
            </div>
          </div>
          
          <div className="border-t my-2" />
          
          {/* Cadrane */}
          <div className="space-y-2">
            <div className="text-[10px] text-muted-foreground font-medium">Cadrane</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={quadrant1.every(t => selectedTeeth.includes(t)) ? "default" : 
                        quadrant1.some(t => selectedTeeth.includes(t)) ? "secondary" : "outline"}
                size="sm"
                className="h-12 flex flex-col gap-0.5"
                onClick={() => onArchSelection(quadrant1)}
              >
                <span className="font-bold text-xs">Cadran 1</span>
                <span className="text-[10px] opacity-70">Superior dreapta ({quadrant1.filter(t => selectedTeeth.includes(t)).length}/8)</span>
              </Button>
              <Button
                variant={quadrant2.every(t => selectedTeeth.includes(t)) ? "default" : 
                        quadrant2.some(t => selectedTeeth.includes(t)) ? "secondary" : "outline"}
                size="sm"
                className="h-12 flex flex-col gap-0.5"
                onClick={() => onArchSelection(quadrant2)}
              >
                <span className="font-bold text-xs">Cadran 2</span>
                <span className="text-[10px] opacity-70">Superior stânga ({quadrant2.filter(t => selectedTeeth.includes(t)).length}/8)</span>
              </Button>
              <Button
                variant={quadrant4.every(t => selectedTeeth.includes(t)) ? "default" : 
                        quadrant4.some(t => selectedTeeth.includes(t)) ? "secondary" : "outline"}
                size="sm"
                className="h-12 flex flex-col gap-0.5"
                onClick={() => onArchSelection(quadrant4)}
              >
                <span className="font-bold text-xs">Cadran 4</span>
                <span className="text-[10px] opacity-70">Inferior dreapta ({quadrant4.filter(t => selectedTeeth.includes(t)).length}/8)</span>
              </Button>
              <Button
                variant={quadrant3.every(t => selectedTeeth.includes(t)) ? "default" : 
                        quadrant3.some(t => selectedTeeth.includes(t)) ? "secondary" : "outline"}
                size="sm"
                className="h-12 flex flex-col gap-0.5"
                onClick={() => onArchSelection(quadrant3)}
              >
                <span className="font-bold text-xs">Cadran 3</span>
                <span className="text-[10px] opacity-70">Inferior stânga ({quadrant3.filter(t => selectedTeeth.includes(t)).length}/8)</span>
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          Selectați: <span className="font-medium text-foreground">
            {isArchMode || selectionMode === 'arch' 
              ? `${countArchGroups(selectedTeeth)} ${countArchGroups(selectedTeeth) === 1 ? 'cadran/arcadă' : 'cadrane/arcade'}`
              : `${selectedTeeth.length} dinți`}
          </span>
        </p>
        {selectedTeeth.length > 0 && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 text-xs"
            onClick={onReset}
          >
            Resetează
          </Button>
        )}
      </div>
    </div>
    </TooltipProvider>
  );
}
