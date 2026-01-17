import { format } from 'date-fns';
import { Plus, User, CheckCircle2 } from 'lucide-react';
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
      {/* Scroll container (keeps header + rows aligned even with vertical scrollbar) */}
      <div
        className="max-h-[calc(100vh-320px)] overflow-y-auto"
        style={{ scrollbarGutter: 'stable' }}
      >
        {/* Header */}
        <div
          className="grid border-b border-border bg-muted/50 sticky top-0 z-10"
          style={{ gridTemplateColumns: `80px repeat(${cabinetsToShow.length}, 1fr)` }}
        >
          <div className="p-3 text-center text-xs font-medium text-muted-foreground border-r border-border">
            Ora
          </div>
          {cabinetsToShow.map((cabinet) => (
            <div
              key={cabinet.id}
              className="p-3 text-center border-r border-border last:border-r-0"
            >
              <div className="flex items-center justify-center gap-2">
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    cabinetBgColors[cabinet.id]
                  )}
                />
                <span className="text-sm font-semibold text-foreground">{cabinet.name}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{cabinet.doctor}</p>
            </div>
          ))}
        </div>

        {/* Time slots */}
        {TIME_SLOTS.map((time) => (
          <div
            key={time}
            className="grid border-b border-border last:border-b-0 h-[60px] overflow-hidden"
            style={{ gridTemplateColumns: `80px repeat(${cabinetsToShow.length}, 1fr)` }}
          >
            <div className="h-full flex items-center justify-center text-sm font-medium text-muted-foreground border-r border-border bg-muted/30">
              {time}
            </div>
            {cabinetsToShow.map((cabinet) => {
              const appointment = getAppointmentForSlot(time, cabinet.id);
              return (
                <div
                  key={cabinet.id}
                  className="p-1.5 border-r border-border last:border-r-0 h-[60px] min-w-0 overflow-hidden"
                >
                  {appointment ? (
                    <div
                      className={cn(
                        "w-full h-full rounded-md p-2 text-left transition-all overflow-hidden min-w-0 flex items-center gap-1",
                        appointment.status === 'completed' 
                          ? "bg-green-100 dark:bg-green-950/30 border border-green-300 dark:border-green-800"
                          : cabinetBgLightColors[cabinet.id]
                      )}
                    >
                      <button
                        onClick={() => onAppointmentClick(appointment)}
                        className="flex-1 min-w-0 h-full flex flex-col justify-center cursor-pointer"
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <User className="h-3 w-3 flex-shrink-0 text-foreground/70" />
                          <span className="text-xs font-medium text-foreground truncate leading-tight">
                            {appointment.patientName}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 truncate leading-tight">
                          {appointment.treatment}
                        </p>
                      </button>
                      {onAppointmentComplete && appointment.status !== 'completed' && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onAppointmentComplete(appointment.id);
                                }}
                                className="p-1 rounded hover:bg-green-200 dark:hover:bg-green-800 transition-colors flex-shrink-0"
                              >
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Marchează ca finalizată</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {appointment.status === 'completed' && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
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
          </div>
        ))}
      </div>
    </div>
  );
}
