import { useState, useMemo } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, parseISO } from 'date-fns';
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
  Building
} from 'lucide-react';
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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useDoctors, Doctor } from '@/hooks/useDoctors';
import { useCabinets } from '@/hooks/useCabinets';
import { useDoctorShifts, CreateShiftData } from '@/hooks/useDoctorShifts';
import { useDoctorTimeOff, CreateTimeOffData, DoctorTimeOff } from '@/hooks/useDoctorTimeOff';
import { useAuth } from '@/hooks/useAuth';
import { TIME_SLOTS } from '@/types/appointment';

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

  // Debug log
  console.log('DoctorScheduleManagement isAdmin:', isAdmin);
  
  const [doctorFilter, setDoctorFilter] = useState<string>(selectedDoctorId || 'all');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  
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
  
  const { 
    shifts, 
    loading: shiftsLoading,
    createShift,
    deleteShift,
  } = useDoctorShifts(
    doctorFilter !== 'all' ? doctorFilter : undefined,
    { start: format(currentWeekStart, 'yyyy-MM-dd'), end: format(weekEnd, 'yyyy-MM-dd') }
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
    if (doctorFilter === 'all') return doctors;
    return doctors.filter(d => d.id === doctorFilter);
  }, [doctors, doctorFilter]);

  const handlePreviousWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart(prev => addDays(prev, 7));
  };

  const handleAddShift = async () => {
    if (!shiftForm.doctor_id || selectedShiftDates.length === 0) {
      return;
    }
    
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

  const handleAddTimeOff = async () => {
    if (!timeOffForm.doctor_id || !timeOffForm.start_date || !timeOffForm.end_date) {
      return;
    }
    
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
    if (user?.id) {
      await approveTimeOffRequest(request.id, user.id);
    }
  };

  const handleReject = async () => {
    if (rejectingRequest && rejectionReason) {
      await rejectTimeOffRequest(rejectingRequest.id, rejectionReason);
      setRejectDialogOpen(false);
      setRejectingRequest(null);
      setRejectionReason('');
    }
  };

  const getDoctorById = (id: string): Doctor | undefined => {
    return doctors.find(d => d.id === id);
  };

  const getShiftsForDayAndDoctor = (date: Date, doctorId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return shifts.filter(s => s.shift_date === dateStr && s.doctor_id === doctorId);
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

  return (
    <div className="space-y-6">
      <Tabs defaultValue="shifts" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="shifts" className="gap-2">
            <Clock className="h-4 w-4" />
            Schimburi
          </TabsTrigger>
          <TabsTrigger value="timeoff" className="gap-2">
            <Palmtree className="h-4 w-4" />
            Concedii
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shifts" className="space-y-4">
          {/* Shifts Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Toți doctorii" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți doctorii</SelectItem>
                  {doctors.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: d.color }} 
                        />
                        {d.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[180px] text-center">
                {format(currentWeekStart, 'd MMM', { locale: ro })} - {format(weekEnd, 'd MMM yyyy', { locale: ro })}
              </span>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button onClick={() => setShowShiftDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Adaugă schimb
            </Button>
          </div>

          {/* Weekly Schedule Grid */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 text-left font-medium text-sm w-[140px]">Doctor</th>
                      {weekDays.map(day => (
                        <th key={day.toISOString()} className="p-3 text-center font-medium text-sm min-w-[100px]">
                          <div>{format(day, 'EEE', { locale: ro })}</div>
                          <div className="text-muted-foreground">{format(day, 'd MMM')}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDoctors.map(doctor => (
                      <tr key={doctor.id} className="border-b hover:bg-muted/30">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0" 
                              style={{ backgroundColor: doctor.color }} 
                            />
                            <span className="text-sm font-medium truncate">{doctor.name}</span>
                          </div>
                        </td>
                        {weekDays.map(day => {
                          const dayShifts = getShiftsForDayAndDoctor(day, doctor.id);
                          const timeOff = getTimeOffForDay(day, doctor.id);
                          
                          return (
                            <td key={day.toISOString()} className="p-2 text-center align-top">
                              {timeOff ? (
                                <div className="bg-orange-100 dark:bg-orange-900/30 rounded p-1 text-xs text-orange-700 dark:text-orange-300">
                                  <Palmtree className="h-3 w-3 mx-auto mb-1" />
                                  Concediu
                                </div>
                              ) : dayShifts.length > 0 ? (
                                <div className="space-y-1">
                                  {dayShifts.map(shift => (
                                    <div 
                                      key={shift.id}
                                      className="bg-primary/10 rounded p-1 text-xs group relative"
                                    >
                                      <div className="font-medium">
                                        {shift.start_time.slice(0,5)} - {shift.end_time.slice(0,5)}
                                      </div>
                                      {shift.cabinet_id && (
                                        <div className="text-muted-foreground flex items-center justify-center gap-1">
                                          <Building className="h-3 w-3" />
                                          {cabinets.find(c => c.id === shift.cabinet_id)?.name}
                                        </div>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="absolute -top-1 -right-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive/90 hover:bg-destructive text-destructive-foreground"
                                        onClick={() => deleteShift(shift.id)}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-muted-foreground text-xs">-</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeoff" className="space-y-4">
          {/* Time Off Header */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Select value={doctorFilter} onValueChange={setDoctorFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Toți doctorii" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toți doctorii</SelectItem>
                  {doctors.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: d.color }} 
                        />
                        {d.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={() => setShowTimeOffDialog(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Cerere concediu
            </Button>
          </div>

          {/* Time Off Requests List */}
          <div className="grid gap-4">
            {timeOffLoading ? (
              <div className="text-center py-8 text-muted-foreground">Se încarcă...</div>
            ) : timeOffRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Palmtree className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nu există cereri de concediu</p>
                </CardContent>
              </Card>
            ) : (
              timeOffRequests.map(request => {
                const doctor = getDoctorById(request.doctor_id);
                const typeInfo = TIME_OFF_TYPES.find(t => t.value === request.time_off_type);
                const statusInfo = STATUS_BADGES[request.status];
                const TypeIcon = typeInfo?.icon || CalendarIcon;
                
                return (
                  <Card key={request.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: doctor?.color || '#ccc' }}
                          >
                            <TypeIcon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <div className="font-medium">{doctor?.name || 'Doctor necunoscut'}</div>
                            <div className="text-sm text-muted-foreground">
                              {typeInfo?.label}
                            </div>
                            <div className="text-sm mt-1">
                              {format(parseISO(request.start_date), 'd MMM yyyy', { locale: ro })}
                              {request.start_date !== request.end_date && (
                                <> - {format(parseISO(request.end_date), 'd MMM yyyy', { locale: ro })}</>
                              )}
                            </div>
                            {request.reason && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {request.reason}
                              </div>
                            )}
                            {request.rejection_reason && (
                              <div className="text-sm text-red-600 mt-1">
                                Motiv respingere: {request.rejection_reason}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={statusInfo.variant}
                            className={statusInfo.className}
                          >
                            {statusInfo.label}
                          </Badge>
                          
                          {isAdmin && request.status === 'pending' && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                onClick={() => handleApprove(request)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                onClick={() => {
                                  setRejectingRequest(request);
                                  setRejectDialogOpen(true);
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => deleteTimeOffRequest(request.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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
              <Select 
                value={shiftForm.doctor_id} 
                onValueChange={(v) => setShiftForm(prev => ({ ...prev, doctor_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map(d => (
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
                  ) : (
                    'Click pe datele dorite'
                  )}
                </div>
                <Calendar
                  mode="multiple"
                  selected={selectedShiftDates}
                  onSelect={(dates) => {
                    setSelectedShiftDates(dates || []);
                  }}
                  className="pointer-events-auto"
                  numberOfMonths={1}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Click pe fiecare dată dorită (ex: 2, 4, 18)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ora început</Label>
                <Select 
                  value={shiftForm.start_time} 
                  onValueChange={(v) => setShiftForm(prev => ({ ...prev, start_time: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Ora sfârșit</Label>
                <Select 
                  value={shiftForm.end_time} 
                  onValueChange={(v) => setShiftForm(prev => ({ ...prev, end_time: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.filter(t => t > shiftForm.start_time).map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Cabinet (opțional)</Label>
              <Select 
                value={shiftForm.cabinet_id?.toString() || 'none'} 
                onValueChange={(v) => setShiftForm(prev => ({ 
                  ...prev, 
                  cabinet_id: v === 'none' ? null : parseInt(v) 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează cabinet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Fără cabinet</SelectItem>
                  {cabinets.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
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
            <Button variant="outline" onClick={() => setShowShiftDialog(false)}>
              Anulează
            </Button>
            <Button onClick={handleAddShift} disabled={!shiftForm.doctor_id || selectedShiftDates.length === 0}>
              {selectedShiftDates.length > 1 ? `Salvează (${selectedShiftDates.length} zile)` : 'Salvează'}
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
              <Select 
                value={timeOffForm.doctor_id} 
                onValueChange={(v) => setTimeOffForm(prev => ({ ...prev, doctor_id: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează doctor" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map(d => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tip concediu</Label>
              <Select 
                value={timeOffForm.time_off_type} 
                onValueChange={(v) => setTimeOffForm(prev => ({ 
                  ...prev, 
                  time_off_type: v as CreateTimeOffData['time_off_type'] 
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OFF_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
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
                        end_date: prev.end_date < format(date, 'yyyy-MM-dd') 
                          ? format(date, 'yyyy-MM-dd') 
                          : prev.end_date
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
                      onSelect={(date) => date && setTimeOffForm(prev => ({ 
                        ...prev, 
                        end_date: format(date, 'yyyy-MM-dd') 
                      }))}
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
            <Button variant="outline" onClick={() => setShowTimeOffDialog(false)}>
              Anulează
            </Button>
            <Button onClick={handleAddTimeOff} disabled={!timeOffForm.doctor_id}>
              Trimite cerere
            </Button>
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
            <Button variant="outline" onClick={() => {
              setRejectDialogOpen(false);
              setRejectingRequest(null);
              setRejectionReason('');
            }}>
              Anulează
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Respinge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
