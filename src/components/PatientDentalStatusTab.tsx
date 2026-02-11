import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { TOOTH_STATUSES, getStatusHexColor as getStatusHexColorUtil } from '@/constants/toothStatuses';
import { getToothImage } from './dental/toothImages';
import { ToothDetailPanel } from './dental/ToothDetailPanel';
import { PatientDentalInfo } from './dental/PatientDentalInfo';
import { useDentalConditionsCatalog, useToothConditions, useToothInterventions } from '@/hooks/useToothData';
import { useDoctors } from '@/hooks/useDoctors';
import { useTreatments } from '@/hooks/useTreatments';

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
}

function ToothJournalSection({ patientId, toothNumber }: { patientId: string; toothNumber: number }) {
  const [entries, setEntries] = useState<ToothJournalEntry[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('appointment_treatments')
          .select(`
            id,
            treatment_name,
            tooth_numbers,
            created_at,
            appointment:appointments!inner(
              appointment_date,
              status,
              doctor:doctors(name),
              cabinet:cabinets(name)
            )
          `)
          .eq('appointment.patient_id', patientId)
          .contains('tooth_numbers', [toothNumber])
          .in('appointment.status', ['completed', 'finalizat'])
          .order('created_at', { ascending: false });

        if (!error && data) {
          setEntries((data || []).map((item: any) => ({
            id: item.id,
            date: item.appointment?.appointment_date || item.created_at,
            treatment_name: item.treatment_name,
            doctor_name: item.appointment?.doctor?.name || null,
            cabinet_name: item.appointment?.cabinet?.name || null,
          })));
        }
      } catch (err) {
        console.error('Error loading tooth journal:', err);
      }
    };
    load();
  }, [patientId, toothNumber]);

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
                    <div className="font-medium">{entry.treatment_name}</div>
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

  // Data hooks
  const { conditions: conditionsCatalog } = useDentalConditionsCatalog();
  const { conditions: toothConditions, addCondition, removeCondition } = useToothConditions(patientId);
  const { interventions: toothInterventions, addIntervention, removeIntervention } = useToothInterventions(patientId);
  const { doctors } = useDoctors();
  const { treatments } = useTreatments();

  const getToothStatus = (toothNumber: number): string => {
    const tooth = dentalStatus.find((t) => t.tooth_number === toothNumber);
    if (!tooth) return 'Sănătos';
    return statusEnumToName[tooth.status] || tooth.status;
  };

  const getStatusHexColor = (statusName: string): string | null => getStatusHexColorUtil(statusName);

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
    const toothImage = getToothImage(toothNumber);
    const hexColor = getStatusHexColor(status);
    const hasStatus = status !== 'Sănătos' && status !== 'healthy';
    const isMissing = status === 'missing' || status === 'Absent';
    const hasConditions = (conditionsCountByTooth[toothNumber] || 0) > 0;
    const hasInterventions = (interventionsCountByTooth[toothNumber] || 0) > 0;

    return (
      <div key={toothNumber} className="relative flex flex-col items-center group">
        {!isLower && (
          <span className={cn(
            "text-[10px] font-semibold mb-1 transition-all duration-300",
            hasStatus ? 'text-foreground' : 'text-muted-foreground',
            (isHovered || isSelected) && 'text-primary scale-110'
          )}>
            {toothNumber}
          </span>
        )}

        <div
          onMouseEnter={() => setHoveredTooth(toothNumber)}
          onMouseLeave={() => setHoveredTooth(null)}
          onClick={() => setSelectedTooth(toothNumber)}
          className={cn(
            'relative flex items-center justify-center rounded-lg overflow-hidden',
            'transition-all duration-300 ease-out',
            'bg-muted/30 cursor-pointer p-1',
            isHovered && 'ring-2 ring-offset-1 ring-primary z-10',
            isSelected && 'ring-2 ring-offset-2 ring-primary z-10',
            hasStatus && !isMissing && !isSelected && 'ring-2',
            isDeciduous
              ? 'w-9 h-11 sm:w-10 sm:h-12'
              : 'w-10 h-14 sm:w-11 sm:h-16'
          )}
          style={{
            transform: isHovered ? 'scale(1.15) translateY(-4px)' : 'scale(1) translateY(0)',
            boxShadow: isSelected
              ? '0 0 0 2px hsl(var(--primary)), 0 8px 20px -4px hsl(var(--primary) / 0.3)'
              : isHovered
                ? hasStatus && hexColor
                  ? `0 0 0 2px ${hexColor}, 0 8px 20px -4px ${hexColor}60`
                  : '0 8px 20px -4px rgba(34,197,94,0.3)'
                : hasStatus && hexColor
                  ? `0 0 0 2px ${hexColor}`
                  : 'none',
            transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease-out',
          }}
        >
          {toothImage ? (
            <img
              src={toothImage}
              alt={`Dinte ${toothNumber}`}
              className={cn(
                "w-full h-full object-contain transition-all duration-300",
                isMissing && 'opacity-20 grayscale',
                isLower && 'rotate-180',
              )}
              style={{
                filter: isHovered && !isMissing
                  ? 'brightness(1.1) drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                  : undefined,
              }}
            />
          ) : (
            <div className={cn(
              "w-full h-full flex items-center justify-center",
              "bg-gradient-to-b from-muted/40 to-muted/20 border-2 rounded-lg",
              isDeciduous && 'border-dashed',
            )}>
              <span className="text-xs font-medium text-muted-foreground">{toothNumber}</span>
            </div>
          )}

          {hasStatus && hexColor && !isMissing && (
            <div
              className="absolute inset-0 pointer-events-none rounded-lg transition-all duration-300"
              style={{ backgroundColor: isHovered ? `${hexColor}50` : `${hexColor}30` }}
            />
          )}

          {/* Notes indicator */}
          {notes && (
            <div className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-primary border border-background shadow-sm" />
          )}

          {/* Conditions/interventions indicator */}
          {(hasConditions || hasInterventions) && (
            <div className="absolute bottom-0.5 left-0.5 w-2 h-2 rounded-full bg-warning border border-background shadow-sm" />
          )}
        </div>

        {isLower && (
          <span className={cn(
            "text-[10px] font-semibold mt-1 transition-all duration-300",
            hasStatus ? 'text-foreground' : 'text-muted-foreground',
            (isHovered || isSelected) && 'text-primary scale-110'
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

            <div className="flex justify-center py-4">
              <div
                className="w-full max-w-3xl h-px"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, hsl(var(--muted-foreground)/0.3) 20%, hsl(var(--muted-foreground)/0.5) 50%, hsl(var(--muted-foreground)/0.3) 80%, transparent 100%)',
                }}
              />
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
            <ToothJournalSection patientId={patientId} toothNumber={selectedTooth} />
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
              onAddCondition={addCondition}
              onRemoveCondition={removeCondition}
              onAddIntervention={addIntervention}
              onRemoveIntervention={removeIntervention}
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
