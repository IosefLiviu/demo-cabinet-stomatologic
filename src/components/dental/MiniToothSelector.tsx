import { useCallback, useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SvgTooth, getToothDimensions } from './SvgTooth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { Search, X } from 'lucide-react';
import { useDentalConditionsCatalog, DentalCondition } from '@/hooks/useToothData';
import { getToothOverlays } from './toothConditionOverlays';
import { useIsMobile } from '@/hooks/use-mobile';

// FDI notation - permanent teeth
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// FDI notation - deciduous (baby) teeth
const upperDeciduousTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerDeciduousTeeth = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

// Color mapping for condition codes by category
const CONDITION_COLORS: Record<string, string> = {
  ca: '#DC2626', ci: '#EF4444', cm: '#DC2626', cmo: '#DC2626', cmod: '#B91C1C',
  co: '#DC2626', cod: '#DC2626', cp: '#DC2626', cc: '#DC2626', cv: '#DC2626',
  crd: '#F97316', crm: '#F97316',
  csd: '#991B1B', csm: '#991B1B', cso: '#991B1B', csmo: '#991B1B', csod: '#991B1B',
  oc: '#3B82F6', oa: '#6366F1', obc: '#2563EB',
  ccr: '#F59E0B', cmc: '#D97706', cpv: '#FBBF24', cor: '#F59E0B',
  te: '#10B981', tei: '#F97316', dd: '#6B7280', dev: '#6B7280',
  aa: '#6B7280', ep: '#9CA3AF', et: '#6B7280',
  imp: '#8B5CF6', impl: '#8B5CF6',
  pv: '#14B8A6', pm: '#0D9488', pf: '#0F766E', pc: '#14B8A6', pmc: '#0D9488',
  rr: '#F97316',
  bi: '#8B0000', di: '#6366F1', incl: '#6366F1',
  urg: '#EF4444', dur: '#EF4444',
  fract: '#DC2626', mob: '#F97316',
  gg: '#EC4899', lc: '#A855F7', mm: '#D946EF',
  chist: '#BEF264',
  vc: '#60A5FA', vco: '#93C5FD',
  migr: '#F59E0B', er: '#10B981',
};

interface PatientToothStatus {
  tooth_number: number;
  status: string;
  notes?: string;
}

interface MiniToothSelectorProps {
  selectedTeeth: number[];
  onToothClick: (toothNumber: number) => void;
  onToothDoubleClick?: (toothNumber: number) => void;
  onConditionSelect?: (toothNumber: number, conditionId: string, conditionCode: string) => void;
  patientDentalStatus?: PatientToothStatus[];
  /** Map of tooth_number -> array of condition codes for overlay rendering */
  toothConditionCodes?: Record<number, string[]>;
  getStatusHexColor?: (status: string) => string | null;
  className?: string;
}

const MINI_SCALE = 0.38;
const MINI_SCALE_SM = 0.55;

