import { useState, useMemo } from 'react';
import { format, addDays, addMonths, subMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, parseISO, isSameMonth, isToday, isSameDay } from 'date-fns';
import { ro } from 'date-fns/locale';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight,
  Palmtree,
  Check,
  X,
  AlertCircle,
  Building,
  Copy,
  CalendarDays,
  CalendarRange
} from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useDoctors, Doctor } from '@/hooks/useDoctors';
import { useCabinets } from '@/hooks/useCabinets';
import { useDoctorShifts, CreateShiftData } from '@/hooks/useDoctorShifts';
import { useDoctorTimeOff, CreateTimeOffData, DoctorTimeOff } from '@/hooks/useDoctorTimeOff';
import { useAuth } from '@/contexts/AuthContext';
import { TIME_SLOTS } from '@/types/appointment';
import { toast } from 'sonner';

const TIME_OFF_TYPES = [
  { value: 'vacation', label: 'Concediu de odihnă', icon: Palmtree },
  { value: 'sick_leave', label: 'Concediu medical', icon: AlertCircle },
  { value: 'personal', label: 'Zi liberă personală', icon: CalendarIcon },
  { value: 'other', label: 'Altele', icon: Clock },
];

const STATUS_BADGES = {
  pending: { label: 'În așteptare', variant: 'outline' as const, className: 'border-yellow-500 text-yellow-600' },
  approved: { label: 'Aprobat', variant: 'outline' as const, className: 'border-green-500 text-green-600' },
  rejected: { label: 'Respins', variant: 'outline' as const, className: 'border-red-500 text-red-600' },
};

interface DoctorScheduleManagementProps {
  selectedDoctorId?: string;
  isAdmin?: boolean;
}

