import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar as CalendarIcon, TrendingUp, Users, DollarSign, Clock, PieChart, UserCircle, Filter, Download, FlaskConical } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AppointmentDB } from '@/hooks/useAppointmentsDB';
import { Tooltip } from 'recharts';
import { useDoctors } from '@/hooks/useDoctors';
import * as XLSX from 'xlsx';

interface ReportsDashboardProps {
  appointments: AppointmentDB[];
  loading: boolean;
  onFetchRange: (startDate: string, endDate: string) => Promise<void>;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

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

  // Helper to parse payment method - now uses payment_method column primarily
  const getPaymentMethod = (apt: AppointmentDB): 'card' | 'cash' | 'partial_card' | 'partial_cash' | 'unpaid' | null => {
    // Check payment_method column first (new data)
    if (apt.payment_method) {
      return apt.payment_method as 'card' | 'cash' | 'partial_card' | 'partial_cash' | 'unpaid';
    }
    // Fallback to notes parsing (old data)
    const notes = apt.notes;
    if (!notes) return null;
    if (notes.includes('[Plată: Card]')) return 'card';
    if (notes.includes('[Plată: Cash]')) return 'cash';
    if (notes.includes('[Plată: Neachitat]')) return 'unpaid';
    if (notes.includes('[Plată: Parțial Card')) return 'partial_card';
    if (notes.includes('[Plată: Parțial Cash')) return 'partial_cash';
    return null;
  };

