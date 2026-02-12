import { useCallback, useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { SvgTooth, getToothDimensions } from './SvgTooth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { QuadrantCircle } from './QuadrantCircle';
import { TOOTH_STATUSES } from '@/constants/toothStatuses';
import { Search, X } from 'lucide-react';

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
  onConditionSelect?: (toothNumber: number, conditionDbValue: string) => void;
  patientDentalStatus?: PatientToothStatus[];
  getStatusHexColor?: (status: string) => string | null;
  className?: string;
}

const MINI_SCALE = 0.4;

export function MiniToothSelector({
  selectedTeeth,
  onToothClick,
  onToothDoubleClick,
  onConditionSelect,
  patientDentalStatus = [],
  getStatusHexColor,
  className,
}: MiniToothSelectorProps) {
  const [popoverTooth, setPopoverTooth] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleClick = useCallback((toothNumber: number) => {
    if (onConditionSelect) {
      setPopoverTooth(prev => prev === toothNumber ? null : toothNumber);
      setSearchQuery('');
    } else {
      onToothClick(toothNumber);
    }
  }, [onToothClick, onConditionSelect]);

  const handleDoubleClick = useCallback((toothNumber: number) => {
    onToothDoubleClick?.(toothNumber);
  }, [onToothDoubleClick]);

  const handleConditionSelect = useCallback((conditionDbValue: string) => {
    if (popoverTooth !== null && onConditionSelect) {
      onConditionSelect(popoverTooth, conditionDbValue);
      // Also toggle tooth selection
      onToothClick(popoverTooth);
      setPopoverTooth(null);
      setSearchQuery('');
    }
  }, [popoverTooth, onConditionSelect, onToothClick]);

  // Close popover on outside click
  useEffect(() => {
    if (popoverTooth === null) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setPopoverTooth(null);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [popoverTooth]);

  // Focus search input when popover opens
  useEffect(() => {
    if (popoverTooth !== null) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [popoverTooth]);

  const filteredStatuses = TOOTH_STATUSES.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    const isPopoverOpen = popoverTooth === toothNumber;

    const dims = getToothDimensions(toothNumber, isDeciduous);
    const w = Math.round(dims.width * MINI_SCALE);
    const h = Math.round(dims.height * MINI_SCALE);

    const button = (
      <button
        type="button"
        onClick={() => handleClick(toothNumber)}
        onDoubleClick={() => handleDoubleClick(toothNumber)}
        className={cn(
          'relative flex flex-col items-center transition-all rounded',
          'hover:scale-110 cursor-pointer',
          isSelected && 'ring-2 ring-primary ring-offset-1',
          isPopoverOpen && 'ring-2 ring-blue-500 ring-offset-1 scale-110',
          hasPatientStatus && !isSelected && !isPopoverOpen && 'ring-1'
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

    const wrappedButton = (
      <span key={toothNumber} className="relative">
        {hasPatientStatus || isSelected ? (
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side={isLower ? 'bottom' : 'top'} className="text-xs">
              <span className="font-medium">{toothNumber}</span>
              {hasPatientStatus && <span className="ml-1">- {status}</span>}
              {isSelected && <span className="ml-1 text-primary">(selectat)</span>}
            </TooltipContent>
          </Tooltip>
        ) : button}

        {/* Condition popover */}
        {isPopoverOpen && (
          <div
            ref={popoverRef}
            className={cn(
              "absolute z-[100] w-44 rounded-md border bg-popover shadow-lg",
              isLower ? 'bottom-full mb-1' : 'top-full mt-1',
              "left-1/2 -translate-x-1/2"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center border-b px-2 py-1.5 gap-1.5">
              <Search className="h-3 w-3 text-muted-foreground shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Caută afecțiune..."
                className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div className="max-h-36 overflow-y-auto p-1">
              {filteredStatuses.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-2">Nicio afecțiune</div>
              ) : (
                filteredStatuses.map(s => (
                  <button
                    key={s.dbValue}
                    type="button"
                    onClick={() => handleConditionSelect(s.dbValue)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-xs hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-background"
                      style={{ backgroundColor: s.color }}
                    />
                    <span>{s.name}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </span>
    );

    return wrappedButton;
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
            onZoneClick={(teeth) => {
              const allSelected = teeth.every(t => selectedTeeth.includes(t));
              teeth.forEach(t => {
                if (allSelected) {
                  if (selectedTeeth.includes(t)) onToothClick(t);
                } else {
                  if (!selectedTeeth.includes(t)) onToothClick(t);
                }
              });
            }}
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