export function MiniToothSelector({
  selectedTeeth,
  onToothClick,
  onToothDoubleClick,
  onConditionSelect,
  patientDentalStatus = [],
  toothConditionCodes = {},
  getStatusHexColor,
  className,
}: MiniToothSelectorProps) {
  const [popoverTooth, setPopoverTooth] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [teethView, setTeethView] = useState<'all' | 'permanent' | 'deciduous'>('permanent');
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { conditions } = useDentalConditionsCatalog();
  const isMobile = useIsMobile();
  const scale = isMobile ? MINI_SCALE : MINI_SCALE_SM;

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

  const handleConditionSelect = useCallback((condition: DentalCondition) => {
    if (popoverTooth !== null && onConditionSelect) {
      onConditionSelect(popoverTooth, condition.id, condition.code);
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

  const filteredConditions = conditions.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.code.toLowerCase().includes(searchQuery.toLowerCase())
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
    const isPopoverOpen = popoverTooth === toothNumber;

    // Get condition overlays for this tooth
    const codes = toothConditionCodes[toothNumber] || [];
    const { overlays: toothOverlays, isAbsent: conditionAbsent } = getToothOverlays(codes, toothNumber);
    const isMissing = status === 'Absent' || status === 'missing' || conditionAbsent;
    const hasConditions = codes.length > 0;

    const dims = getToothDimensions(toothNumber, isDeciduous);
    const w = Math.round(dims.width * scale);
    const h = Math.round(dims.height * scale);

    const button = (
      <button
        type="button"
        onClick={() => handleClick(toothNumber)}
        onDoubleClick={() => handleDoubleClick(toothNumber)}
        className={cn(
          'relative flex flex-col items-center transition-all rounded',
          'hover:scale-110 cursor-pointer',
          isSelected && 'ring-2 ring-primary ring-offset-1',
          isPopoverOpen && 'ring-2 ring-primary ring-offset-1 scale-110',
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
          overlays={toothOverlays.length > 0 ? toothOverlays : undefined}
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
        {hasPatientStatus || isSelected || hasConditions ? (
          <Tooltip>
            <TooltipTrigger asChild>{button}</TooltipTrigger>
            <TooltipContent side={isLower ? 'bottom' : 'top'} className="text-xs">
              <span className="font-medium">{toothNumber}</span>
              {hasPatientStatus && <span className="ml-1">- {status}</span>}
              {hasConditions && <span className="ml-1 text-muted-foreground">({codes.length} afecțiuni)</span>}
              {isSelected && <span className="ml-1 text-primary">(selectat)</span>}
            </TooltipContent>
          </Tooltip>
        ) : button}

        {/* Condition popover */}
        {isPopoverOpen && (
          <div
            ref={popoverRef}
            className={cn(
              "absolute z-[100] w-52 rounded-md border bg-popover shadow-lg",
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
            <div className="max-h-48 overflow-y-auto p-1">
              {filteredConditions.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-2">Nicio afecțiune</div>
              ) : (
                filteredConditions.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleConditionSelect(c)}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-sm text-xs hover:bg-accent hover:text-accent-foreground transition-colors text-left"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: CONDITION_COLORS[c.code] || '#6B7280' }}
                    />
                    <span className="truncate">{c.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{c.code}</span>
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
        {/* Toggle buttons */}
        <div className="flex justify-end gap-1 mb-1">
          <Button
            type="button"
            variant={teethView === 'deciduous' ? 'default' : 'outline'}
            size="sm"
            className="h-5 text-[9px] px-1.5"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTeethView(teethView === 'deciduous' ? 'all' : 'deciduous'); }}
          >
            Temporari
          </Button>
          <Button
            type="button"
            variant={teethView === 'permanent' ? 'default' : 'outline'}
            size="sm"
            className="h-5 text-[9px] px-1.5"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTeethView(teethView === 'permanent' ? 'all' : 'permanent'); }}
          >
            Permanenți
          </Button>
        </div>

        {(teethView === 'all' || teethView === 'permanent') && (
          <div className="flex justify-center gap-px">
            {upperTeeth.map(t => renderTooth(t, false, false))}
          </div>
        )}
        {(teethView === 'all' || teethView === 'deciduous') && (
          <div className="flex justify-center gap-px">
            {upperDeciduousTeeth.map(t => renderTooth(t, true, false))}
          </div>
        )}
        <div className="flex justify-center py-0.5">
          <div className="h-px w-full bg-border" />
        </div>
        {(teethView === 'all' || teethView === 'deciduous') && (
          <div className="flex justify-center gap-px">
            {lowerDeciduousTeeth.map(t => renderTooth(t, true, true))}
          </div>
        )}
        {(teethView === 'all' || teethView === 'permanent') && (
          <div className="flex justify-center gap-px">
            {lowerTeeth.map(t => renderTooth(t, false, true))}
          </div>
        )}
        {selectedTeeth.length > 0 && (
          <div className="text-center text-[10px] text-muted-foreground pt-1">
            <span className="font-medium text-foreground">{selectedTeeth.length}</span> dinți selectați: {selectedTeeth.sort((a, b) => a - b).join(', ')}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
