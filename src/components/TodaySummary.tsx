import { format } from 'date-fns';
import { Calendar, Users, Clock } from 'lucide-react';
import { Appointment, CABINETS } from '@/types/appointment';
import { cn } from '@/lib/utils';

interface TodaySummaryProps {
  selectedDate: Date;
  appointments: Appointment[];
}

const cabinetBgColors: Record<number, string> = {
  1: 'bg-cabinet-1',
  2: 'bg-cabinet-2',
  3: 'bg-cabinet-3',
  4: 'bg-cabinet-4',
  5: 'bg-cabinet-5',
};

export function TodaySummary({ selectedDate, appointments }: TodaySummaryProps) {
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayAppointments = appointments.filter((apt) => apt.date === dateStr);
  
  const totalDuration = todayAppointments.reduce((acc, apt) => acc + apt.duration, 0);
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  const appointmentsByHour = todayAppointments.reduce<Record<number, number>>((acc, apt) => {
    acc[apt.cabinetId] = (acc[apt.cabinetId] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
      <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-card border border-border px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm">
        <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        <span className="text-xs sm:text-sm font-bold text-foreground">{todayAppointments.length}</span>
        <span className="text-[10px] sm:text-xs text-muted-foreground">Programări</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 rounded-lg bg-card border border-border px-2 sm:px-3 py-1 sm:py-1.5 shadow-sm">
        <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-success" />
        <span className="text-xs sm:text-sm font-bold text-foreground">
          {hours > 0 ? `${hours}h` : ''}{minutes > 0 ? `${minutes}m` : hours === 0 ? '0m' : ''}
        </span>
        <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">Timp total</span>
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 ml-auto overflow-x-auto scrollbar-hide">
        <span className="text-[10px] sm:text-xs text-muted-foreground mr-0.5 sm:mr-1 hidden md:inline">Per cabinet</span>
        {CABINETS.map((cabinet) => (
          <div
            key={cabinet.id}
            className="flex items-center gap-0.5 sm:gap-1 rounded-md bg-muted/50 px-1.5 sm:px-2 py-0.5 sm:py-1 shrink-0"
          >
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                cabinetBgColors[cabinet.id]
              )}
            />
            <span className="text-[10px] sm:text-xs font-medium text-foreground hidden md:inline">
              {cabinet.name}:
            </span>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              {appointmentsByHour[cabinet.id] || 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
