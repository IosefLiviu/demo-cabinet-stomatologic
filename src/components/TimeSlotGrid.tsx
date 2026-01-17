import { format } from 'date-fns';
import { Plus, User, CheckCircle2, XCircle } from 'lucide-react';
import { TIME_SLOTS, Appointment } from '@/types/appointment';
import { Cabinet } from '@/hooks/useCabinets';
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
  onSlotClick: (time: string, cabinetId: number) => void;
  onAppointmentClick: (appointment: Appointment) => void;
  onAppointmentComplete?: (id: string) => void;
  onAppointmentCancel?: (id: string) => void;
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
  onSlotClick,
  onAppointmentClick,
  onAppointmentComplete,
  onAppointmentCancel,
}: TimeSlotGridProps) {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const cabinetsToShow = selectedCabinet
    ? cabinets.filter((c) => c.id === selectedCabinet)
    : cabinets;

  const getAppointmentForSlot = (time: string, cabinetId: number) => {
    return appointments.find(
      (apt) =>
        apt.date === dateStr && apt.time === time && apt.cabinetId === cabinetId
    );
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
          {TIME_SLOTS.map((time) => (
            <>
              {/* Time column */}
              <div 
                key={`time-${time}`}
                className="h-[50px] sm:h-[60px] flex items-center justify-center text-xs sm:text-sm font-medium text-muted-foreground border-r border-b border-border bg-muted/30"
              >
                {time}
              </div>
              {/* Cabinet columns for this time slot */}
              {cabinetsToShow.map((cabinet) => {
                const appointment = getAppointmentForSlot(time, cabinet.id);
                return (
                  <div
                    key={`${time}-${cabinet.id}`}
                    className="p-1 sm:p-1.5 border-r border-b border-border last:border-r-0 h-[50px] sm:h-[60px] min-w-0 overflow-hidden"
                  >
                    {appointment ? (
                      <div
                        className={cn(
                          "w-full h-full rounded-md p-1 sm:p-2 text-left transition-all overflow-hidden min-w-0 flex items-center gap-1",
                          appointment.status === 'completed' 
                            ? "bg-green-100 dark:bg-green-950/30 border border-green-300 dark:border-green-800"
                            : appointment.status === 'cancelled'
                            ? "bg-red-100 dark:bg-red-950/30 border border-red-300 dark:border-red-800 opacity-60"
                            : cabinetBgLightColors[cabinet.id]
                        )}
                      >
                        <button
                          onClick={() => onAppointmentClick(appointment)}
                          className="flex-1 min-w-0 h-full flex flex-col justify-center cursor-pointer"
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            <User className="h-3 w-3 flex-shrink-0 text-foreground/70" />
                            <span className={cn(
                              "text-[10px] sm:text-xs font-medium text-foreground truncate leading-tight",
                              appointment.status === 'cancelled' && "line-through"
                            )}>
                              {appointment.patientName}
                            </span>
                          </div>
                          <p className={cn(
                            "text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 truncate leading-tight",
                            appointment.status === 'cancelled' && "line-through"
                          )}>
                            {appointment.treatment}
                          </p>
                        </button>
                        {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
                          <div className="flex flex-col gap-0.5 flex-shrink-0">
                            {onAppointmentComplete && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onAppointmentComplete(appointment.id);
                                      }}
                                      className="p-0.5 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                                    >
                                      <CheckCircle2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
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
                                        onAppointmentCancel(appointment.id);
                                      }}
                                      className="p-0.5 rounded hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                                    >
                                      <XCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-500" />
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
                        {appointment.status === 'completed' && (
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 flex-shrink-0" />
                        )}
                        {appointment.status === 'cancelled' && (
                          <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                    ) : (
                      <button
                        onClick={() => onSlotClick(time, cabinet.id)}
                        className="w-full h-full rounded-md border-2 border-dashed border-transparent hover:border-primary/30 hover:bg-accent/50 flex items-center justify-center transition-all group"
                      >
                        <Plus className="h-4 w-4 text-muted-foreground/0 group-hover:text-primary/50 transition-all" />
                      </button>
                    )}
                  </div>
                );
              })}
            </>
          ))}
        </div>
      </div>
    </div>
  );
}
