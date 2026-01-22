import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Search, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { TIME_SLOTS, Appointment } from '@/types/appointment';
import { Cabinet } from '@/hooks/useCabinets';

interface AvailableSlotsSearchProps {
  appointments: Appointment[];
  cabinets: Cabinet[];
  onSlotSelect?: (date: Date, time: string, cabinetId: number) => void;
}

interface AvailableSlot {
  time: string;
  endTime: string;
  cabinetId: number;
  cabinetName: string;
}

export function AvailableSlotsSearch({
  appointments,
  cabinets,
  onSlotSelect,
}: AvailableSlotsSearchProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [minDuration, setMinDuration] = useState(30);
  const [selectedCabinet, setSelectedCabinet] = useState<string>('all');

  // Convert time string to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Convert minutes to time string
  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  };

  // Get available end times (must be after start time)
  const getAvailableEndTimes = (start: string): string[] => {
    const startIndex = TIME_SLOTS.indexOf(start);
    return TIME_SLOTS.slice(startIndex + 1);
  };

  // Find available slots for the selected date and time range
  const availableSlots = useMemo(() => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    
    const dayAppointments = appointments.filter(apt => apt.date === dateStr);
    const filteredCabinets = selectedCabinet === 'all' 
      ? cabinets 
      : cabinets.filter(c => c.id === parseInt(selectedCabinet));
    
    const slots: AvailableSlot[] = [];
    
    filteredCabinets.forEach(cabinet => {
      const cabinetAppointments = dayAppointments
        .filter(apt => apt.cabinetId === cabinet.id && apt.status !== 'cancelled')
        .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
      
      // Find gaps in the schedule
      let currentMinutes = startMinutes;
      
      cabinetAppointments.forEach(apt => {
        const aptStart = timeToMinutes(apt.time);
        const aptEnd = aptStart + (apt.duration || 30);
        
        // If there's a gap before this appointment
        if (aptStart > currentMinutes && aptStart <= endMinutes) {
          const gapEnd = Math.min(aptStart, endMinutes);
          const gapDuration = gapEnd - currentMinutes;
          
          if (gapDuration >= minDuration) {
            slots.push({
              time: minutesToTime(currentMinutes),
              endTime: minutesToTime(gapEnd),
              cabinetId: cabinet.id,
              cabinetName: cabinet.name,
            });
          }
        }
        
        // Move current pointer to end of this appointment
        currentMinutes = Math.max(currentMinutes, aptEnd);
      });
      
      // Check for remaining time after last appointment
      if (currentMinutes < endMinutes) {
        const remainingDuration = endMinutes - currentMinutes;
        if (remainingDuration >= minDuration) {
          slots.push({
            time: minutesToTime(currentMinutes),
            endTime: minutesToTime(endMinutes),
            cabinetId: cabinet.id,
            cabinetName: cabinet.name,
          });
        }
      }
    });
    
    // Sort by time, then by cabinet
    return slots.sort((a, b) => {
      const timeDiff = timeToMinutes(a.time) - timeToMinutes(b.time);
      if (timeDiff !== 0) return timeDiff;
      return a.cabinetId - b.cabinetId;
    });
  }, [selectedDate, startTime, endTime, minDuration, selectedCabinet, appointments, cabinets]);

  const handleSlotClick = (slot: AvailableSlot) => {
    if (onSlotSelect) {
      onSlotSelect(selectedDate, slot.time, slot.cabinetId);
      setOpen(false);
    }
  };

  const calculateSlotDuration = (slot: AvailableSlot): number => {
    return timeToMinutes(slot.endTime) - timeToMinutes(slot.time);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Search className="h-4 w-4" />
          Caută sloturi libere
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Caută programări libere
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Date Picker */}
            <div className="space-y-1.5">
              <Label className="text-xs">Data</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal h-9"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    <span className="truncate">{format(selectedDate, 'dd.MM.yyyy')}</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => date && setSelectedDate(date)}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Time Range */}
            <div className="space-y-1.5">
              <Label className="text-xs">Interval orar</Label>
              <div className="flex items-center gap-1">
                <Select value={startTime} onValueChange={(v) => {
                  setStartTime(v);
                  if (timeToMinutes(v) >= timeToMinutes(endTime)) {
                    const newEndIndex = TIME_SLOTS.indexOf(v) + 1;
                    if (newEndIndex < TIME_SLOTS.length) {
                      setEndTime(TIME_SLOTS[newEndIndex]);
                    }
                  }
                }}>
                  <SelectTrigger className="h-9 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-[100]">
                    {TIME_SLOTS.slice(0, -1).map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground">-</span>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="h-9 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-[100]">
                    {getAvailableEndTimes(startTime).map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Minimum Duration */}
            <div className="space-y-1.5">
              <Label className="text-xs">Durată minimă</Label>
              <Select value={String(minDuration)} onValueChange={(v) => setMinDuration(parseInt(v))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-[100]">
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                  <SelectItem value="120">120 min</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cabinet Filter */}
            <div className="space-y-1.5">
              <Label className="text-xs">Cabinet</Label>
              <Select value={selectedCabinet} onValueChange={setSelectedCabinet}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-[100]">
                  <SelectItem value="all">Toate cabinetele</SelectItem>
                  {cabinets.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results */}
          <div className="border rounded-lg">
            <div className="px-3 py-2 bg-muted/50 border-b">
              <p className="text-sm font-medium">
                {availableSlots.length} sloturi disponibile pentru {format(selectedDate, 'dd MMMM yyyy', { locale: ro })}
              </p>
            </div>
            <ScrollArea className="h-[300px]">
              {availableSlots.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nu există sloturi libere pentru criteriile selectate</p>
                  <p className="text-xs mt-1">Încearcă să modifici intervalul orar sau durata minimă</p>
                </div>
              ) : (
                <div className="divide-y">
                  {availableSlots.map((slot, index) => (
                    <button
                      key={`${slot.cabinetId}-${slot.time}-${index}`}
                      onClick={() => handleSlotClick(slot)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <Clock className="h-4 w-4 text-primary" />
                          <span className="font-medium">{slot.time} - {slot.endTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span className="text-sm">{slot.cabinetName}</span>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {calculateSlotDuration(slot)} min disponibile
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
