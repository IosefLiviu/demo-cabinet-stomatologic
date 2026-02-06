import { format } from 'date-fns';
import { useRef, useEffect, useCallback } from 'react';
import { Plus, User, CheckCircle2, XCircle, Edit3, Users, Clock } from 'lucide-react';
import { TIME_SLOTS, SLOT_DURATION_MINUTES, Appointment } from '@/types/appointment';
import { Cabinet } from '@/hooks/useCabinets';
import { DoctorShift } from '@/hooks/useDoctorShifts';
import { Doctor } from '@/hooks/useDoctors';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface TimeSlotGridProps {
  selectedDate: Date;
  selectedCabinet: number | null;
  appointments: Appointment[];
  cabinets: Cabinet[];
  doctorShifts?: DoctorShift[];
  doctors?: Doctor[];
  onSlotClick: (time: string, cabinetId: number) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onAppointmentComplete?: (id: string) => void;
  onAppointmentCancel?: (id: string) => void;
  onEditPayment?: (id: string) => void;
}

const cabinetBgColors: Record<number, string> = {
  1: 'bg-cabinet-1',
  2: 'bg-cabinet-2',
  3: 'bg-cabinet-3',
  4: 'bg-cabinet-4',
  5: 'bg-cabinet-5',
};

const cabinetBgLightColors: Record<number, string> = {
  1: 'bg-cabinet-1/15 hover:bg-cabinet-1/25',
  2: 'bg-cabinet-2/15 hover:bg-cabinet-2/25',
  3: 'bg-cabinet-3/15 hover:bg-cabinet-3/25',
  4: 'bg-cabinet-4/15 hover:bg-cabinet-4/25',
  5: 'bg-cabinet-5/15 hover:bg-cabinet-5/25',
};

