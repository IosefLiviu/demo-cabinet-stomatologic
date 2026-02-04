import { format } from 'date-fns';
import { Plus, User, CheckCircle2, XCircle, Edit3, Users } from 'lucide-react';
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
  const cabinetsToShow = selectedCabinet
    ? cabinets.filter((c) => c.id === selectedCabinet)
    : cabinets;

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
    <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
      {/* Outer scroll container for horizontal scroll on mobile */}
      <div className="overflow-x-auto">
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
                className="h-[50px] sm:h-[55px] flex items-center justify-center text-xs sm:text-sm font-medium text-muted-foreground border-r border-b border-border bg-muted/30"
              >
                {time}
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
                if (appointmentCovering) {
                  return (
                    <div
                      key={`${time}-${cabinet.id}`}
                      className={cn(
                        "border-r last:border-r-0 h-[50px] sm:h-[55px] min-w-0 overflow-hidden px-0.5 sm:px-1",
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
                            : ""
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
                      />
                    </div>
                  );
                }
                
                // Regular slot - either with starting appointment or empty
                return (
                  <div
                    key={`${time}-${cabinet.id}`}
                    className={cn(
                      "border-r last:border-r-0 h-[50px] sm:h-[55px] min-w-0 overflow-hidden",
                      "px-0.5 sm:px-1",
                      // Add bottom border unless this is the start of a multi-slot appointment
                      !(appointmentStarting && isMultiSlot) && "border-b border-border",
                      appointmentStarting && "pt-0.5 sm:pt-1",
                      appointmentStarting && !isMultiSlot && "pb-0.5 sm:pb-1",
                      !appointmentStarting && "p-0.5 sm:p-1"
                    )}
                  >
                    {appointmentStarting ? (
                      <div
                        className={cn(
                          "w-full h-full p-0.5 sm:p-1 text-left transition-all overflow-hidden min-w-0 flex items-center gap-0.5 border relative",
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
                        {/* Completed badge */}
                        {appointmentStarting.status === 'completed' && (
                          <div className="absolute -top-1 -right-1 bg-green-500 rounded-full p-0.5 z-10" title="Finalizată">
                            <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                          </div>
                        )}
                        <button
                          onClick={() => onAppointmentClick(appointmentStarting)}
                          className="flex-1 min-w-0 h-full flex flex-col justify-center cursor-pointer"
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 text-foreground/70" />
                            <span className={cn(
                              "text-xs sm:text-sm font-semibold text-foreground truncate leading-none",
                              appointmentStarting.status === 'cancelled' && "line-through"
                            )}>
                              {appointmentStarting.patientName}
                            </span>
                          </div>
                          <p className={cn(
                            "text-[11px] sm:text-xs font-medium text-muted-foreground truncate leading-none mt-0.5",
                            appointmentStarting.status === 'cancelled' && "line-through"
                          )}>
                            {appointmentStarting.time} - {(() => {
                              const [hours, minutes] = appointmentStarting.time.split(':').map(Number);
                              const endMinutes = hours * 60 + minutes + (appointmentStarting.duration || SLOT_DURATION_MINUTES);
                              const endHours = Math.floor(endMinutes / 60);
                              const endMins = endMinutes % 60;
                              return `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
                            })()} • {appointmentStarting.treatment}
                          </p>
                          {appointmentStarting.doctorName && (
                            <span 
                              className="text-[10px] sm:text-[11px] font-semibold truncate leading-none mt-0.5 px-1 py-0.5 rounded"
                              style={{ 
                                backgroundColor: appointmentStarting.doctorColor ? `${appointmentStarting.doctorColor}25` : undefined,
                                color: appointmentStarting.doctorColor || undefined 
                              }}
                            >
                              {appointmentStarting.doctorName}
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