export function DoctorScheduleManagement({ 
  selectedDoctorId,
  isAdmin = false,
}: DoctorScheduleManagementProps) {
  const { doctors } = useDoctors();
  const { cabinets } = useCabinets();
  const { user } = useAuth();

  const isMobile = useIsMobile();
  const [doctorFilter, setDoctorFilter] = useState<string>(selectedDoctorId || 'all');
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  
  // Shifts state
  const [showShiftDialog, setShowShiftDialog] = useState(false);
  const [selectedShiftDates, setSelectedShiftDates] = useState<Date[]>([new Date()]);
  const [shiftForm, setShiftForm] = useState<Omit<CreateShiftData, 'shift_date'>>({
    doctor_id: selectedDoctorId || '',
    start_time: '08:00',
    end_time: '16:00',
    cabinet_id: null,
    notes: '',
  });
  
  // Copy week state
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyTargetDate, setCopyTargetDate] = useState<Date | undefined>(undefined);
  
  // Time off state
  const [showTimeOffDialog, setShowTimeOffDialog] = useState(false);
  const [timeOffForm, setTimeOffForm] = useState<CreateTimeOffData>({
    doctor_id: selectedDoctorId || '',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
    time_off_type: 'vacation',
  });
  
  // Rejection dialog
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectingRequest, setRejectingRequest] = useState<DoctorTimeOff | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  
  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  
  // Month calendar days (6 weeks grid)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthCalendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthCalendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: monthCalendarStart, end: monthCalendarEnd });

  // Determine date range for data fetching
  const dateRange = viewMode === 'week' 
    ? { start: format(currentWeekStart, 'yyyy-MM-dd'), end: format(weekEnd, 'yyyy-MM-dd') }
    : { start: format(monthCalendarStart, 'yyyy-MM-dd'), end: format(monthCalendarEnd, 'yyyy-MM-dd') };
  
  const { 
    shifts, 
    loading: shiftsLoading,
    createShift,
    deleteShift,
  } = useDoctorShifts(
    doctorFilter !== 'all' ? doctorFilter : undefined,
    dateRange
  );
  
  const {
    timeOffRequests,
    loading: timeOffLoading,
    createTimeOffRequest,
    approveTimeOffRequest,
    rejectTimeOffRequest,
    deleteTimeOffRequest,
  } = useDoctorTimeOff(
    doctorFilter !== 'all' ? doctorFilter : undefined
  );

  const filteredDoctors = useMemo(() => {
    const active = doctors.filter(d => d.is_active);
    if (doctorFilter === 'all') return active;
    return active.filter(d => d.id === doctorFilter);
  }, [doctors, doctorFilter]);

  const handlePreviousWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
  const handlePreviousMonth = () => setCurrentMonth(prev => subMonths(prev, 1));
  const handleNextMonth = () => setCurrentMonth(prev => addMonths(prev, 1));

  const handleAddShift = async () => {
    if (!shiftForm.doctor_id || selectedShiftDates.length === 0) return;
    
    let successCount = 0;
    for (const day of selectedShiftDates) {
      const shiftData: CreateShiftData = {
        ...shiftForm,
        shift_date: format(day, 'yyyy-MM-dd'),
      };
      const result = await createShift(shiftData);
      if (result) successCount++;
    }
    
    if (successCount > 0) {
      setShowShiftDialog(false);
      setSelectedShiftDates([new Date()]);
      setShiftForm({
        doctor_id: selectedDoctorId || '',
        start_time: '08:00',
        end_time: '16:00',
        cabinet_id: null,
        notes: '',
      });
    }
  };

  const handleCopyWeek = async () => {
    if (!copyTargetDate) return;
    
    const targetWeekStart = startOfWeek(copyTargetDate, { weekStartsOn: 1 });
    let successCount = 0;
    
    for (const shift of shifts) {
      const shiftDate = parseISO(shift.shift_date);
      const dayOfWeek = (shiftDate.getDay() + 6) % 7; // Monday = 0
      const targetDate = addDays(targetWeekStart, dayOfWeek);
      
      const result = await createShift({
        doctor_id: shift.doctor_id,
        shift_date: format(targetDate, 'yyyy-MM-dd'),
        start_time: shift.start_time,
        end_time: shift.end_time,
        cabinet_id: shift.cabinet_id,
        notes: shift.notes,
      });
      if (result) successCount++;
    }
    
    if (successCount > 0) {
      toast.success(`${successCount} schimburi copiate cu succes`);
      setShowCopyDialog(false);
      setCopyTargetDate(undefined);
    }
  };

  const handleAddTimeOff = async () => {
    if (!timeOffForm.doctor_id || !timeOffForm.start_date || !timeOffForm.end_date) return;
    
    const result = await createTimeOffRequest(timeOffForm);
    if (result) {
      setShowTimeOffDialog(false);
      setTimeOffForm({
        doctor_id: selectedDoctorId || '',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
        time_off_type: 'vacation',
      });
    }
  };

  const handleApprove = async (request: DoctorTimeOff) => {
    if (user?.id) await approveTimeOffRequest(request.id, user.id);
  };

  const handleReject = async () => {
    if (rejectingRequest && rejectionReason) {
      await rejectTimeOffRequest(rejectingRequest.id, rejectionReason);
      setRejectDialogOpen(false);
      setRejectingRequest(null);
      setRejectionReason('');
    }
  };

  const getDoctorById = (id: string): Doctor | undefined => doctors.find(d => d.id === id);

  const getShiftsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(s => s.shift_date === dateStr);
  };

  const getTimeOffForDay = (date: Date, doctorId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return timeOffRequests.find(r => 
      r.doctor_id === doctorId &&
      r.status === 'approved' &&
      dateStr >= r.start_date &&
      dateStr <= r.end_date
    );
  };

  const renderDayCell = (day: Date, isMonthView = false) => {
    const dayShifts = getShiftsForDay(day);
    const today = isToday(day);
    const inCurrentMonth = isMonthView ? isSameMonth(day, currentMonth) : true;
    
    return (
      <div
        key={day.toISOString()}
        className={cn(
      "border border-border/50 p-1 sm:p-2 transition-colors",
          isMonthView ? "min-h-[80px] sm:min-h-[120px]" : "min-h-[100px] sm:min-h-[160px]",
          !inCurrentMonth && "bg-muted/20",
          today && "bg-primary/5 ring-1 ring-primary/30 ring-inset",
        )}
      >
        <div className={cn(
          "text-sm font-medium mb-1.5 flex items-center justify-between",
          today ? "text-primary" : !inCurrentMonth ? "text-muted-foreground/50" : "text-muted-foreground"
        )}>
          <span className={cn(
            "inline-flex items-center justify-center",
            today && "bg-primary text-primary-foreground rounded-full w-6 h-6 text-xs"
          )}>
            {format(day, 'd')}
          </span>
          {!isMonthView && (
            <span className="text-xs uppercase tracking-wider">
              {format(day, 'EEE', { locale: ro })}
            </span>
          )}
        </div>
        
        <div className="space-y-1">
          {dayShifts.map(shift => {
            const doctor = getDoctorById(shift.doctor_id);
            const timeOff = doctor ? getTimeOffForDay(day, doctor.id) : null;
            const cabinetName = shift.cabinet_id 
              ? cabinets.find(c => c.id === shift.cabinet_id)?.name 
              : null;
            
            if (timeOff) return null;
            
            return (
              <TooltipProvider key={shift.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                     className={cn(
                        "rounded-md px-1.5 sm:px-2 py-1 sm:py-1.5 text-xs sm:text-sm leading-snug cursor-default group relative",
                        "transition-all hover:ring-1 hover:ring-offset-1",
                        isMonthView ? "truncate" : ""
                      )}
                      style={{ 
                        backgroundColor: `${doctor?.color || '#888'}20`,
                        borderLeft: `4px solid ${doctor?.color || '#888'}`,
                        color: doctor?.color || '#888',
                      }}
                    >
                      <div className="font-semibold truncate" style={{ color: 'var(--foreground)' }}>
                        {doctor?.name?.replace('Dr. ', '')}
                      </div>
                      {!isMonthView && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {shift.start_time.slice(0,5)} - {shift.end_time.slice(0,5)}
                          {cabinetName && <span className="ml-1 opacity-70">• {cabinetName}</span>}
                        </div>
                      )}
                      {isMonthView && (
                        <div className="text-xs text-muted-foreground">
                          {shift.start_time.slice(0,5)}-{shift.end_time.slice(0,5)}
                        </div>
                      )}
                      
                      {isAdmin && (
                        <button
                          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteShift(shift.id);
                          }}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">
                    <p className="font-semibold">{doctor?.name}</p>
                    <p>{shift.start_time.slice(0,5)} - {shift.end_time.slice(0,5)}</p>
                    {cabinetName && <p>{cabinetName}</p>}
                    {shift.notes && <p className="italic">{shift.notes}</p>}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
          
          {/* Show time off indicators */}
          {filteredDoctors.map(doctor => {
            const timeOff = getTimeOffForDay(day, doctor.id);
            if (!timeOff) return null;
            return (
              <div
                key={`off-${doctor.id}`}
                className="rounded-md px-2 py-1.5 text-sm leading-snug bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 truncate"
              >
                <span className="font-semibold">{doctor.name?.replace('Dr. ', '')}</span>
                <span className="ml-1 opacity-70">• Concediu</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="shifts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-xs">
          <TabsTrigger value="shifts" className="gap-1.5 text-xs sm:text-sm">
            <Clock className="h-3.5 w-3.5" />
            Schimburi
          </TabsTrigger>
          <TabsTrigger value="timeoff" className="gap-1.5 text-xs sm:text-sm">
            <Palmtree className="h-3.5 w-3.5" />
            Concedii
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shifts" className="space-y-3 mt-3">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Doctor filter */}
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Toți doctorii" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toți doctorii</SelectItem>
                {doctors.filter(d => d.is_active).map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('week')}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1",
                  viewMode === 'week' ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                )}
              >
                <CalendarDays className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Săptămână</span>
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={cn(
                  "px-2.5 py-1.5 text-xs font-medium transition-colors flex items-center gap-1",
                  viewMode === 'month' ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"
                )}
              >
                <CalendarRange className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lună</span>
              </button>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-9 w-9" 
                onClick={viewMode === 'week' ? handlePreviousWeek : handlePreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[140px] sm:min-w-[180px] text-center">
                {viewMode === 'week' 
                  ? `${format(currentWeekStart, 'd MMM', { locale: ro })} - ${format(weekEnd, 'd MMM yyyy', { locale: ro })}`
                  : format(currentMonth, 'MMMM yyyy', { locale: ro })
                }
              </span>
              <Button variant="outline" size="icon" className="h-9 w-9"
                onClick={viewMode === 'week' ? handleNextWeek : handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 ml-auto">
              {/* Copy week */}
              {viewMode === 'week' && shifts.length > 0 && (
                <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs" onClick={() => setShowCopyDialog(true)}>
                  <Copy className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Copiază săptămâna</span>
                </Button>
              )}
              
              {/* Add shift */}
              <Button size="sm" className="gap-1.5 h-9 text-xs" onClick={() => setShowShiftDialog(true)}>
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Adaugă schimb</span>
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          {viewMode === 'week' ? (
            isMobile ? (
              /* Mobile: vertical list of days */
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {weekDays.map(day => {
                    const dayShifts = getShiftsForDay(day);
                    const today = isToday(day);
                    return (
                      <div key={day.toISOString()} className={cn(
                        "border-b last:border-b-0 p-3",
                        today && "bg-primary/5"
                      )}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={cn(
                            "inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                            today ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                          )}>
                            {format(day, 'd')}
                          </span>
                          <span className={cn(
                            "text-sm font-medium uppercase",
                            today ? "text-primary" : "text-muted-foreground"
                          )}>
                            {format(day, 'EEEE', { locale: ro })}
                          </span>
                        </div>
                        <div className="space-y-1.5 pl-10">
                          {dayShifts.length === 0 && (
                            <p className="text-xs text-muted-foreground italic">Fără schimburi</p>
                          )}
                          {dayShifts.map(shift => {
                            const doctor = getDoctorById(shift.doctor_id);
                            const timeOff = doctor ? getTimeOffForDay(day, doctor.id) : null;
                            const cabinetName = shift.cabinet_id
                              ? cabinets.find(c => c.id === shift.cabinet_id)?.name
                              : null;
                            if (timeOff) return null;
                            return (
                              <div
                                key={shift.id}
                                className="rounded-md px-2.5 py-1.5 text-sm leading-snug group relative"
                                style={{
                                  backgroundColor: `${doctor?.color || '#888'}20`,
                                  borderLeft: `4px solid ${doctor?.color || '#888'}`,
                                }}
                              >
                                <div className="font-semibold">{doctor?.name?.replace('Dr. ', '')}</div>
                                <div className="text-xs text-muted-foreground">
                                  {shift.start_time.slice(0,5)} - {shift.end_time.slice(0,5)}
                                  {cabinetName && <span className="ml-1 opacity-70">• {cabinetName}</span>}
                                </div>
                                {isAdmin && (
                                  <button
                                    className="absolute top-1 right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => deleteShift(shift.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              /* Desktop: 7-column grid */
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Week header */}
                  <div className="grid grid-cols-7 border-b bg-muted/30">
                    {weekDays.map(day => (
                      <div key={day.toISOString()} className={cn(
                        "px-3 py-3 text-center font-medium border-r last:border-r-0",
                        isToday(day) ? "text-primary bg-primary/5" : "text-muted-foreground"
                      )}>
                        <div className="uppercase tracking-wider text-xs">{format(day, 'EEE', { locale: ro })}</div>
                        <div className={cn(
                          "text-2xl font-bold mt-0.5",
                          isToday(day) ? "text-primary" : "text-foreground"
                        )}>
                          {format(day, 'd')}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Week body */}
                  <div className="grid grid-cols-7">
                    {weekDays.map(day => renderDayCell(day, false))}
                  </div>
                </CardContent>
              </Card>
            )
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                {/* Month header */}
                <div className="grid grid-cols-7 border-b bg-muted/30">
                  {['Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm', 'Dum'].map(day => (
                    <div key={day} className="px-2 py-1.5 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider border-r last:border-r-0">
                      {day}
                    </div>
                  ))}
                </div>
                {/* Month grid */}
                <div className="grid grid-cols-7">
                  {monthDays.map(day => renderDayCell(day, true))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 px-1">
            {filteredDoctors.map(doctor => (
              <div key={doctor.id} className="flex items-center gap-1.5 text-xs">
                <div className="w-3 h-3 rounded" style={{ 
                  backgroundColor: `${doctor.color}20`,
                  borderLeft: `3px solid ${doctor.color}` 
                }} />
                <span className="text-muted-foreground">{doctor.name}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="timeoff" className="space-y-3 mt-3">
          {/* Time Off Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Select value={doctorFilter} onValueChange={setDoctorFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs sm:text-sm">
                <SelectValue placeholder="Toți doctorii" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toți doctorii</SelectItem>
                {doctors.filter(d => d.is_active).map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button size="sm" className="gap-1.5 h-9 text-xs" onClick={() => setShowTimeOffDialog(true)}>
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cerere concediu</span>
            </Button>
          </div>

          {/* Time Off Requests List */}
          <div className="grid gap-3">
            {timeOffLoading ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Se încarcă...</div>
            ) : timeOffRequests.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-muted-foreground">
                  <Palmtree className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nu există cereri de concediu</p>
                </CardContent>
              </Card>
            ) : (
              timeOffRequests.map(request => {
                const doctor = getDoctorById(request.doctor_id);
                const typeInfo = TIME_OFF_TYPES.find(t => t.value === request.time_off_type);
                const statusInfo = STATUS_BADGES[request.status];
                const TypeIcon = typeInfo?.icon || CalendarIcon;
                
                return (
                  <Card key={request.id} className="overflow-hidden">
                    <div 
                      className="h-1" 
                      style={{ backgroundColor: doctor?.color || '#ccc' }} 
                    />
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div 
                            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: `${doctor?.color || '#ccc'}20` }}
                          >
                            <TypeIcon className="h-4 w-4" style={{ color: doctor?.color || '#ccc' }} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm">{doctor?.name || 'Doctor necunoscut'}</div>
                            <div className="text-xs text-muted-foreground">{typeInfo?.label}</div>
                            <div className="text-xs mt-1 font-medium">
                              {format(parseISO(request.start_date), 'd MMM yyyy', { locale: ro })}
                              {request.start_date !== request.end_date && (
                                <> → {format(parseISO(request.end_date), 'd MMM yyyy', { locale: ro })}</>
                              )}
                            </div>
                            {request.reason && (
                              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{request.reason}</div>
                            )}
                            {request.rejection_reason && (
                              <div className="text-xs text-red-600 mt-1">Motiv: {request.rejection_reason}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <Badge variant={statusInfo.variant} className={cn(statusInfo.className, "text-[10px] px-1.5")}>
                            {statusInfo.label}
                          </Badge>
                          
                          {isAdmin && request.status === 'pending' && (
                            <>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-100"
                                onClick={() => handleApprove(request)}>
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() => { setRejectingRequest(request); setRejectDialogOpen(true); }}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </>
                          )}
                          
                          {isAdmin && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => deleteTimeOffRequest(request.id)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Shift Dialog */}
      <Dialog open={showShiftDialog} onOpenChange={setShowShiftDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adaugă schimb</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={shiftForm.doctor_id} onValueChange={(v) => setShiftForm(prev => ({ ...prev, doctor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selectează doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.filter(d => d.is_active).map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date selectate</Label>
              <div className="border rounded-lg p-3 bg-background flex flex-col items-center">
                <div className="text-sm text-muted-foreground mb-2 text-center min-h-[24px]">
                  {selectedShiftDates.length > 0 ? (
                    <span className="font-medium text-foreground">
                      {selectedShiftDates
                        .sort((a, b) => a.getTime() - b.getTime())
                        .map(d => format(d, 'd MMM', { locale: ro }))
                        .join(', ')}
                    </span>
                  ) : 'Click pe datele dorite'}
                </div>
                <Calendar
                  mode="multiple"
                  selected={selectedShiftDates}
                  onSelect={(dates) => setSelectedShiftDates(dates || [])}
                  className="pointer-events-auto"
                  numberOfMonths={1}
                />
              </div>
              <p className="text-xs text-muted-foreground">Click pe fiecare dată dorită</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ora început</Label>
                <Select value={shiftForm.start_time} onValueChange={(v) => setShiftForm(prev => ({ ...prev, start_time: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ora sfârșit</Label>
                <Select value={shiftForm.end_time} onValueChange={(v) => setShiftForm(prev => ({ ...prev, end_time: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.filter(t => t > shiftForm.start_time).map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cabinet (opțional)</Label>
              <Select value={shiftForm.cabinet_id?.toString() || 'none'} onValueChange={(v) => setShiftForm(prev => ({ ...prev, cabinet_id: v === 'none' ? null : parseInt(v) }))}>
                <SelectTrigger><SelectValue placeholder="Selectează cabinet" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fără cabinet</SelectItem>
                  {cabinets.map(c => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Note (opțional)</Label>
              <Textarea
                value={shiftForm.notes || ''}
                onChange={(e) => setShiftForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Note despre schimb..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowShiftDialog(false)}>Anulează</Button>
            <Button onClick={handleAddShift} disabled={!shiftForm.doctor_id || selectedShiftDates.length === 0}>
              {selectedShiftDates.length > 1 ? `Salvează (${selectedShiftDates.length} zile)` : 'Salvează'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Copy Week Dialog */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copiază programul săptămânii</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Se vor copia {shifts.length} schimburi din săptămâna {format(currentWeekStart, 'd MMM', { locale: ro })} - {format(weekEnd, 'd MMM', { locale: ro })} în săptămâna selectată.
            </p>
            <div className="space-y-2">
              <Label>Selectează săptămâna destinație</Label>
              <div className="border rounded-lg p-3 bg-background flex flex-col items-center">
                <Calendar
                  mode="single"
                  selected={copyTargetDate}
                  onSelect={setCopyTargetDate}
                  className="pointer-events-auto"
                  numberOfMonths={1}
                />
              </div>
              {copyTargetDate && (
                <p className="text-xs text-center font-medium">
                  Săptămâna: {format(startOfWeek(copyTargetDate, { weekStartsOn: 1 }), 'd MMM', { locale: ro })} - {format(endOfWeek(copyTargetDate, { weekStartsOn: 1 }), 'd MMM yyyy', { locale: ro })}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCopyDialog(false); setCopyTargetDate(undefined); }}>Anulează</Button>
            <Button onClick={handleCopyWeek} disabled={!copyTargetDate} className="gap-1.5">
              <Copy className="h-3.5 w-3.5" />
              Copiază
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Time Off Dialog */}
      <Dialog open={showTimeOffDialog} onOpenChange={setShowTimeOffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerere concediu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Doctor</Label>
              <Select value={timeOffForm.doctor_id} onValueChange={(v) => setTimeOffForm(prev => ({ ...prev, doctor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selectează doctor" /></SelectTrigger>
                <SelectContent>
                  {doctors.filter(d => d.is_active).map(d => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tip concediu</Label>
              <Select value={timeOffForm.time_off_type} onValueChange={(v) => setTimeOffForm(prev => ({ ...prev, time_off_type: v as CreateTimeOffData['time_off_type'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIME_OFF_TYPES.map(t => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data început</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(parseISO(timeOffForm.start_date), 'd MMM', { locale: ro })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseISO(timeOffForm.start_date)}
                      onSelect={(date) => date && setTimeOffForm(prev => ({ 
                        ...prev, 
                        start_date: format(date, 'yyyy-MM-dd'),
                        end_date: prev.end_date < format(date, 'yyyy-MM-dd') ? format(date, 'yyyy-MM-dd') : prev.end_date
                      }))}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Data sfârșit</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(parseISO(timeOffForm.end_date), 'd MMM', { locale: ro })}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={parseISO(timeOffForm.end_date)}
                      onSelect={(date) => date && setTimeOffForm(prev => ({ ...prev, end_date: format(date, 'yyyy-MM-dd') }))}
                      disabled={(date) => date < parseISO(timeOffForm.start_date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Motiv (opțional)</Label>
              <Textarea
                value={timeOffForm.reason || ''}
                onChange={(e) => setTimeOffForm(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Motivul cererii..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTimeOffDialog(false)}>Anulează</Button>
            <Button onClick={handleAddTimeOff} disabled={!timeOffForm.doctor_id}>Trimite cerere</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Respinge cererea</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motivul respingerii</Label>
              <Textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Introduceți motivul respingerii..."
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectDialogOpen(false); setRejectingRequest(null); setRejectionReason(''); }}>Anulează</Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim()}>Respinge</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
