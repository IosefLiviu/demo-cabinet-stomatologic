import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { SvgTooth, getToothDimensions } from './SvgTooth';
import { cn } from '@/lib/utils';
import { cleanDentalNotes } from '@/lib/cleanDentalNotes';

import { getToothOverlays } from './toothConditionOverlays';

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
  selectionMode?: 'teeth' | 'arch';
  onModeChange?: (mode: 'teeth' | 'arch') => void;
  isArchMode?: boolean;
  dentalStatus?: Record<number, { status: string; notes?: string }>;
  conditionCodes?: Record<number, string[]>;
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
  conditionCodes = {},
}: ToothSelectorProps) {
  const [teethView, setTeethView] = useState<'all' | 'permanent' | 'deciduous'>('permanent');

  const renderToothButton = (tooth: number, isDeciduous: boolean = false) => {
    const isSelected = selectedTeeth.includes(tooth);
    const status = dentalStatus[tooth];
    const statusName = status?.status || 'healthy';
    const statusDisplay = statusDisplayNames[statusName] || statusName;
    const statusColor = statusColors[statusName] || 'bg-muted';
    const cleanNotes = cleanDentalNotes(status?.notes);
    const codes = conditionCodes[tooth] || [];
    const { overlays: toothOverlays, isAbsent: conditionAbsent } = getToothOverlays(codes, tooth);
    const isMissing = statusName === 'missing' || conditionAbsent;
    const isLower = Math.floor(tooth / 10) === 3 || Math.floor(tooth / 10) === 4 || Math.floor(tooth / 10) === 7 || Math.floor(tooth / 10) === 8;
    const dims = getToothDimensions(tooth, isDeciduous);
    const scale = isDeciduous ? 0.65 : 0.7;
    
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
        <SvgTooth
          toothNumber={tooth}
          isLower={isLower}
          isMissing={isMissing}
          isHovered={isSelected}
          width={Math.round(dims.width * scale)}
          height={Math.round(dims.height * scale)}
          overlays={toothOverlays.length > 0 ? toothOverlays : undefined}
        />
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
            variant={teethView === 'deciduous' ? 'default' : 'outline'}
            size="sm"
            className="h-5 text-[9px] px-1.5"
            onClick={() => setTeethView(teethView === 'deciduous' ? 'all' : 'deciduous')}
          >
            Temporari
          </Button>
          <Button
            variant={teethView === 'permanent' ? 'default' : 'outline'}
            size="sm"
            className="h-5 text-[9px] px-1.5"
            onClick={() => setTeethView(teethView === 'permanent' ? 'all' : 'permanent')}
          >
            Permanenți
          </Button>
        </div>
      </div>
      
      {(teethView === 'all' || teethView === 'permanent') && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground text-center">Superior permanent</div>
          <div className="flex justify-center">
            {upperPermanentTeeth.map(tooth => renderToothButton(tooth))}
          </div>
        </div>
      )}
      {(teethView === 'all' || teethView === 'deciduous') && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground text-center">De lapte superior</div>
          <div className="flex justify-center gap-0.5">
            {upperDeciduousTeeth.map(tooth => renderToothButton(tooth, true))}
          </div>
        </div>
      )}
      <div className="flex justify-center items-center gap-2 py-1">
        <div className="h-px flex-1 bg-border" />
        <div className="h-px flex-1 bg-border" />
      </div>
      {(teethView === 'all' || teethView === 'deciduous') && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground text-center">De lapte inferior</div>
          <div className="flex justify-center gap-0.5">
            {lowerDeciduousTeeth.map(tooth => renderToothButton(tooth, true))}
          </div>
        </div>
      )}
      {(teethView === 'all' || teethView === 'permanent') && (
        <div className="space-y-1">
          <div className="text-[10px] text-muted-foreground text-center">Inferior permanent</div>
          <div className="flex justify-center">
            {lowerPermanentTeeth.map(tooth => renderToothButton(tooth))}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between pt-2 border-t">
        <p className="text-xs text-muted-foreground">
          Selectați: <span className="font-medium text-foreground">
            {`${selectedTeeth.length} dinți`}
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
