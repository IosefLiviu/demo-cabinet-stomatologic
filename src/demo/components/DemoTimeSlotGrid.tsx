import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useDemoData } from '@/demo/contexts/DemoDataContext';
import { useIsMobile } from '@/hooks/use-mobile';

const TIME_SLOTS = [
  "08:00", "08:15", "08:30", "08:45",
  "09:00", "09:15", "09:30", "09:45",
  "10:00", "10:15", "10:30", "10:45",
  "11:00", "11:15", "11:30", "11:45",
  "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15", "15:30", "15:45",
  "16:00", "16:15", "16:30", "16:45",
  "17:00", "17:15", "17:30", "17:45",
  "18:00", "18:15", "18:30", "18:45",
  "19:00", "19:15", "19:30", "19:45",
  "20:00", "20:15", "20:30", "20:45",
  "21:00"
];

const SLOT_DURATION = 15;

const DEMO_CABINETS = [
  { id: 1, name: "Cabinet 1", doctor: "Dr. Maria Popescu" },
  { id: 2, name: "Cabinet 2", doctor: "Dr. Andrei Ionescu" },
  { id: 3, name: "Cabinet 3", doctor: "Dr. Elena Dumitrescu" },
];

const cabinetBgColors: Record<number, string> = {
  1: 'bg-cabinet-1',
  2: 'bg-cabinet-2',
  3: 'bg-cabinet-3',
  4: 'bg-cabinet-4',
  5: 'bg-cabinet-5',
};

interface DemoTimeSlotGridProps {
  selectedDate: Date;
  selectedCabinet: number | null;
  filterDoctor: string | null;
}

interface DemoGridAppointment {
  id: string;
  cabinetId: number;
  patientName: string;
  time: string;
  duration: number;
  treatment: string;
  doctorColor?: string;
  doctorName?: string;
  status: string;
  notes?: string;
}

