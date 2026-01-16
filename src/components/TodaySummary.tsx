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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">{todayAppointments.length}</p>
            <p className="text-xs text-muted-foreground">Programări azi</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <Clock className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-2xl font-bold text-foreground">
              {hours > 0 ? `${hours}h ` : ''}{minutes > 0 ? `${minutes}m` : hours === 0 ? '0m' : ''}
            </p>
            <p className="text-xs text-muted-foreground">Timp total programat</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-card border border-border p-4 shadow-sm sm:col-span-2">
        <p className="text-xs font-medium text-muted-foreground mb-3">Per cabinet</p>
        <div className="flex flex-wrap gap-2">
          {CABINETS.map((cabinet) => (
            <div
              key={cabinet.id}
              className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5"
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full",
                  cabinetBgColors[cabinet.id]
                )}
              />
              <span className="text-sm font-medium text-foreground">
                {cabinet.name}:
              </span>
              <span className="text-sm text-muted-foreground">
                {appointmentsByHour[cabinet.id] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
