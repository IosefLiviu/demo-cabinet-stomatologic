import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { TOOTH_STATUSES, getStatusHexColor as getStatusHexColorUtil } from '@/constants/toothStatuses';
import { SvgTooth, getToothDimensions } from './dental/SvgTooth';
import { ToothDetailPanel } from './dental/ToothDetailPanel';
import { PatientDentalInfo } from './dental/PatientDentalInfo';
import { useDentalConditionsCatalog, useToothConditions, useToothInterventions } from '@/hooks/useToothData';
import { useDoctors } from '@/hooks/useDoctors';
import { useTreatments } from '@/hooks/useTreatments';
import { Checkbox } from '@/components/ui/checkbox';

export interface ToothData {
  tooth_number: number;
  status: string;
  notes?: string;
}

interface PatientDentalStatusTabProps {
  patientId: string;
  dentalStatus: ToothData[];
  onStatusChange?: (newStatus: ToothData[]) => void;
}

// FDI notation
const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const upperDeciduousTeeth = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
const lowerDeciduousTeeth = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

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

interface ToothJournalEntry {
  id: string;
  date: string;
  treatment_name: string;
  doctor_name: string | null;
  cabinet_name: string | null;
  type: 'treatment' | 'intervention' | 'condition';
}

function ToothJournalSection({ patientId, toothNumber, refreshKey }: { patientId: string; toothNumber: number; refreshKey?: number }) {
  const [entries, setEntries] = useState<ToothJournalEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        // Load from appointment_treatments (completed appointments)
        const { data: aptData } = await supabase
          .from('appointment_treatments')
          .select(`
            id,
            treatment_name,
            tooth_numbers,
            created_at,
            appointment:appointments!inner(
              appointment_date,
              status,
              doctor:doctors(name)
            )
          `)
          .eq('appointment.patient_id', patientId)
          .contains('tooth_numbers', [toothNumber])
          .in('appointment.status', ['completed', 'finalizat'])
          .order('created_at', { ascending: false });

        // Load from tooth_interventions (manually added)
        const { data: intData } = await supabase
          .from('tooth_interventions')
          .select('id, treatment_name, performed_at, notes, doctor:doctors(name)')
          .eq('patient_id', patientId)
          .eq('tooth_number', toothNumber)
          .order('performed_at', { ascending: false });

        // Load from tooth_conditions
        const { data: condData } = await supabase
          .from('tooth_conditions')
          .select('id, created_at, notes, condition:dental_conditions(name, code)')
          .eq('patient_id', patientId)
          .eq('tooth_number', toothNumber)
          .order('created_at', { ascending: false });

        const fromApt: ToothJournalEntry[] = (aptData || []).map((item: any) => ({
          id: item.id,
          date: item.appointment?.appointment_date || item.created_at,
          treatment_name: item.treatment_name,
          doctor_name: item.appointment?.doctor?.name || null,
          cabinet_name: null,
          type: 'treatment' as const,
        }));

        const fromInt: ToothJournalEntry[] = (intData || []).map((item: any) => ({
          id: item.id,
          date: item.performed_at,
          treatment_name: item.treatment_name,
          doctor_name: item.doctor?.name || null,
          cabinet_name: null,
          type: 'intervention' as const,
        }));

        const fromCond: ToothJournalEntry[] = (condData || []).map((item: any) => ({
          id: item.id,
          date: item.created_at,
          treatment_name: `Afecțiune: ${item.condition?.name || 'N/A'} (${item.condition?.code || ''})`,
          doctor_name: null,
          cabinet_name: null,
          type: 'condition' as const,
        }));

        // Merge and deduplicate by id AND by treatment_name+date (cross-table duplicates)
        const merged = [...fromApt, ...fromInt, ...fromCond];
        const unique = merged.filter((e, i, arr) => {
          // First: remove same-id duplicates
          if (arr.findIndex(x => x.id === e.id) !== i) return false;
          // Second: remove cross-table duplicates (same treatment_name on same date)
          if (e.type !== 'condition') {
            const dateKey = new Date(e.date).toDateString();
            const firstIdx = arr.findIndex(x => 
              x.type !== 'condition' && 
              x.treatment_name === e.treatment_name && 
              new Date(x.date).toDateString() === dateKey
            );
            if (firstIdx !== i) return false;
          }
          return true;
        });
        unique.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setEntries(unique);
      } catch (err) {
        console.error('Error loading tooth journal:', err);
      }
    };
    load();
  }, [patientId, toothNumber, refreshKey]);

  const journalByDate = entries.reduce((acc, entry) => {
    const dateKey = format(new Date(entry.date), 'dd.MM.yyyy');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(entry);
    return acc;
  }, {} as Record<string, ToothJournalEntry[]>);

  if (entries.length === 0) {
    return (
      <div className="mt-4 pt-3 border-t">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          Jurnal — Dinte {toothNumber}
        </h4>
        <p className="text-xs text-muted-foreground">Nicio înregistrare</p>
      </div>
    );
  }

  return (
    <div className="mt-4 pt-3 border-t">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <BookOpen className="h-3.5 w-3.5" />
        Jurnal — Dinte {toothNumber}
      </h4>
      <div className="border rounded-lg overflow-hidden">
        <div className="grid grid-cols-[90px_1fr] bg-muted/70 text-xs font-semibold px-2 py-1.5 border-b">
          <span>Dată</span>
          <span>Detalii</span>
        </div>
        <div className="divide-y max-h-[250px] overflow-auto">
          {Object.entries(journalByDate).map(([dateKey, items]) => (
            <div key={dateKey} className="grid grid-cols-[90px_1fr]">
              <div className="text-xs text-muted-foreground px-2 py-1.5 border-r">{dateKey}</div>
              <div className="divide-y">
                {items.map(entry => (
                  <div key={entry.id} className="px-2 py-1.5 text-xs">
                    {entry.doctor_name && (
                      <span className="text-muted-foreground">
                        {entry.cabinet_name && `${entry.cabinet_name}: `}{entry.doctor_name}
                      </span>
                    )}
                    {entry.type === 'condition' ? (
                      <div className="font-medium">
                        <span>Afecțiune: </span>
                        <span className="text-red-600">{entry.treatment_name.replace('Afecțiune: ', '')}</span>
                      </div>
                    ) : (
                      <div className="font-medium">{entry.treatment_name}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PatientDentalStatusTab({ patientId, dentalStatus, onStatusChange }: PatientDentalStatusTabProps) {
  const [hoveredTooth, setHoveredTooth] = useState<number | null>(null);
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number[]>([]);
  const [journalKey, setJournalKey] = useState(0);

  // Data hooks
  const { conditions: conditionsCatalog } = useDentalConditionsCatalog();
  const { conditions: toothConditions, addCondition, removeCondition } = useToothConditions(patientId);
  const { interventions: toothInterventions, addIntervention, removeIntervention } = useToothInterventions(patientId);
  const { doctors } = useDoctors();
  const { treatments } = useTreatments();

  const refreshJournal = () => setJournalKey(k => k + 1);

  const handleAddCondition = async (toothNumber: number, conditionId: string) => {
    const ok = await addCondition(toothNumber, conditionId);
    if (ok) refreshJournal();
    return ok;
  };

  const handleRemoveCondition = async (id: string) => {
    const ok = await removeCondition(id);
    if (ok) refreshJournal();
    return ok;
  };

  const handleAddIntervention = async (toothNumber: number, treatmentName: string, treatmentId?: string, doctorId?: string) => {
    const ok = await addIntervention(toothNumber, treatmentName, treatmentId, doctorId);
    if (ok) refreshJournal();
    return ok;
  };

  const handleRemoveIntervention = async (id: string) => {
    const ok = await removeIntervention(id);
    if (ok) refreshJournal();
    return ok;
  };

  const getToothStatus = (toothNumber: number): string => {
    const tooth = dentalStatus.find((t) => t.tooth_number === toothNumber);
    if (!tooth) return 'Sănătos';
    return statusEnumToName[tooth.status] || tooth.status;
  };

  const getStatusHexColor = (statusName: string): string | null => getStatusHexColorUtil(statusName);

  const toggleMissing = async (toothNumber: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const currentStatus = dentalStatus.find(t => t.tooth_number === toothNumber);
    const isMissing = currentStatus?.status === 'missing';

    try {
      if (isMissing) {
        // Remove the missing status (delete the row)
        await supabase
          .from('dental_status')
          .delete()
          .eq('patient_id', patientId)
          .eq('tooth_number', toothNumber);
      } else {
        // Upsert as missing
        await supabase
          .from('dental_status')
          .upsert({
            patient_id: patientId,
            tooth_number: toothNumber,
            status: 'missing' as any,
          }, { onConflict: 'patient_id,tooth_number' });
      }
      // Trigger refresh
      onStatusChange?.(
        isMissing
          ? dentalStatus.filter(t => t.tooth_number !== toothNumber)
          : [
              ...dentalStatus.filter(t => t.tooth_number !== toothNumber),
              { tooth_number: toothNumber, status: 'missing' },
            ]
      );
    } catch (err) {
      console.error('Error toggling missing:', err);
    }
  };

  const getToothNotes = (toothNumber: number): string | undefined => {
    const tooth = dentalStatus.find((t) => t.tooth_number === toothNumber);
    return tooth?.notes;
  };

  // Count conditions/interventions per tooth for indicators
  const conditionsCountByTooth = toothConditions.reduce((acc, c) => {
    acc[c.tooth_number] = (acc[c.tooth_number] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const interventionsCountByTooth = toothInterventions.reduce((acc, i) => {
    acc[i.tooth_number] = (acc[i.tooth_number] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const renderTooth = (toothNumber: number, isDeciduous: boolean = false, isLower: boolean = false) => {
    const status = getToothStatus(toothNumber);
    const notes = getToothNotes(toothNumber);
    const isHovered = hoveredTooth === toothNumber;
    const isSelected = selectedTooth === toothNumber;
    const isGroupSelected = selectedGroup.includes(toothNumber);
    const hexColor = getStatusHexColor(status);
    const hasStatus = status !== 'Sănătos' && status !== 'healthy';
    const isMissing = status === 'missing' || status === 'Absent';
    const hasConditions = (conditionsCountByTooth[toothNumber] || 0) > 0;
    const hasInterventions = (interventionsCountByTooth[toothNumber] || 0) > 0;
    const dims = getToothDimensions(toothNumber, isDeciduous);

    return (
      <div key={toothNumber} className="relative flex flex-col items-center group">
        {!isLower && (
          <span className={cn(
            "text-[10px] font-semibold mb-1 transition-all duration-300",
            hasStatus ? 'text-foreground' : 'text-muted-foreground',
            (isHovered || isSelected || isGroupSelected) && 'text-primary scale-110'
          )}>
            {toothNumber}
          </span>
        )}

        <div
          onMouseEnter={() => setHoveredTooth(toothNumber)}
          onMouseLeave={() => setHoveredTooth(null)}
          onClick={() => { setSelectedTooth(toothNumber); setSelectedGroup([]); }}
          className={cn(
            'relative flex items-center justify-center cursor-pointer',
            'transition-all duration-300 ease-out',
          )}
          style={{
            transform: isHovered ? 'scale(1.15) translateY(-4px)' : 'scale(1) translateY(0)',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <SvgTooth
            toothNumber={toothNumber}
            isLower={isLower}
            isMissing={isMissing}
            statusColor={hasStatus ? hexColor : null}
            isHovered={isHovered}
            width={dims.width}
            height={dims.height}
          />

          {/* Selection ring */}
          {(isSelected || isGroupSelected) && (
            <div
              className="absolute inset-[-3px] rounded-lg border-2 border-primary pointer-events-none"
              style={{ boxShadow: isSelected ? '0 0 12px hsl(var(--primary) / 0.3)' : '0 0 8px hsl(var(--primary) / 0.15)' }}
            />
          )}

          {/* Notes indicator */}
          {notes && (
            <div className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background shadow-sm" />
          )}

          {/* Conditions/interventions indicator */}
          {(hasConditions || hasInterventions) && (
            <div className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full bg-warning border-2 border-background shadow-sm" />
          )}
        </div>

        {/* Missing checkbox */}
        <div
          className="flex items-center justify-center mt-0.5"
          onClick={(e) => toggleMissing(toothNumber, e)}
          title={isMissing ? 'Marchează ca prezent' : 'Marchează ca lipsă'}
        >
          <Checkbox
            checked={isMissing}
            className="h-3 w-3 rounded-sm border-muted-foreground/50 data-[state=checked]:bg-muted-foreground data-[state=checked]:border-muted-foreground"
            tabIndex={-1}
          />
        </div>

        {isLower && (
          <span className={cn(
            "text-[10px] font-semibold mt-0.5 transition-all duration-300",
            hasStatus ? 'text-foreground' : 'text-muted-foreground',
            (isHovered || isSelected || isGroupSelected) && 'text-primary scale-110'
          )}>
            {toothNumber}
          </span>
        )}

        {isHovered && !isSelected && (
          <div className={cn(
            "absolute z-50 px-3 py-2 rounded-xl",
            "bg-popover/95 backdrop-blur-sm border shadow-xl text-xs whitespace-nowrap",
            isLower ? 'top-full mt-2' : 'bottom-full mb-2',
            "left-1/2 -translate-x-1/2"
          )}>
            <div className="font-semibold text-foreground">{status}</div>
          </div>
        )}
      </div>
    );
  };

  const selectedToothStatus = selectedTooth ? getToothStatus(selectedTooth) : '';
  const selectedToothColor = selectedTooth ? getStatusHexColor(selectedToothStatus) : null;

  return (
    <div className="space-y-4">
      {/* Main layout: chart + side panel */}
      <div className="flex gap-0 rounded-2xl overflow-hidden border">
        {/* Chart area */}
        <div
          className={cn(
            "flex-1 p-4 sm:p-6 transition-all",
            selectedTooth ? 'min-w-0' : 'w-full'
          )}
          style={{
            background: 'linear-gradient(180deg, hsl(var(--muted)/0.3) 0%, hsl(var(--muted)/0.1) 100%)',
          }}
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase">
                Maxilar Superior — Dinți Permanenți
              </div>
              <div className="flex justify-center gap-0.5 sm:gap-1">
                {upperTeeth.map(tooth => renderTooth(tooth, false, false))}
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase opacity-70">
                Dinți Temporari — Superior
              </div>
              <div className="flex justify-center gap-0.5 sm:gap-1">
                {upperDeciduousTeeth.map(tooth => renderTooth(tooth, true, false))}
              </div>
            </div>

            {/* Quadrant circle diagram */}
            <div className="flex justify-center py-3">
              <svg width="130" height="130" viewBox="0 0 130 130" className="select-none">
                <defs>
                  <linearGradient id="qc-fill" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f7f2e8" />
                    <stop offset="25%" stopColor="#f0e9d8" />
                    <stop offset="55%" stopColor="#e6ddca" />
                    <stop offset="85%" stopColor="#d8ceb8" />
                    <stop offset="100%" stopColor="#cfc4aa" />
                  </linearGradient>
                  <linearGradient id="qc-highlight" x1="0.2" y1="0" x2="0.8" y2="1">
                    <stop offset="0%" stopColor="white" stopOpacity="0.35" />
                    <stop offset="40%" stopColor="white" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="white" stopOpacity="0" />
                  </linearGradient>
                  <radialGradient id="qc-shadow" cx="0.5" cy="0.6" r="0.5">
                    <stop offset="70%" stopColor="transparent" />
                    <stop offset="100%" stopColor="#a0926e" stopOpacity="0.12" />
                  </radialGradient>
                </defs>

                {/* Drop shadow */}
                <circle cx="66.2" cy="66.5" r="56" fill="rgba(0,0,0,0.06)" />

                {/* Main circle fill */}
                <circle cx="65" cy="65" r="56" fill="url(#qc-fill)" stroke="#c4b898" strokeWidth="0.7" />
                <circle cx="65" cy="65" r="56" fill="url(#qc-shadow)" />
                <circle cx="65" cy="65" r="56" fill="url(#qc-highlight)" />

                {/* 6 clickable zones using clipPath */}
                {(() => {
                  // Circle: cx=65, cy=65, r=56 → top=9, bottom=121
                  // Horizontal bands: top strip y=9..30, quadrants y=30..65 and y=65..100, bottom strip y=100..121
                  const bandTop = 30;
                  const bandBot = 100;
                  const upperAll = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28];
                  const lowerAll = [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38];

                  // Chord x at a given y: x = cx ± sqrt(r²-(y-cy)²)
                  const cx = 65, cy = 65, r = 56;
                  const chordHalf = (y: number) => Math.sqrt(r * r - (y - cy) * (y - cy));
                  const xL_top = cx - chordHalf(bandTop);
                  const xR_top = cx + chordHalf(bandTop);
                  const xL_bot = cx - chordHalf(bandBot);
                  const xR_bot = cx + chordHalf(bandBot);

                  const q1Teeth = [18,17,16,15,14,13,12,11];
                  const q2Teeth = [21,22,23,24,25,26,27,28];
                  const q3Teeth = [31,32,33,34,35,36,37,38];
                  const q4Teeth = [48,47,46,45,44,43,42,41];

                  const setGroup = (teeth: number[]) => {
                    setSelectedTooth(null);
                    // Toggle: if same group is already selected, deselect
                    if (selectedGroup.length === teeth.length && teeth.every(t => selectedGroup.includes(t))) {
                      setSelectedGroup([]);
                    } else {
                      setSelectedGroup(teeth);
                    }
                  };

                  const isGroupMatch = (teeth: number[]) => selectedGroup.length > 0 && teeth.every(t => selectedGroup.includes(t));

                  const zones = [
                    {
                      key: 'maxilar',
                      pathFull: `M${xL_top},${bandTop} A${r},${r} 0 0,1 ${xR_top},${bandTop} Z`,
                      labelX: 65, labelY: 19, label: 'MAXILAR', fontSize: 7,
                      isActive: isGroupMatch(upperAll),
                      onClick: () => setGroup(upperAll),
                    },
                    {
                      key: 'q1',
                      pathFull: `M${xL_top},${bandTop} A${r},${r} 0 0,0 ${cx - r},${cy} L${cx},${cy} L${cx},${bandTop} Z`,
                      labelX: 38, labelY: 48, label: '1', fontSize: 18,
                      isActive: isGroupMatch(q1Teeth),
                      onClick: () => setGroup(q1Teeth),
                    },
                    {
                      key: 'q2',
                      pathFull: `M${cx},${bandTop} L${xR_top},${bandTop} A${r},${r} 0 0,1 ${cx + r},${cy} L${cx},${cy} Z`,
                      labelX: 92, labelY: 48, label: '2', fontSize: 18,
                      isActive: isGroupMatch(q2Teeth),
                      onClick: () => setGroup(q2Teeth),
                    },
                    {
                      key: 'q3',
                      pathFull: `M${cx},${cy} L${cx + r},${cy} A${r},${r} 0 0,1 ${xR_bot},${bandBot} L${cx},${bandBot} Z`,
                      labelX: 92, labelY: 84, label: '3', fontSize: 18,
                      isActive: isGroupMatch(q3Teeth),
                      onClick: () => setGroup(q3Teeth),
                    },
                    {
                      key: 'q4',
                      pathFull: `M${cx - r},${cy} L${cx},${cy} L${cx},${bandBot} L${xL_bot},${bandBot} A${r},${r} 0 0,1 ${cx - r},${cy} Z`,
                      labelX: 38, labelY: 84, label: '4', fontSize: 18,
                      isActive: isGroupMatch(q4Teeth),
                      onClick: () => setGroup(q4Teeth),
                    },
                    {
                      key: 'mandibular',
                      pathFull: `M${xL_bot},${bandBot} L${xR_bot},${bandBot} A${r},${r} 0 0,1 ${xL_bot},${bandBot} Z`,
                      labelX: 65, labelY: 112, label: 'MANDIBULAR', fontSize: 7,
                      isActive: isGroupMatch(lowerAll),
                      onClick: () => setGroup(lowerAll),
                    },
                  ];

                  return zones.map(z => (
                    <g key={z.key} className="cursor-pointer" onClick={z.onClick}>
                      <path
                        d={z.pathFull}
                        fill={z.isActive ? 'hsl(var(--primary) / 0.15)' : 'transparent'}
                        className="transition-colors duration-200 hover:fill-[hsl(var(--primary)/0.1)]"
                      />
                      <text
                        x={z.labelX} y={z.labelY}
                        textAnchor="middle" dominantBaseline="central"
                        fontSize={z.fontSize} fontWeight={z.fontSize > 10 ? '700' : '600'}
                        letterSpacing={z.fontSize > 10 ? undefined : '0.5'}
                        fill={z.isActive ? 'hsl(var(--primary))' : '#b8a680'}
                        className="pointer-events-none transition-colors duration-200"
                        opacity={z.isActive ? 1 : 0.6}
                      >
                        {z.label}
                      </text>
                    </g>
                  ));
                })()}

                {/* Divider lines */}
                {(() => {
                  const cx = 65, cy = 65, r = 56;
                  const chordHalf = (y: number) => Math.sqrt(r * r - (y - cy) * (y - cy));
                  const bandTop = 30, bandBot = 100;
                  return (
                    <>
                      {/* Vertical center line - only between band lines */}
                      <line x1="65" y1={bandTop} x2="65" y2={bandBot} stroke="#b8a680" strokeWidth="2" opacity="0.7" />
                      {/* Horizontal center line */}
                      <line x1="9" y1="65" x2="121" y2="65" stroke="#b8a680" strokeWidth="2" opacity="0.7" />
                      {/* Upper horizontal band line */}
                      <line x1={cx - chordHalf(bandTop)} y1={bandTop} x2={cx + chordHalf(bandTop)} y2={bandTop} stroke="#b8a680" strokeWidth="1.5" opacity="0.5" />
                      {/* Lower horizontal band line */}
                      <line x1={cx - chordHalf(bandBot)} y1={bandBot} x2={cx + chordHalf(bandBot)} y2={bandBot} stroke="#b8a680" strokeWidth="1.5" opacity="0.5" />
                    </>
                  );
                })()}
              </svg>
            </div>

            <div className="space-y-2">
              <div className="flex justify-center gap-0.5 sm:gap-1">
                {lowerDeciduousTeeth.map(tooth => renderTooth(tooth, true, true))}
              </div>
              <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase opacity-70">
                Dinți Temporari — Inferior
              </div>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex justify-center gap-0.5 sm:gap-1">
                {lowerTeeth.map(tooth => renderTooth(tooth, false, true))}
              </div>
              <div className="text-xs font-medium text-muted-foreground text-center tracking-wide uppercase">
                Maxilar Inferior — Dinți Permanenți
              </div>
            </div>
          </div>

          {/* Jurnal per dinte - shown below chart when a tooth is selected */}
          {selectedTooth && (
            <ToothJournalSection patientId={patientId} toothNumber={selectedTooth} refreshKey={journalKey} />
          )}
        </div>

        {/* Side panel */}
        {selectedTooth && (
          <div className="w-[350px] shrink-0">
            <ToothDetailPanel
              patientId={patientId}
              toothNumber={selectedTooth}
              toothStatus={selectedToothStatus}
              statusColor={selectedToothColor}
              conditions={toothConditions}
              interventions={toothInterventions}
              conditionsCatalog={conditionsCatalog}
              doctors={doctors}
              treatments={treatments}
              onAddCondition={handleAddCondition}
              onRemoveCondition={handleRemoveCondition}
              onAddIntervention={handleAddIntervention}
              onRemoveIntervention={handleRemoveIntervention}
              onClose={() => setSelectedTooth(null)}
            />
          </div>
        )}
      </div>

      {/* Patient dental info: checkboxes + diagnostics */}
      <PatientDentalInfo patientId={patientId} />
    </div>
  );
}