export function TimeSlotGrid({
  selectedDate,
  selectedCabinet,
  appointments,
  cabinets,
  doctorShifts = [],
  doctors = [],
  onSlotClick,
  onAppointmentClick,
  onAppointmentComplete,
  onAppointmentCancel,
  onEditPayment,
}: TimeSlotGridProps) {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hourRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const cabinetsToShow = selectedCabinet
    ? cabinets.filter((c) => c.id === selectedCabinet)
    : cabinets;

  // Quick-jump hours for the navigation bar
  const JUMP_HOURS = ['08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'];

  const scrollToHour = useCallback((hour: string) => {
    const el = hourRefs.current[`${hour}:00`];
    if (el && scrollContainerRef.current) {
      const containerTop = scrollContainerRef.current.getBoundingClientRect().top;
      const elTop = el.getBoundingClientRect().top;
      scrollContainerRef.current.scrollTop += elTop - containerTop - 40; // 40px offset for nav bar
    }
  }, []);

  const scrollToNow = useCallback(() => {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    scrollToHour(currentHour);
  }, [scrollToHour]);

  // Auto-scroll to current hour on mount
  useEffect(() => {
    const timer = setTimeout(scrollToNow, 100);
    return () => clearTimeout(timer);
  }, [scrollToNow]);

  // Helper to convert time string to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Get appointment that starts at this exact slot
  const getAppointmentStartingAt = (time: string, cabinetId: number) => {
    return appointments.find(
      (apt) =>
        apt.date === dateStr && apt.time === time && apt.cabinetId === cabinetId
    );
  };

  // Check if a slot is covered by an ongoing appointment (not the start)
  // A slot is covered if the appointment hasn't ended by the END of this slot
  const getAppointmentCoveringSlot = (time: string, cabinetId: number) => {
    const slotStartMinutes = timeToMinutes(time);
    const slotEndMinutes = slotStartMinutes + SLOT_DURATION_MINUTES;
    return appointments.find((apt) => {
      if (apt.date !== dateStr || apt.cabinetId !== cabinetId) return false;
      const aptStartMinutes = timeToMinutes(apt.time);
      const aptEndMinutes = aptStartMinutes + (apt.duration || SLOT_DURATION_MINUTES);
      // This slot is covered if appointment starts before this slot 
      // AND appointment ends after this slot starts
      return aptStartMinutes < slotStartMinutes && aptEndMinutes > slotStartMinutes;
    });
  };

  // Calculate how many slots an appointment spans
  const getAppointmentSpan = (appointment: Appointment): number => {
    const duration = appointment.duration || SLOT_DURATION_MINUTES;
    return Math.ceil(duration / SLOT_DURATION_MINUTES);
  };

  // Get doctors working at a specific time slot
  const getDoctorsAtTime = (time: string): Doctor[] => {
    const slotMinutes = timeToMinutes(time);
    
    const workingDoctorIds = doctorShifts.filter(shift => {
      const shiftStart = timeToMinutes(shift.start_time);
      const shiftEnd = timeToMinutes(shift.end_time);
      return slotMinutes >= shiftStart && slotMinutes < shiftEnd;
    }).map(s => s.doctor_id);
    
    return doctors.filter(d => workingDoctorIds.includes(d.id));
  };

  // Check if this is the first slot of a shift block (to show doctor names)
  const isFirstSlotOfShiftBlock = (time: string): boolean => {
    const slotMinutes = timeToMinutes(time);
    const prevSlotMinutes = slotMinutes - SLOT_DURATION_MINUTES;
    
    const doctorsNow = getDoctorsAtTime(time);
    if (doctorsNow.length === 0) return false;
    
    // Check if any shift starts exactly at this slot
    const shiftsStartingNow = doctorShifts.filter(shift => {
      const shiftStart = timeToMinutes(shift.start_time);
      return shiftStart === slotMinutes;
    });
    
    if (shiftsStartingNow.length > 0) return true;
    
    // Check if doctors changed from previous slot
    if (prevSlotMinutes >= timeToMinutes(TIME_SLOTS[0])) {
      const prevTime = `${String(Math.floor(prevSlotMinutes / 60)).padStart(2, '0')}:${String(prevSlotMinutes % 60).padStart(2, '0')}`;
      const doctorsPrev = getDoctorsAtTime(prevTime);
      const nowIds = doctorsNow.map(d => d.id).sort().join(',');
      const prevIds = doctorsPrev.map(d => d.id).sort().join(',');
      return nowIds !== prevIds;
    }
    
    return true;
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm flex flex-col">
      {/* Quick-jump hour navigation */}
      <div className="sticky top-0 z-20 bg-muted/80 backdrop-blur-sm border-b border-border px-2 py-1 flex items-center gap-1 overflow-x-auto">
        <button
          onClick={scrollToNow}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex-shrink-0"
        >
          <Clock className="h-3 w-3" />
          Acum
        </button>
        <div className="w-px h-4 bg-border flex-shrink-0" />
        {JUMP_HOURS.map((hour) => (
          <button
            key={hour}
            onClick={() => scrollToHour(hour)}
            className="px-1.5 py-0.5 rounded text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex-shrink-0"
          >
            {hour}
          </button>
        ))}
      </div>
      {/* Outer scroll container for horizontal scroll on mobile */}
      <div className="overflow-x-auto overflow-y-auto flex-1" ref={scrollContainerRef} style={{ maxHeight: 'calc(100vh - 200px)' }}>
        {/* Inner container with minimum width for mobile horizontal scroll */}
        <div 
          className="min-w-[600px] md:min-w-0"
          style={{ 
            display: 'grid',
            gridTemplateColumns: `60px repeat(${cabinetsToShow.length}, minmax(120px, 1fr))`,
          }}
        >
          {/* Header row */}
          <div className="sticky top-0 z-10 bg-muted/50 p-2 sm:p-3 text-center text-xs font-medium text-muted-foreground border-r border-b border-border">
            Ora
          </div>
          {cabinetsToShow.map((cabinet) => (
            <div
              key={cabinet.id}
              className="sticky top-0 z-10 bg-muted/50 p-2 sm:p-3 text-center border-r border-b border-border last:border-r-0"
            >
              <div className="flex items-center justify-center gap-1 sm:gap-2">
                <span
                  className={cn(
                    "w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0",
                    cabinetBgColors[cabinet.id]
                  )}
                />
                <span className="text-xs sm:text-sm font-semibold text-foreground truncate">{cabinet.name}</span>
              </div>
              <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 truncate">{cabinet.doctor}</p>
            </div>
          ))}

          {/* Time slots - rendered as flat grid items */}
          {TIME_SLOTS.map((time) => {
            const workingDoctors = getDoctorsAtTime(time);
            const showDoctorBanner = isFirstSlotOfShiftBlock(time) && workingDoctors.length > 0;
            
            return (
            <>
              {/* Doctor shift banner row - spans all columns when shift starts */}
              {showDoctorBanner && (
                <>
                  <div 
                    key={`doctors-time-${time}`}
                    className="h-[24px] flex items-center justify-center text-[10px] font-medium text-muted-foreground border-r border-b border-border bg-muted/30"
                  >
                    {time}
                  </div>
                  {cabinetsToShow.map((cabinet) => (
                    <div
                      key={`doctors-${time}-${cabinet.id}`}
                      className="h-[24px] flex items-center gap-1 px-2 border-r border-b border-border last:border-r-0 bg-primary/5"
                    >
                      <Users className="h-3 w-3 text-primary/60 flex-shrink-0" />
                      <span className="text-[10px] font-medium text-foreground truncate">
                        {workingDoctors.map(d => d.name.replace('Dr. ', '')).join(' & ')}
                      </span>
                    </div>
                  ))}
                </>
              )}
              
              {/* Regular time column */}
              <div 
                key={`time-${time}`}
                ref={time.endsWith(':00') ? (el) => { hourRefs.current[time] = el; } : undefined}
                className="h-[26px] flex items-center justify-center text-[9px] font-medium text-muted-foreground border-r border-b border-border bg-muted/30"
              >
                {time.endsWith(':00') ? time : ''}
              </div>
              {/* Cabinet columns for this time slot */}
              {cabinetsToShow.map((cabinet) => {
                const appointmentStarting = getAppointmentStartingAt(time, cabinet.id);
                const appointmentCovering = getAppointmentCoveringSlot(time, cabinet.id);
                const slotIndex = TIME_SLOTS.indexOf(time);
                
                // Check if this is the last slot of a multi-slot appointment
                // (i.e., the appointment ends within or at the end of this slot)
                const isLastContinuationSlot = appointmentCovering && (() => {
                  const aptStartMinutes = timeToMinutes(appointmentCovering.time);
                  const aptEndMinutes = aptStartMinutes + (appointmentCovering.duration || SLOT_DURATION_MINUTES);
                  const slotStartMinutes = timeToMinutes(time);
                  const slotEndMinutes = slotStartMinutes + SLOT_DURATION_MINUTES;
                  // This is the last slot if the appointment ends within this slot's time range
                  return aptEndMinutes <= slotEndMinutes && aptEndMinutes > slotStartMinutes;
                })();
                
                // Check if starting appointment spans multiple slots
                const appointmentSpan = appointmentStarting ? getAppointmentSpan(appointmentStarting) : 1;
                const isMultiSlot = appointmentSpan > 1;
                
                // If this slot is covered by an ongoing appointment, render continuation
                // Check if this is the first continuation slot (right after start)
                const isFirstContinuation = appointmentCovering && (() => {
                  const aptStartMinutes = timeToMinutes(appointmentCovering.time);
                  const slotStartMinutes = timeToMinutes(time);
                  return slotStartMinutes === aptStartMinutes + SLOT_DURATION_MINUTES;
                })();

                if (appointmentCovering) {
                  return (
                    <div
                      key={`${time}-${cabinet.id}`}
                      className={cn(
                        "border-r last:border-r-0 h-[26px] min-w-0 overflow-hidden px-0.5",
                        isLastContinuationSlot && "border-b border-border"
                      )}
                    >
                      {/* Continuation of appointment - seamless colored background with side borders */}
                      <div
                        className={cn(
                          "w-full cursor-pointer border-l border-r",
                          isLastContinuationSlot ? "h-[calc(100%-2px)] sm:h-[calc(100%-4px)] rounded-b-sm border-b" : "h-full",
                          appointmentCovering.status === 'completed' && "opacity-75",
                          appointmentCovering.status === 'cancelled'
                            ? "bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-800 opacity-60"
                            : "",
                          isFirstContinuation && "flex items-center px-1 gap-1"
                        )}
                        style={
                          appointmentCovering.status !== 'cancelled' && 
                          appointmentCovering.doctorColor 
                            ? { 
                                backgroundColor: `${appointmentCovering.doctorColor}20`,
                                borderColor: `${appointmentCovering.doctorColor}50`
                              } 
                            : appointmentCovering.status !== 'cancelled'
                            ? { 
                                backgroundColor: cabinetBgLightColors[cabinet.id]?.includes('bg-cabinet') 
                                  ? undefined 
                                  : `hsl(var(--cabinet-${cabinet.id}) / 0.15)`,
                                borderColor: `hsl(var(--cabinet-${cabinet.id}) / 0.3)`
                              }
                            : undefined
                        }
                        onClick={() => onAppointmentClick(appointmentCovering)}
                      >
                        {isFirstContinuation && (appointmentCovering.notes || appointmentCovering.treatment) && (
                          <span className="text-[11px] font-semibold text-foreground/80 truncate leading-tight">
                            {appointmentCovering.notes ? (
                              <span className="italic">{appointmentCovering.notes}</span>
                            ) : (
                              <span>{appointmentCovering.treatment}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                }
                
                // Regular slot - either with starting appointment or empty
                return (
                  <div
                    key={`${time}-${cabinet.id}`}
                    className={cn(
                      "border-r last:border-r-0 h-[26px] min-w-0 overflow-hidden",
                      "px-0.5",
                      // Add bottom border unless this is the start of a multi-slot appointment
                      !(appointmentStarting && isMultiSlot) && "border-b border-border",
                      appointmentStarting && "pt-0.5",
                      appointmentStarting && !isMultiSlot && "pb-0.5",
                      !appointmentStarting && "p-0.5"
                    )}
                  >
                    {appointmentStarting ? (
                      <div
                        className={cn(
                          "w-full h-full p-0.5 text-left transition-all overflow-hidden min-w-0 flex items-center gap-0.5 border relative",
                          isMultiSlot ? "rounded-t-sm border-b-0" : "rounded-sm",
                          appointmentStarting.status === 'completed' && "opacity-75",
                          appointmentStarting.status === 'cancelled'
                            ? "bg-red-100 dark:bg-red-950/30 border-red-300 dark:border-red-800 opacity-60"
                            : !appointmentStarting.doctorColor && cabinetBgLightColors[cabinet.id]
                        )}
                        style={
                          appointmentStarting.status !== 'cancelled' && 
                          appointmentStarting.doctorColor 
                            ? { 
                                backgroundColor: `${appointmentStarting.doctorColor}20`, 
                                borderColor: `${appointmentStarting.doctorColor}50` 
                              } 
                            : undefined
                        }
                      >
                        <button
                          onClick={() => onAppointmentClick(appointmentStarting)}
                          className="flex-1 min-w-0 h-full flex items-center cursor-pointer"
                        >
                          {/* Completed badge - left side */}
                          {appointmentStarting.status === 'completed' && (
                            <div className="bg-green-500 rounded-sm px-0.5 mr-1 flex-shrink-0" title="Finalizată">
                              <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                            </div>
                          )}
                          <div className="flex items-center gap-1 min-w-0 flex-1">
                            {appointmentStarting.status !== 'completed' && (
                              <User className="h-3 w-3 flex-shrink-0 text-foreground/70" />
                            )}
                            <span className={cn(
                              "text-xs font-bold text-foreground whitespace-nowrap leading-tight flex-shrink-0",
                              appointmentStarting.status === 'cancelled' && "line-through"
                            )}>
                              {appointmentStarting.patientName}
                            </span>
                            <span className="text-xs font-bold text-foreground/80 truncate hidden sm:inline">
                              • {appointmentStarting.treatment}
                            </span>
                           {appointmentStarting.notes && (
                             <span className="text-[10px] font-medium text-primary truncate hidden md:inline italic">
                               • {appointmentStarting.notes}
                             </span>
                           )}
                          </div>
                          {appointmentStarting.doctorName && (
                            <span 
                              className="text-[9px] font-medium truncate px-1 py-0.5 rounded ml-1 hidden md:inline"
                              style={{ 
                                backgroundColor: appointmentStarting.doctorColor ? `${appointmentStarting.doctorColor}30` : undefined,
                                color: appointmentStarting.doctorColor || undefined 
                              }}
                            >
                              {appointmentStarting.doctorName.replace('Dr. ', '')}
                            </span>
                          )}
                        </button>
                        {appointmentStarting.status !== 'completed' && appointmentStarting.status !== 'cancelled' && (
                          <div className="flex gap-0.5 flex-shrink-0">
                            {onAppointmentComplete && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAppointmentComplete(appointmentStarting.id);
                                      }}
                                      className="p-0.5 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                                    >
                                      <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Finalizează</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {onAppointmentCancel && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAppointmentCancel(appointmentStarting.id);
                                      }}
                                      className="p-0.5 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                                    >
                                      <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Anulează</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        )}
                        {appointmentStarting.status === 'completed' && (
                          <div className="flex gap-0.5 flex-shrink-0">
                            <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                            {onEditPayment && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onEditPayment(appointmentStarting.id);
                                      }}
                                      className="p-0.5 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                                    >
                                      <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Editează plata</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        )}
                        {appointmentStarting.status === 'cancelled' && (
                          <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => onSlotClick(time, cabinet.id)}
                        className="w-full h-full rounded-sm border border-dashed border-transparent hover:border-primary/30 hover:bg-accent/50 flex items-center justify-center transition-all group"
                      >
                        <Plus className="h-3 w-3 text-muted-foreground/0 group-hover:text-primary/50 transition-all" />
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          )})}
        </div>
      </div>
    </div>
  );
}