  // Calculate statistics with partial payment support
  const stats = useMemo(() => {
    const completed = filteredAppointments.filter(a => a.status === 'completed');
    const totalRevenue = completed.reduce((sum, a) => sum + (a.price || 0), 0);
    
    // Calculate CAS and Laborator from appointment treatments
    let totalCas = 0;
    let totalLaborator = 0;
    completed.forEach(a => {
      if (a.appointment_treatments && a.appointment_treatments.length > 0) {
        a.appointment_treatments.forEach(t => {
          totalCas += (t.decont || 0);
          totalLaborator += (Number((t as any).laborator) || 0);
        });
      }
    });
    
    // Separate by payment method - use paid_amount for accurate tracking
    let cardRevenue = 0;
    let cashRevenue = 0;
    let unpaidRevenue = 0;
    let partialCardRevenue = 0;
    let partialCashRevenue = 0;
    let remainingDebt = 0; // Total outstanding balance
    
    completed.forEach(a => {
      const price = a.price || 0;
      const paidAmount = a.paid_amount ?? (a.is_paid ? price : 0);
      const method = getPaymentMethod(a);
      
      if (method === 'card') {
        cardRevenue += price;
      } else if (method === 'cash') {
        cashRevenue += price;
      } else if (method === 'partial_card') {
        partialCardRevenue += paidAmount;
        remainingDebt += (price - paidAmount);
      } else if (method === 'partial_cash') {
        partialCashRevenue += paidAmount;
        remainingDebt += (price - paidAmount);
      } else if (method === 'unpaid' || !a.is_paid) {
        unpaidRevenue += price;
        remainingDebt += price;
      } else if (a.is_paid) {
        // Fallback for old data without explicit method
        cashRevenue += price;
      }
    });
    
    const paidRevenue = cardRevenue + cashRevenue + partialCardRevenue + partialCashRevenue;
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
      cardRevenue,
      cashRevenue,
      partialCardRevenue,
      partialCashRevenue,
      unpaidRevenue,
      remainingDebt,
      scheduledRevenue,
      totalCas,
      totalLaborator,
      netRevenue: totalRevenue - totalLaborator,
      avgDuration: Math.round(avgDuration),
      uniquePatients,
    };
  }, [filteredAppointments]);


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

  // Doctor revenue data - includes all appointments with cash/card breakdown, CAS and Laborator
  const doctorRevenueData = useMemo(() => {
    const doctorStats = filteredAppointments.reduce((acc, a) => {
      const doctorName = a.doctors?.name || 'Fără doctor';
      const doctorColor = a.doctors?.color || '#6B7280';
      
      if (!acc[doctorName]) {
        acc[doctorName] = { 
          name: doctorName, 
          revenue: 0, 
          paid: 0,
          paidCard: 0,
          paidCash: 0,
          unpaid: 0, 
          scheduled: 0,
          cas: 0,
          laborator: 0,
          netLabRevenue: 0, // Price - laborator only for treatments with laborator > 0
          totalWithNetLab: 0, // paid - laborator (real income after lab costs)
          totalWithNetLabAndUnpaid: 0, // paid - laborator + unpaid (total potential income)
          sixtPercentTotal: 0, // 60% of totalWithNetLabAndUnpaid
          fortyPercentTotal: 0, // 40% of totalWithNetLabAndUnpaid
          appointments: 0,
          color: doctorColor 
        };
      }
      
      const price = a.price || 0;
      acc[doctorName].appointments += 1;
      
      if (a.status === 'completed') {
        acc[doctorName].revenue += price;
        
        // Calculate CAS and Laborator from appointment treatments
        if (a.appointment_treatments && a.appointment_treatments.length > 0) {
          a.appointment_treatments.forEach(t => {
            acc[doctorName].cas += (t.decont || 0);
            const labCost = Number((t as any).laborator) || 0;
            acc[doctorName].laborator += labCost;
            // Add to netLabRevenue only if laborator is set (> 0)
            if (labCost > 0) {
              const treatmentPrice = t.price || 0;
              acc[doctorName].netLabRevenue += (treatmentPrice - labCost);
            }
          });
        }
        
        const method = getPaymentMethod(a);
        const paidAmount = a.paid_amount ?? (a.is_paid ? price : 0);
        
        if (method === 'card') {
          acc[doctorName].paidCard += price;
          acc[doctorName].paid += price;
        } else if (method === 'cash') {
          acc[doctorName].paidCash += price;
          acc[doctorName].paid += price;
        } else if (method === 'partial_card') {
          acc[doctorName].paidCard += paidAmount;
          acc[doctorName].paid += paidAmount;
          acc[doctorName].unpaid += (price - paidAmount);
        } else if (method === 'partial_cash') {
          acc[doctorName].paidCash += paidAmount;
          acc[doctorName].paid += paidAmount;
          acc[doctorName].unpaid += (price - paidAmount);
        } else if (method === 'unpaid' || !a.is_paid) {
          acc[doctorName].unpaid += price;
        } else if (a.is_paid) {
          // Fallback for old data
          acc[doctorName].paidCash += price;
          acc[doctorName].paid += price;
        }
      } else if (a.status === 'scheduled') {
        acc[doctorName].scheduled += price;
      }
      
      // Calculate totalWithNetLab: paid - laborator (real income after lab costs)
      acc[doctorName].totalWithNetLab = acc[doctorName].paid - acc[doctorName].laborator;
      // Calculate totalWithNetLabAndUnpaid: paid - laborator + unpaid (total potential income)
      acc[doctorName].totalWithNetLabAndUnpaid = acc[doctorName].paid - acc[doctorName].laborator + acc[doctorName].unpaid;
      // Calculate 60% of totalWithNetLabAndUnpaid
      acc[doctorName].sixtPercentTotal = Math.round(acc[doctorName].totalWithNetLabAndUnpaid * 0.6);
      // Calculate 40% of totalWithNetLabAndUnpaid
      acc[doctorName].fortyPercentTotal = Math.round(acc[doctorName].totalWithNetLabAndUnpaid * 0.4);
      
      return acc;
    }, {} as Record<string, { name: string; revenue: number; paid: number; paidCard: number; paidCash: number; unpaid: number; scheduled: number; cas: number; laborator: number; netLabRevenue: number; totalWithNetLab: number; totalWithNetLabAndUnpaid: number; sixtPercentTotal: number; fortyPercentTotal: number; appointments: number; color: string }>);

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
      ['Card (RON)', stats.cardRevenue],
      ['Cash (RON)', stats.cashRevenue],
      ['Neachitat (RON)', stats.unpaidRevenue],
      ['Planificat (RON)', stats.scheduledRevenue],
      ['', ''],
      ['CAS Decontat (RON)', stats.totalCas],
      ['Laborator (RON)', stats.totalLaborator],
      ['Venit Net (RON)', stats.netRevenue],
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 25 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Sumar');
    
    // Sheet 2: Doctor Revenue
    const doctorData = [
      ['Doctor', 'Programări', 'Card (RON)', 'Cash (RON)', 'Neachitat (RON)', 'Planificat (RON)', 'CAS (RON)', 'Laborator (RON)', 'Venit Net Lab. (RON)', 'Încasări + Net Lab. (RON)', 'Încasări + Net Lab. + Neachitat (RON)', '60% Total (RON)', '40% Total (RON)', 'Total (RON)'],
      ...doctorRevenueData.map(d => [
        d.name,
        d.appointments,
        d.paidCard,
        d.paidCash,
        d.unpaid,
        d.scheduled,
        d.cas,
        d.laborator,
        d.netLabRevenue,
        d.totalWithNetLab,
        d.totalWithNetLabAndUnpaid,
        d.sixtPercentTotal,
        d.fortyPercentTotal,
        d.revenue + d.scheduled
      ]),
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['TOTAL', 
        doctorRevenueData.reduce((sum, d) => sum + d.appointments, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.paidCard, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.paidCash, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.unpaid, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.scheduled, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.cas, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.laborator, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.netLabRevenue, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.totalWithNetLab, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.totalWithNetLabAndUnpaid, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.sixtPercentTotal, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.fortyPercentTotal, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.revenue + d.scheduled, 0)
      ]
    ];
    const doctorSheet = XLSX.utils.aoa_to_sheet(doctorData);
    doctorSheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 22 }, { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, doctorSheet, 'Încasări Doctori');
    
    // Sheet 3: Detailed Appointments
    const appointmentsData = [
      ['Data', 'Ora', 'Pacient', 'Doctor', 'Tratament', 'Status', 'Preț (RON)', 'Laborator (RON)', 'Achitat'],
      ...filteredAppointments.map(a => {
        // Calculate laborator total from appointment treatments
        const laboratorTotal = a.appointment_treatments?.reduce((sum, t) => sum + (Number((t as any).laborator) || 0), 0) || 0;
        return [
          format(new Date(a.appointment_date), 'dd.MM.yyyy'),
          a.start_time.substring(0, 5),
          a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : 'N/A',
          a.doctors?.name || 'N/A',
          a.treatments?.name || 'N/A',
          a.status === 'completed' ? 'Finalizat' : 
            a.status === 'cancelled' ? 'Anulat' : 
            a.status === 'scheduled' ? 'Programat' : a.status,
          a.price || 0,
          laboratorTotal,
          a.is_paid ? 'Da' : 'Nu'
        ];
      })
    ];
    const appointmentsSheet = XLSX.utils.aoa_to_sheet(appointmentsData);
    appointmentsSheet['!cols'] = [
      { wch: 12 }, { wch: 8 }, { wch: 25 }, { wch: 20 }, 
      { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 10 }
    ];
    XLSX.utils.book_append_sheet(workbook, appointmentsSheet, 'Programări Detaliate');
    
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
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
            <CardTitle className="text-sm font-medium">Venituri Brute</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} RON</div>
            <p className="text-xs text-muted-foreground">
              {stats.paidRevenue.toLocaleString()} încasați, {stats.unpaidRevenue.toLocaleString()} restanți
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">Costuri Laborator</CardTitle>
            <FlaskConical className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">{stats.totalLaborator.toLocaleString()} RON</div>
            <p className="text-xs text-muted-foreground">
              cheltuieli laborator
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Venit Net</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{stats.netRevenue.toLocaleString()} RON</div>
            <p className="text-xs text-muted-foreground">
              după laborator
            </p>
          </CardContent>
        </Card>

        <Card className="border-cyan-200 bg-cyan-50/50 dark:border-cyan-800 dark:bg-cyan-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-700 dark:text-cyan-400">CAS Decontat</CardTitle>
            <TrendingUp className="h-4 w-4 text-cyan-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cyan-700 dark:text-cyan-400">{stats.totalCas.toLocaleString()} RON</div>
            <p className="text-xs text-muted-foreground">
              din tratamente finalizate
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
                      {doctor.paidCard > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-muted-foreground">Card:</span>
                          <span className="font-medium text-blue-600">{doctor.paidCard.toLocaleString()} RON</span>
                        </div>
                      )}
                      {doctor.paidCash > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <span className="text-muted-foreground">Cash:</span>
                          <span className="font-medium text-green-600">{doctor.paidCash.toLocaleString()} RON</span>
                        </div>
                      )}
                      {doctor.unpaid > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-orange-500" />
                          <span className="text-muted-foreground">Neachitat:</span>
                          <span className="font-medium text-orange-600">{doctor.unpaid.toLocaleString()} RON</span>
                        </div>
                      )}
                      {doctor.scheduled > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-purple-500" />
                          <span className="text-muted-foreground">Planificat:</span>
                          <span className="font-medium text-purple-600">{doctor.scheduled.toLocaleString()} RON</span>
                        </div>
                      )}
                      {doctor.cas > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-cyan-500" />
                          <span className="text-muted-foreground">CAS:</span>
                          <span className="font-medium text-cyan-600">{doctor.cas.toLocaleString()} RON</span>
                        </div>
                      )}
                      {doctor.laborator > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-fuchsia-500" />
                          <span className="text-muted-foreground">Laborator:</span>
                          <span className="font-medium text-fuchsia-600">{doctor.laborator.toLocaleString()} RON</span>
                        </div>
                      )}
                      {doctor.netLabRevenue !== 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span className="text-muted-foreground">Venit Net Lab.:</span>
                          <span className="font-medium text-indigo-600">{doctor.netLabRevenue.toLocaleString()} RON</span>
                        </div>
                      )}
                      {doctor.totalWithNetLab !== 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-teal-500" />
                          <span className="text-muted-foreground">Încasări + Net Lab.:</span>
                          <span className="font-medium text-teal-600">{doctor.totalWithNetLab.toLocaleString()} RON</span>
                        </div>
                      )}
                      {doctor.totalWithNetLabAndUnpaid !== 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="text-muted-foreground">Încasări + Net Lab. + Neachitat:</span>
                          <span className="font-medium text-rose-600">{doctor.totalWithNetLabAndUnpaid.toLocaleString()} RON</span>
                        </div>
                      )}
                      {doctor.sixtPercentTotal !== 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-muted-foreground">60% Total:</span>
                          <span className="font-medium text-amber-600">{doctor.sixtPercentTotal.toLocaleString()} RON</span>
                        </div>
                      )}
                      {doctor.fortyPercentTotal !== 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-lime-500" />
                          <span className="text-muted-foreground">40% Total:</span>
                          <span className="font-medium text-lime-600">{doctor.fortyPercentTotal.toLocaleString()} RON</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                        {totalValue > 0 && (
                          <>
                            <div 
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${(doctor.paidCard / totalValue) * 100}%` }}
                            />
                            <div 
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${(doctor.paidCash / totalValue) * 100}%` }}
                            />
                            <div 
                              className="h-full bg-orange-500 transition-all"
                              style={{ width: `${(doctor.unpaid / totalValue) * 100}%` }}
                            />
                            <div 
                              className="h-full bg-purple-500 transition-all"
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
                  <span className="text-blue-600 font-medium">
                    Card: {doctorRevenueData.reduce((sum, d) => sum + d.paidCard, 0).toLocaleString()} RON
                  </span>
                  <span className="text-green-600 font-medium">
                    Cash: {doctorRevenueData.reduce((sum, d) => sum + d.paidCash, 0).toLocaleString()} RON
                  </span>
                  <span className="text-orange-600 font-medium">
                    Neachitat: {doctorRevenueData.reduce((sum, d) => sum + d.unpaid, 0).toLocaleString()} RON
                  </span>
                  <span className="text-purple-600 font-medium">
                    Planificat: {doctorRevenueData.reduce((sum, d) => sum + d.scheduled, 0).toLocaleString()} RON
                  </span>
                  <span className="text-cyan-600 font-medium">
                    CAS: {doctorRevenueData.reduce((sum, d) => sum + d.cas, 0).toLocaleString()} RON
                  </span>
                  <span className="text-fuchsia-600 font-medium">
                    Laborator: {doctorRevenueData.reduce((sum, d) => sum + d.laborator, 0).toLocaleString()} RON
                  </span>
                  <span className="text-indigo-600 font-medium">
                    Venit Net Lab.: {doctorRevenueData.reduce((sum, d) => sum + d.netLabRevenue, 0).toLocaleString()} RON
                  </span>
                  <span className="text-teal-600 font-medium">
                    Încasări + Net Lab.: {doctorRevenueData.reduce((sum, d) => sum + d.totalWithNetLab, 0).toLocaleString()} RON
                  </span>
                  <span className="text-rose-600 font-medium">
                    Încasări + Net Lab. + Neachitat: {doctorRevenueData.reduce((sum, d) => sum + d.totalWithNetLabAndUnpaid, 0).toLocaleString()} RON
                  </span>
                  <span className="text-amber-600 font-medium">
                    60% Total: {doctorRevenueData.reduce((sum, d) => sum + d.sixtPercentTotal, 0).toLocaleString()} RON
                  </span>
                  <span className="text-lime-600 font-medium">
                    40% Total: {doctorRevenueData.reduce((sum, d) => sum + d.fortyPercentTotal, 0).toLocaleString()} RON
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
