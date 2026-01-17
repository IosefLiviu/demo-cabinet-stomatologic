import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, subMonths } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar as CalendarIcon, TrendingUp, Users, DollarSign, Clock, PieChart, UserCircle, Filter, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AppointmentDB } from '@/hooks/useAppointmentsDB';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, Legend } from 'recharts';
import { useDoctors } from '@/hooks/useDoctors';
import * as XLSX from 'xlsx';

interface ReportsDashboardProps {
  appointments: AppointmentDB[];
  loading: boolean;
  onFetchRange: (startDate: string, endDate: string) => Promise<void>;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function ReportsDashboard({ appointments, loading, onFetchRange }: ReportsDashboardProps) {
  const { doctors } = useDoctors();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('month');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');

  // Filter appointments by selected doctor
  const filteredAppointments = useMemo(() => {
    if (selectedDoctorId === 'all') return appointments;
    return appointments.filter(a => a.doctor_id === selectedDoctorId);
  }, [appointments, selectedDoctorId]);

  const handlePeriodChange = async (newPeriod: 'week' | 'month' | 'custom') => {
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
    await onFetchRange(format(from, 'yyyy-MM-dd'), format(to, 'yyyy-MM-dd'));
  };

  const handleDateRangeChange = async (range: { from?: Date; to?: Date }) => {
    if (range.from && range.to) {
      setDateRange({ from: range.from, to: range.to });
      setPeriod('custom');
      await onFetchRange(format(range.from, 'yyyy-MM-dd'), format(range.to, 'yyyy-MM-dd'));
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const completed = filteredAppointments.filter(a => a.status === 'completed');
    const totalRevenue = completed.reduce((sum, a) => sum + (a.price || 0), 0);
    const paidRevenue = completed.filter(a => a.is_paid).reduce((sum, a) => sum + (a.price || 0), 0);
    const unpaidRevenue = totalRevenue - paidRevenue;
    const avgDuration = filteredAppointments.length > 0 
      ? filteredAppointments.reduce((sum, a) => sum + a.duration, 0) / filteredAppointments.length 
      : 0;
    
    const uniquePatients = new Set(filteredAppointments.map(a => a.patient_id)).size;
    
    const statusCounts = filteredAppointments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const scheduled = filteredAppointments.filter(a => a.status === 'scheduled');
    const scheduledRevenue = scheduled.reduce((sum, a) => sum + (a.price || 0), 0);

    return {
      total: filteredAppointments.length,
      completed: completed.length,
      cancelled: statusCounts['cancelled'] || 0,
      scheduled: scheduled.length,
      noShow: statusCounts['no_show'] || 0,
      totalRevenue,
      paidRevenue,
      unpaidRevenue,
      scheduledRevenue,
      avgDuration: Math.round(avgDuration),
      uniquePatients,
    };
  }, [filteredAppointments]);

  // Treatment popularity data
  const treatmentData = useMemo(() => {
    const counts = filteredAppointments.reduce((acc, a) => {
      const name = a.treatments?.name || 'Necunoscut';
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, count]) => ({ name, value: count }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filteredAppointments]);

  // Daily appointments data
  const dailyData = useMemo(() => {
    const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
    
    return days.map(day => {
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayAppointments = filteredAppointments.filter(a => a.appointment_date === dayStr);
      const completed = dayAppointments.filter(a => a.status === 'completed');
      
      return {
        date: format(day, 'dd MMM', { locale: ro }),
        programări: dayAppointments.length,
        finalizate: completed.length,
        venituri: completed.reduce((sum, a) => sum + (a.price || 0), 0),
      };
    });
  }, [filteredAppointments, dateRange]);

  // Cabinet data
  const cabinetData = useMemo(() => {
    const counts = filteredAppointments.reduce((acc, a) => {
      const cabinet = `Cabinet ${a.cabinet_id}`;
      acc[cabinet] = (acc[cabinet] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredAppointments]);

  // Doctor revenue data - includes all appointments (scheduled shows as "planificat", completed as "încasat/restant")
  const doctorRevenueData = useMemo(() => {
    const doctorStats = filteredAppointments.reduce((acc, a) => {
      const doctorName = a.doctors?.name || 'Fără doctor';
      const doctorColor = a.doctors?.color || '#6B7280';
      
      if (!acc[doctorName]) {
        acc[doctorName] = { 
          name: doctorName, 
          revenue: 0, 
          paid: 0, 
          unpaid: 0, 
          scheduled: 0,
          appointments: 0,
          color: doctorColor 
        };
      }
      
      const price = a.price || 0;
      acc[doctorName].appointments += 1;
      
      if (a.status === 'completed') {
        acc[doctorName].revenue += price;
        if (a.is_paid) {
          acc[doctorName].paid += price;
        } else {
          acc[doctorName].unpaid += price;
        }
      } else if (a.status === 'scheduled') {
        acc[doctorName].scheduled += price;
      }
      
      return acc;
    }, {} as Record<string, { name: string; revenue: number; paid: number; unpaid: number; scheduled: number; appointments: number; color: string }>);

    return Object.values(doctorStats).sort((a, b) => (b.revenue + b.scheduled) - (a.revenue + a.scheduled));
  }, [filteredAppointments]);

  // Export to Excel function
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();
    
    // Sheet 1: Summary
    const summaryData = [
      ['Raport Financiar', ''],
      ['Perioadă', `${format(dateRange.from, 'dd.MM.yyyy')} - ${format(dateRange.to, 'dd.MM.yyyy')}`],
      ['Doctor', selectedDoctorId === 'all' ? 'Toți doctorii' : doctors.find(d => d.id === selectedDoctorId)?.name || ''],
      ['', ''],
      ['Indicator', 'Valoare'],
      ['Total Programări', stats.total],
      ['Finalizate', stats.completed],
      ['Anulate', stats.cancelled],
      ['Programate', stats.scheduled],
      ['', ''],
      ['Venituri Totale (RON)', stats.totalRevenue],
      ['Încasat (RON)', stats.paidRevenue],
      ['Planificat (RON)', stats.scheduledRevenue],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Sumar');
    
    // Sheet 2: Doctor Revenue
    const doctorData = [
      ['Doctor', 'Programări', 'Încasat (RON)', 'Planificat (RON)', 'Total (RON)'],
      ...doctorRevenueData.map(d => [
        d.name,
        d.appointments,
        d.paid,
        d.scheduled,
        d.revenue + d.scheduled
      ]),
      ['', '', '', '', ''],
      ['TOTAL', 
        doctorRevenueData.reduce((sum, d) => sum + d.appointments, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.paid, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.scheduled, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.revenue + d.scheduled, 0)
      ]
    ];
    const doctorSheet = XLSX.utils.aoa_to_sheet(doctorData);
    doctorSheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, doctorSheet, 'Încasări Doctori');
    
    // Sheet 3: Detailed Appointments
    const appointmentsData = [
      ['Data', 'Ora', 'Pacient', 'Doctor', 'Tratament', 'Status', 'Preț (RON)', 'Achitat'],
      ...filteredAppointments.map(a => [
        format(new Date(a.appointment_date), 'dd.MM.yyyy'),
        a.start_time.substring(0, 5),
        a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : 'N/A',
        a.doctors?.name || 'N/A',
        a.treatments?.name || 'N/A',
        a.status === 'completed' ? 'Finalizat' : 
          a.status === 'cancelled' ? 'Anulat' : 
          a.status === 'scheduled' ? 'Programat' : a.status,
        a.price || 0,
        a.is_paid ? 'Da' : 'Nu'
      ])
    ];
    const appointmentsSheet = XLSX.utils.aoa_to_sheet(appointmentsData);
    appointmentsSheet['!cols'] = [
      { wch: 12 }, { wch: 8 }, { wch: 25 }, { wch: 20 }, 
      { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(workbook, appointmentsSheet, 'Programări Detaliate');
    
    // Sheet 4: Daily Revenue (using dailyData which already exists)
    const dailyExportData = [
      ['Data', 'Programări', 'Finalizate', 'Venituri (RON)'],
      ...dailyData.map(d => [d.date, d.programări, d.finalizate, d.venituri])
    ];
    const dailySheet = XLSX.utils.aoa_to_sheet(dailyExportData);
    dailySheet['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, dailySheet, 'Venituri Zilnice');
    
    // Generate filename with date range
    const filename = `Raport_Financiar_${format(dateRange.from, 'dd-MM-yyyy')}_${format(dateRange.to, 'dd-MM-yyyy')}.xlsx`;
    
    // Download
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap items-center gap-4">
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
        
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(dateRange.from, 'dd MMM', { locale: ro })} - {format(dateRange.to, 'dd MMM yyyy', { locale: ro })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => range && handleDateRangeChange(range)}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        {/* Doctor Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Toți doctorii" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toți doctorii</SelectItem>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.id} value={doctor.id}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: doctor.color }}
                    />
                    {doctor.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Export Button */}
        <Button variant="outline" size="sm" className="gap-2 ml-auto" onClick={exportToExcel}>
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programări</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completed} finalizate, {stats.cancelled} anulate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Venituri</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} RON</div>
            <p className="text-xs text-muted-foreground">
              {stats.paidRevenue.toLocaleString()} încasați, {stats.unpaidRevenue.toLocaleString()} restanți
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacienți Unici</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniquePatients}</div>
            <p className="text-xs text-muted-foreground">
              în perioada selectată
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durată Medie</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDuration} min</div>
            <p className="text-xs text-muted-foreground">
              per programare
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Programări pe zile</CardTitle>
            <CardDescription>Evoluția programărilor în perioada selectată</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <YAxis 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar 
                    dataKey="programări" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="finalizate" 
                    fill="hsl(var(--secondary))" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Treatment Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Tratamente populare</CardTitle>
            <CardDescription>Distribuția pe tipuri de tratamente</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={treatmentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {treatmentData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Revenue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" />
            Încasări pe doctori
          </CardTitle>
          <CardDescription>Veniturile realizate de fiecare doctor în perioada selectată</CardDescription>
        </CardHeader>
        <CardContent>
          {doctorRevenueData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Nu există date pentru perioada selectată</p>
          ) : (
            <div className="space-y-4">
              {doctorRevenueData.map((doctor) => {
                const totalValue = doctor.revenue + doctor.scheduled;
                return (
                  <div key={doctor.name} className="p-4 rounded-lg border bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: doctor.color }}
                        />
                        <span className="font-medium">{doctor.name}</span>
                        <span className="text-sm text-muted-foreground">({doctor.appointments} programări)</span>
                      </div>
                      <span className="text-lg font-bold">{totalValue.toLocaleString()} RON</span>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">Încasat:</span>
                        <span className="font-medium text-green-600">{doctor.paid.toLocaleString()} RON</span>
                      </div>
                      {doctor.unpaid > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-muted-foreground">Neachitat:</span>
                          <span className="font-medium text-orange-600">{doctor.unpaid.toLocaleString()} RON</span>
                        </div>
                      )}
                      {doctor.scheduled > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-muted-foreground">Planificat:</span>
                          <span className="font-medium text-blue-600">{doctor.scheduled.toLocaleString()} RON</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                        {totalValue > 0 && (
                          <>
                            <div 
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${(doctor.paid / totalValue) * 100}%` }}
                            />
                            <div 
                              className="h-full bg-orange-500 transition-all"
                              style={{ width: `${(doctor.unpaid / totalValue) * 100}%` }}
                            />
                            <div 
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${(doctor.scheduled / totalValue) * 100}%` }}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Total Summary */}
              <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold">
                    {doctorRevenueData.reduce((sum, d) => sum + d.revenue + d.scheduled, 0).toLocaleString()} RON
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm mt-1">
                  <span className="text-green-600 font-medium">
                    Încasat: {doctorRevenueData.reduce((sum, d) => sum + d.paid, 0).toLocaleString()} RON
                  </span>
                  <span className="text-orange-600 font-medium">
                    Neachitat: {doctorRevenueData.reduce((sum, d) => sum + d.unpaid, 0).toLocaleString()} RON
                  </span>
                  <span className="text-blue-600 font-medium">
                    Planificat: {doctorRevenueData.reduce((sum, d) => sum + d.scheduled, 0).toLocaleString()} RON
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cabinet Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Ocupare cabinete</CardTitle>
          <CardDescription>Numărul de programări pe cabinet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cabinetData.map((cabinet, index) => (
              <div key={cabinet.name} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium">{cabinet.name}</div>
                <div className="flex-1">
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all"
                      style={{ 
                        width: `${(cabinet.value / stats.total) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
                <div className="w-16 text-sm text-right text-muted-foreground">
                  {cabinet.value} ({Math.round((cabinet.value / stats.total) * 100)}%)
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
