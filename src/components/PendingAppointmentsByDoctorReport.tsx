import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Clock, Download, Search, User, Phone, Calendar as CalendarIcon, MapPin, UserCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { AppointmentDB } from '@/hooks/useAppointmentsDB';
import { useDoctors } from '@/hooks/useDoctors';
import * as XLSX from 'xlsx';

interface PendingAppointmentsByDoctorReportProps {
  appointments: AppointmentDB[];
  dateRange: { from: Date; to: Date };
}

interface DoctorStats {
  id: string;
  name: string;
  color: string;
  scheduledCount: number;
  confirmedCount: number;
  totalPending: number;
  totalRevenue: number;
  appointments: AppointmentDB[];
}

export function PendingAppointmentsByDoctorReport({ appointments, dateRange: initialDateRange }: PendingAppointmentsByDoctorReportProps) {
  const { doctors } = useDoctors();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [expandedDoctor, setExpandedDoctor] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('month');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(initialDateRange);

  const handlePeriodChange = (newPeriod: 'week' | 'month' | 'custom') => {
    setPeriod(newPeriod);
    let from: Date, to: Date;
    
    if (newPeriod === 'week') {
      from = startOfWeek(new Date(), { weekStartsOn: 1 });
      to = endOfWeek(new Date(), { weekStartsOn: 1 });
    } else if (newPeriod === 'month') {
      from = startOfMonth(new Date());
      to = endOfMonth(new Date());
    } else {
      return;
    }
    
    setDateRange({ from, to });
  };

  const handleDateRangeChange = (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      setDateRange({ from: range.from, to: range.to });
      setPeriod('custom');
    }
  };

  // Filter pending appointments (not completed, not cancelled, not no_show) and by date range
  const pendingAppointments = useMemo(() => {
    return appointments
      .filter(a => ['scheduled', 'confirmed', 'in_progress'].includes(a.status))
      .filter(a => {
        // Filter by date range
        const aptDate = new Date(a.appointment_date);
        return aptDate >= dateRange.from && aptDate <= dateRange.to;
      })
      .filter(a => {
        if (!searchTerm) return true;
        const patientName = a.patients 
          ? `${a.patients.first_name} ${a.patients.last_name}`.toLowerCase() 
          : '';
        const phone = a.patients?.phone || '';
        return patientName.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
      })
      .sort((a, b) => {
        const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      });
  }, [appointments, searchTerm, dateRange]);

  // Group by doctor
  const doctorStats = useMemo(() => {
    const stats: Record<string, DoctorStats> = {};

    // Initialize with all doctors
    doctors.forEach(doc => {
      stats[doc.id] = {
        id: doc.id,
        name: doc.name,
        color: doc.color,
        scheduledCount: 0,
        confirmedCount: 0,
        totalPending: 0,
        totalRevenue: 0,
        appointments: [],
      };
    });

    // Add "Fără doctor" category
    stats['no-doctor'] = {
      id: 'no-doctor',
      name: 'Fără doctor asignat',
      color: '#9CA3AF',
      scheduledCount: 0,
      confirmedCount: 0,
      totalPending: 0,
      totalRevenue: 0,
      appointments: [],
    };

    pendingAppointments.forEach(apt => {
      const doctorId = apt.doctor_id || 'no-doctor';
      
      if (!stats[doctorId]) {
        const doctorInfo = apt.doctors;
        stats[doctorId] = {
          id: doctorId,
          name: doctorInfo?.name || 'Doctor necunoscut',
          color: doctorInfo?.color || '#6B7280',
          scheduledCount: 0,
          confirmedCount: 0,
          totalPending: 0,
          totalRevenue: 0,
          appointments: [],
        };
      }

      stats[doctorId].appointments.push(apt);
      stats[doctorId].totalPending += 1;
      stats[doctorId].totalRevenue += apt.price || 0;

      if (apt.status === 'scheduled') {
        stats[doctorId].scheduledCount += 1;
      } else if (apt.status === 'confirmed' || apt.status === 'in_progress') {
        stats[doctorId].confirmedCount += 1;
      }
    });

    return Object.values(stats)
      .filter(s => s.totalPending > 0 || selectedDoctorId === s.id)
      .sort((a, b) => b.totalPending - a.totalPending);
  }, [pendingAppointments, doctors, selectedDoctorId]);

  // Filter by selected doctor
  const filteredDoctorStats = useMemo(() => {
    if (selectedDoctorId === 'all') return doctorStats;
    return doctorStats.filter(s => s.id === selectedDoctorId);
  }, [doctorStats, selectedDoctorId]);

  // Summary stats
  const summary = useMemo(() => {
    return {
      totalPending: pendingAppointments.length,
      totalRevenue: pendingAppointments.reduce((sum, a) => sum + (a.price || 0), 0),
      doctorsWithPending: doctorStats.filter(s => s.totalPending > 0).length,
    };
  }, [pendingAppointments, doctorStats]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Programat</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Confirmat</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">În desfășurare</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    const data = [
      ['Raport Programări Nefinalizate pe Doctori', '', '', '', '', '', '', ''],
      ['Perioadă', `${format(dateRange.from, 'dd.MM.yyyy')} - ${format(dateRange.to, 'dd.MM.yyyy')}`, '', '', '', '', '', ''],
      ['Total programări nefinalizate', summary.totalPending.toString(), '', '', '', '', '', ''],
      ['Venit potențial', `${summary.totalRevenue.toLocaleString()} RON`, '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['Doctor', 'Data', 'Ora', 'Pacient', 'Telefon', 'Cabinet', 'Status', 'Preț (RON)'],
    ];

    filteredDoctorStats.forEach(doctor => {
      doctor.appointments.forEach(apt => {
        data.push([
          doctor.name,
          format(new Date(apt.appointment_date), 'dd.MM.yyyy'),
          apt.start_time.slice(0, 5),
          apt.patients ? `${apt.patients.first_name} ${apt.patients.last_name}` : 'N/A',
          apt.patients?.phone || 'N/A',
          `Cabinet ${apt.cabinet_id}`,
          apt.status === 'scheduled' ? 'Programat' :
            apt.status === 'confirmed' ? 'Confirmat' :
            apt.status === 'in_progress' ? 'În desfășurare' : apt.status,
          (apt.price || 0).toString(),
        ]);
      });
    });

    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet['!cols'] = [
      { wch: 25 }, { wch: 12 }, { wch: 8 }, { wch: 25 }, 
      { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Nefinalizate');

    const filename = `Programari_Nefinalizate_${format(dateRange.from, 'dd-MM-yyyy')}_${format(dateRange.to, 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Nefinalizate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPending}</div>
            <p className="text-xs text-muted-foreground">programări în așteptare</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Venit Potențial</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalRevenue.toLocaleString()} RON</div>
            <p className="text-xs text-muted-foreground">din programări active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Doctori cu Programări</CardTitle>
            <UserCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.doctorsWithPending}</div>
            <p className="text-xs text-muted-foreground">doctori activi</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medie / Doctor</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.doctorsWithPending > 0 
                ? Math.round(summary.totalPending / summary.doctorsWithPending) 
                : 0}
            </div>
            <p className="text-xs text-muted-foreground">programări / doctor</p>
          </CardContent>
        </Card>
      </div>

      {/* Period Selector and Filters */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Period buttons */}
        <div className="flex gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('week')}
          >
            Săptămâna curentă
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => handlePeriodChange('month')}
          >
            Luna curentă
          </Button>
        </div>

        {/* Date range picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(dateRange.from, 'dd MMM', { locale: ro })} - {format(dateRange.to, 'dd MMM yyyy', { locale: ro })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 z-50" align="start" sideOffset={5}>
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => range && handleDateRangeChange(range)}
              numberOfMonths={2}
              locale={ro}
              weekStartsOn={1}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută pacient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Toți doctorii" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toți doctorii</SelectItem>
            {doctors.map(doc => (
              <SelectItem key={doc.id} value={doc.id}>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: doc.color }} 
                  />
                  {doc.name}
                </div>
              </SelectItem>
            ))}
            <SelectItem value="no-doctor">Fără doctor asignat</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" className="gap-2 ml-auto" onClick={exportToExcel}>
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Doctor Cards with Appointments */}
      <div className="space-y-4">
        {filteredDoctorStats.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium text-green-600">Excelent!</p>
              <p>Nu există programări nefinalizate pentru criteriile selectate</p>
            </CardContent>
          </Card>
        ) : (
          filteredDoctorStats.map((doctor) => (
            <Card key={doctor.id}>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setExpandedDoctor(expandedDoctor === doctor.id ? null : doctor.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: doctor.color }}
                    />
                    <CardTitle className="text-lg">{doctor.name}</CardTitle>
                    <Badge variant="secondary">{doctor.totalPending} programări</Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold">{doctor.totalRevenue.toLocaleString()} RON</div>
                      <div className="text-xs text-muted-foreground">venit potențial</div>
                    </div>
                    <span className="text-muted-foreground">
                      {expandedDoctor === doctor.id ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 mt-2 text-sm">
                  {doctor.scheduledCount > 0 && (
                    <span className="text-blue-600">Programate: {doctor.scheduledCount}</span>
                  )}
                  {doctor.confirmedCount > 0 && (
                    <span className="text-green-600">Confirmate: {doctor.confirmedCount}</span>
                  )}
                </div>
              </CardHeader>
              
              {expandedDoctor === doctor.id && (
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Ora</TableHead>
                          <TableHead>Pacient</TableHead>
                          <TableHead>Telefon</TableHead>
                          <TableHead>Cabinet</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Preț</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {doctor.appointments.map((apt) => (
                          <TableRow key={apt.id}>
                            <TableCell className="font-medium">
                              {format(new Date(apt.appointment_date), 'dd MMM yyyy', { locale: ro })}
                            </TableCell>
                            <TableCell>{apt.start_time.slice(0, 5)}</TableCell>
                            <TableCell>
                              {apt.patients ? (
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  {apt.patients.first_name} {apt.patients.last_name}
                                </div>
                              ) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              {apt.patients?.phone ? (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4 text-muted-foreground" />
                                  {apt.patients.phone}
                                </div>
                              ) : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                Cabinet {apt.cabinet_id}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(apt.status)}</TableCell>
                            <TableCell className="text-right font-medium">
                              {(apt.price || 0).toLocaleString()} RON
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