export function DemoTimeSlotGrid({ selectedDate, selectedCabinet, filterDoctor }: DemoTimeSlotGridProps) {
  const { appointments, doctors } = useDemoData();
  const isMobile = useIsMobile();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  // Convert demo appointments to grid format
  const gridAppointments: DemoGridAppointment[] = appointments
    .filter(a => a.date === dateStr)
    .filter(a => !filterDoctor || a.doctor_id === filterDoctor)
    .map(a => {
      const doctor = doctors.find(d => d.id === a.doctor_id);
      const startMinutes = timeToMinutes(a.start_time);
      const endMinutes = timeToMinutes(a.end_time);
      return {
        id: a.id,
        cabinetId: a.cabinet_id,
        patientName: a.patient_name,
        time: a.start_time,
        duration: endMinutes - startMinutes,
        treatment: a.treatment_names.join(', '),
        doctorColor: doctor?.color,
        doctorName: doctor?.name,
        status: a.status,
        notes: a.notes,
      };
    });

  const cabinetsToShow = selectedCabinet
    ? DEMO_CABINETS.filter(c => c.id === selectedCabinet)
    : DEMO_CABINETS;

  function timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  function getAppointmentStartingAt(time: string, cabinetId: number) {
    return gridAppointments.find(a => a.time === time && a.cabinetId === cabinetId);
  }

  function getAppointmentCoveringSlot(time: string, cabinetId: number) {
    const slotStart = timeToMinutes(time);
    return gridAppointments.find(a => {
      if (a.cabinetId !== cabinetId) return false;
      const aptStart = timeToMinutes(a.time);
      const aptEnd = aptStart + (a.duration || SLOT_DURATION);
      return aptStart < slotStart && aptEnd > slotStart;
    });
  }

  function getAppointmentSpan(apt: DemoGridAppointment): number {
    return Math.ceil((apt.duration || SLOT_DURATION) / SLOT_DURATION);
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      <div className={cn("overflow-x-auto relative", isMobile && "mobile-scroll-hint")}>
        <div
          className="min-w-[600px] md:min-w-0"
          style={{
            display: 'grid',
            gridTemplateColumns: `60px repeat(${cabinetsToShow.length}, minmax(120px, 1fr))`,
          }}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 bg-muted/50 p-2 sm:p-3 text-center text-xs font-medium text-muted-foreground border-r border-b border-border">
            Ora
          </div>
          {cabinetsToShow.map(cabinet => (
            <div key={cabinet.id} className="sticky top-0 z-10 bg-muted/50 p-2 sm:p-3 text-center border-r border-b border-border last:border-r-0">
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <span className={cn("w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0", cabinetBgColors[cabinet.id])} />
                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">{cabinet.name}</span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{cabinet.doctor}</p>
            </div>
          ))}

          {/* Time slots */}
          {TIME_SLOTS.map(time => (
            <>
              <div
                key={`time-${time}`}
                data-time-slot={time}
                className={cn(
                  "flex items-center justify-center text-[9px] font-medium text-muted-foreground border-r border-b border-border bg-muted/30",
                  isMobile ? "h-[32px]" : "h-[26px]"
                )}
              >
                {time.endsWith(':00') ? time : ''}
              </div>
              {cabinetsToShow.map(cabinet => {
                const aptStarting = getAppointmentStartingAt(time, cabinet.id);
                const aptCovering = getAppointmentCoveringSlot(time, cabinet.id);
                const span = aptStarting ? getAppointmentSpan(aptStarting) : 1;
                const isMultiSlot = span > 1;

                if (aptCovering) {
                  const aptStart = timeToMinutes(aptCovering.time);
                  const aptEnd = aptStart + (aptCovering.duration || SLOT_DURATION);
                  const slotStart = timeToMinutes(time);
                  const slotEnd = slotStart + SLOT_DURATION;
                  const isLast = aptEnd <= slotEnd && aptEnd > slotStart;

                  return (
                    <div
                      key={`${time}-${cabinet.id}`}
                      className={cn(
                        "border-r last:border-r-0 min-w-0 overflow-hidden px-0.5",
                        isMobile ? "h-[32px]" : "h-[26px]",
                        isLast && "border-b border-border"
                      )}
                    >
                      <div
                        className={cn(
                          "w-full cursor-pointer border-l border-r",
                          isLast ? "h-[calc(100%-2px)] rounded-b-sm border-b" : "h-full",
                          aptCovering.status === 'completed' && "opacity-75",
                          aptCovering.status === 'cancelled' && "bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-800 opacity-60"
                        )}
                        style={aptCovering.status !== 'cancelled' && aptCovering.doctorColor ? {
                          backgroundColor: `${aptCovering.doctorColor}20`,
                          borderColor: `${aptCovering.doctorColor}50`,
                        } : undefined}
                      />
                    </div>
                  );
                }

                if (aptStarting) {
                  return (
                    <div
                      key={`${time}-${cabinet.id}`}
                      className={cn(
                        "border-r last:border-r-0 min-w-0 overflow-hidden px-0.5 pt-0.5",
                        isMobile ? "h-[32px]" : "h-[26px]",
                        !isMultiSlot && "border-b border-border"
                      )}
                    >
                      <div
                        className={cn(
                          "w-full rounded-t-sm cursor-pointer border-l border-r border-t px-1 py-0.5 overflow-hidden",
                          !isMultiSlot && "rounded-b-sm border-b h-full",
                          isMultiSlot && "h-full",
                          aptStarting.status === 'completed' && "opacity-75",
                          aptStarting.status === 'cancelled' && "bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-800 opacity-60"
                        )}
                        style={aptStarting.status !== 'cancelled' && aptStarting.doctorColor ? {
                          backgroundColor: `${aptStarting.doctorColor}20`,
                          borderColor: `${aptStarting.doctorColor}50`,
                        } : undefined}
                      >
                        <div className="flex items-center gap-1 overflow-hidden">
                          <span className="text-[10px] font-bold text-foreground truncate leading-tight">
                            {aptStarting.patientName}
                          </span>
                          {aptStarting.status === 'completed' && (
                            <span className="text-[8px] text-green-600 dark:text-green-400 font-medium shrink-0">✓</span>
                          )}
                        </div>
                        {isMultiSlot && (
                          <span className="text-[9px] text-muted-foreground truncate block leading-tight">
                            {aptStarting.treatment}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }

                // Empty slot
                return (
                  <div
                    key={`${time}-${cabinet.id}`}
                    className={cn(
                      "border-r border-b border-border last:border-r-0 cursor-pointer hover:bg-accent/30 transition-colors",
                      isMobile ? "h-[32px]" : "h-[26px]"
                    )}
                  />
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
