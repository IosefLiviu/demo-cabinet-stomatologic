import { format, addDays, subDays } from 'date-fns';
import { ro } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DateNavigator({ selectedDate, onDateChange }: DateNavigatorProps) {
  const goToPreviousDay = () => onDateChange(subDays(selectedDate, 1));
  const goToNextDay = () => onDateChange(addDays(selectedDate, 1));
  const goToToday = () => onDateChange(new Date());

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={goToPreviousDay}
        className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "justify-center gap-1.5 sm:gap-2 font-medium text-xs sm:text-sm px-2 sm:px-3",
              isToday && "border-primary text-primary"
            )}
          >
            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="capitalize whitespace-nowrap">
              <span className="hidden sm:inline">{format(selectedDate, 'EEEE, d MMMM yyyy', { locale: ro })}</span>
              <span className="sm:hidden">{format(selectedDate, 'd MMM yyyy', { locale: ro })}</span>
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <CalendarComponent
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && onDateChange(date)}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>

      <Button
        variant="outline"
        size="icon"
        onClick={goToNextDay}
        className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {!isToday && (
        <Button variant="secondary" size="sm" onClick={goToToday} className="text-xs sm:text-sm shrink-0">
          Astăzi
        </Button>
      )}
    </div>
  );
}
