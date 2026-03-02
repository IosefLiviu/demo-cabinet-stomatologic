import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ro } from 'date-fns/locale';
import { XCircle, CheckCircle, Users, Download, Search, Filter, CalendarIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { AppointmentDB } from '@/hooks/useAppointmentsDB';
import * as XLSX from 'xlsx';

interface AppointmentsPatientReportProps {
  appointments: AppointmentDB[];
  dateRange: { from: Date; to: Date };
  onFetchRange: (startDate: string, endDate: string) => Promise<void>;
}

interface PatientAppointmentsSummary {
  patientId: string;
  patientName: string;
  patientPhone: string;
  completedCount: number;
  cancelledCount: number;
  completedRevenue: number;
  cancelledRevenue: number;
  appointments: {
    id: string;
    date: string;
    treatment: string;
    doctor: string;
    status: string;
    price: number;
    cancellationReason: string | null;
    cancelledAt: string | null;
  }[];
}

export function AppointmentsPatientReport({ appointments, dateRange, onFetchRange }: AppointmentsPatientReportProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [localFrom, setLocalFrom] = useState<Date>(dateRange.from);
  const [localTo, setLocalTo] = useState<Date>(dateRange.to);

  const handleLocalFromChange = async (d: Date) => {
    setLocalFrom(d);
    await onFetchRange(format(d, 'yyyy-MM-dd'), format(localTo, 'yyyy-MM-dd'));
  };

  const handleLocalToChange = async (d: Date) => {
    setLocalTo(d);
    await onFetchRange(format(localFrom, 'yyyy-MM-dd'), format(d, 'yyyy-MM-dd'));
  };

  // Filter appointments by local date range
  const filteredByDate = useMemo(() => {
    return appointments.filter(a => {
      const d = new Date(a.appointment_date);
      return d >= localFrom && d <= localTo;
    });
  }, [appointments, localFrom, localTo]);

  // Group appointments by patient
  const patientSummaries = useMemo(() => {
    const completedAndCancelled = filteredByDate.filter(
      a => a.status === 'completed' || a.status === 'cancelled'
    );

    const byPatient = completedAndCancelled.reduce((acc, a) => {
      const patientId = a.patient_id;
      if (!acc[patientId]) {
        acc[patientId] = {
          patientId,
          patientName: a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : 'N/A',
          patientPhone: a.patients?.phone || 'N/A',
          completedCount: 0,
          cancelledCount: 0,
          completedRevenue: 0,
          cancelledRevenue: 0,
          appointments: [],
        };
      }

      if (a.status === 'completed') {
        acc[patientId].completedCount += 1;
        acc[patientId].completedRevenue += a.price || 0;
      } else if (a.status === 'cancelled') {
        acc[patientId].cancelledCount += 1;
        acc[patientId].cancelledRevenue += a.price || 0;
      }

      acc[patientId].appointments.push({
        id: a.id,
        date: a.appointment_date,
        treatment: a.treatments?.name || 'N/A',
        doctor: a.doctors?.name || 'N/A',
        status: a.status,
        price: a.price || 0,
        cancellationReason: a.cancellation_reason || null,
        cancelledAt: a.cancelled_at || null,
      });

      return acc;
    }, {} as Record<string, PatientAppointmentsSummary>);

    return Object.values(byPatient).sort((a, b) => {
      const totalA = a.completedCount + a.cancelledCount;
      const totalB = b.completedCount + b.cancelledCount;
      return totalB - totalA;
    });
  }, [filteredByDate]);

  // Filter summaries
  const filteredSummaries = useMemo(() => {
    return patientSummaries.filter(p => {
      const matchesSearch = searchTerm === '' || 
        p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.patientPhone.includes(searchTerm);
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'completed' && p.completedCount > 0) ||
        (statusFilter === 'cancelled' && p.cancelledCount > 0);

      return matchesSearch && matchesStatus;
    });
  }, [patientSummaries, searchTerm, statusFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    return filteredSummaries.reduce((acc, p) => {
      acc.completed += p.completedCount;
      acc.cancelled += p.cancelledCount;
      acc.completedRevenue += p.completedRevenue;
      acc.cancelledRevenue += p.cancelledRevenue;
      return acc;
    }, { completed: 0, cancelled: 0, completedRevenue: 0, cancelledRevenue: 0 });
  }, [filteredSummaries]);

  // Get selected patient details
  const selectedPatient = selectedPatientId 
    ? patientSummaries.find(p => p.patientId === selectedPatientId) 
    : null;

  // Export to Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Summary per patient
    const summaryData = [
      ['Raport Programări pe Pacienți', '', '', '', '', ''],
      ['Perioadă', `${format(localFrom, 'dd.MM.yyyy')} - ${format(localTo, 'dd.MM.yyyy')}`, '', '', '', ''],
      ['Filtru Status', statusFilter === 'all' ? 'Toate' : statusFilter === 'completed' ? 'Finalizate' : 'Anulate', '', '', '', ''],
      ['', '', '', '', '', ''],
      ['Pacient', 'Telefon', 'Finalizate', 'Venit Finalizate (RON)', 'Anulate', 'Venit Pierdut (RON)'],
      ...filteredSummaries.map(p => [
        p.patientName,
        p.patientPhone,
        p.completedCount,
        p.completedRevenue,
        p.cancelledCount,
        p.cancelledRevenue,
      ]),
      ['', '', '', '', '', ''],
      ['TOTAL', '', totals.completed, totals.completedRevenue, totals.cancelled, totals.cancelledRevenue],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [
      { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 12 }, { wch: 20 }
    ];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Sumar pe Pacienți');

    // Sheet 2: Detailed appointments
    const detailedData = [
      ['Programări Detaliate', '', '', '', '', '', '', ''],
      ['Perioadă', `${format(localFrom, 'dd.MM.yyyy')} - ${format(localTo, 'dd.MM.yyyy')}`, '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['Data', 'Pacient', 'Telefon', 'Tratament', 'Doctor', 'Status', 'Preț (RON)', 'Motiv Anulare'],
    ];

    filteredSummaries.forEach(p => {
      const aptsToShow = statusFilter === 'all' 
        ? p.appointments 
        : p.appointments.filter(a => a.status === statusFilter);
      
      aptsToShow.forEach(apt => {
        detailedData.push([
          format(new Date(apt.date), 'dd.MM.yyyy'),
          p.patientName,
          p.patientPhone,
          apt.treatment,
          apt.doctor,
          apt.status === 'completed' ? 'Finalizat' : 'Anulat',
          apt.price.toString(),
          apt.cancellationReason || '',
        ]);
      });
    });

    const detailedSheet = XLSX.utils.aoa_to_sheet(detailedData);
    detailedSheet['!cols'] = [
      { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, 
      { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(workbook, detailedSheet, 'Programări Detaliate');

    // Sheet 3: Only cancelled with reasons
    const cancelledData = [
      ['Programări Anulate', '', '', '', '', '', ''],
      ['Perioadă', `${format(localFrom, 'dd.MM.yyyy')} - ${format(localTo, 'dd.MM.yyyy')}`, '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['Data', 'Pacient', 'Telefon', 'Tratament', 'Doctor', 'Preț (RON)', 'Motiv Anulare'],
    ];

    filteredSummaries.forEach(p => {
      p.appointments
        .filter(a => a.status === 'cancelled')
        .forEach(apt => {
          cancelledData.push([
            format(new Date(apt.date), 'dd.MM.yyyy'),
            p.patientName,
            p.patientPhone,
            apt.treatment,
            apt.doctor,
            apt.price.toString(),
            apt.cancellationReason || 'Fără motiv specificat',
          ]);
        });
    });

    const cancelledSheet = XLSX.utils.aoa_to_sheet(cancelledData);
    cancelledSheet['!cols'] = [
      { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, 
      { wch: 20 }, { wch: 12 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(workbook, cancelledSheet, 'Anulate cu Motive');

    const filename = `Raport_Programari_Pacienti_${format(localFrom, 'dd-MM-yyyy')}_${format(localTo, 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Programări</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.completed + totals.cancelled}</div>
            <p className="text-xs text-muted-foreground">{(totals.completedRevenue + totals.cancelledRevenue).toLocaleString()} RON total</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Finalizate</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">{totals.completed}</div>
            <p className="text-xs text-muted-foreground">{totals.completedRevenue.toLocaleString()} RON venituri</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Anulate</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">{totals.cancelled}</div>
            <p className="text-xs text-muted-foreground">{totals.cancelledRevenue.toLocaleString()} RON pierdut</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pacienți Unici</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredSummaries.length}</div>
            <p className="text-xs text-muted-foreground">în perioada selectată</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rata Anulare</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.completed + totals.cancelled > 0 
                ? Math.round((totals.cancelled / (totals.completed + totals.cancelled)) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">din total programări</p>
          </CardContent>
        </Card>
      </div>

      {/* Date Range & Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("gap-2 w-[140px] justify-start text-left font-normal")}>
                <CalendarIcon className="h-4 w-4" />
                {format(localFrom, 'dd.MM.yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={localFrom}
                onSelect={(d) => d && handleLocalFromChange(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground text-sm">—</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("gap-2 w-[140px] justify-start text-left font-normal")}>
                <CalendarIcon className="h-4 w-4" />
                {format(localTo, 'dd.MM.yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 z-50" align="start">
              <Calendar
                mode="single"
                selected={localTo}
                onSelect={(d) => d && handleLocalToChange(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută pacient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate</SelectItem>
              <SelectItem value="completed">Finalizate</SelectItem>
              <SelectItem value="cancelled">Anulate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" className="gap-2 ml-auto" onClick={exportToExcel}>
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Patient List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Programări pe Pacienți
          </CardTitle>
          <CardDescription>
            {filteredSummaries.length} pacienți cu {totals.completed + totals.cancelled} programări
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSummaries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nu există programări finalizate sau anulate în perioada selectată
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {filteredSummaries.map((patient) => (
                <div
                  key={patient.patientId}
                  className={`p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer ${
                    selectedPatientId === patient.patientId ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedPatientId(
                    selectedPatientId === patient.patientId ? null : patient.patientId
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{patient.patientName}</span>
                        <span className="text-xs text-muted-foreground">
                          Tel: {patient.patientPhone}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm">
                        {patient.completedCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-green-300">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {patient.completedCount} finalizate
                            </Badge>
                            <span className="text-green-600 font-medium">
                              {patient.completedRevenue.toLocaleString()} RON
                            </span>
                          </div>
                        )}
                        {patient.cancelledCount > 0 && (
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-300">
                              <XCircle className="h-3 w-3 mr-1" />
                              {patient.cancelledCount} anulate
                            </Badge>
                            <span className="text-red-600 font-medium">
                              {patient.cancelledRevenue.toLocaleString()} RON
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {selectedPatientId === patient.patientId && (
                    <div className="mt-4 pt-4 border-t space-y-2">
                      {patient.appointments
                        .filter(a => statusFilter === 'all' || a.status === statusFilter)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((apt) => (
                          <div 
                            key={apt.id} 
                            className={`p-3 rounded-md text-sm ${
                              apt.status === 'completed' 
                                ? 'bg-green-50 dark:bg-green-950/20' 
                                : 'bg-red-50 dark:bg-red-950/20'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                {apt.status === 'completed' ? (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-600" />
                                )}
                                <span className="font-medium">
                                  {format(new Date(apt.date), 'dd.MM.yyyy', { locale: ro })}
                                </span>
                                <span className="text-muted-foreground">•</span>
                                <span>{apt.treatment}</span>
                                <span className="text-muted-foreground">•</span>
                                <span className="text-muted-foreground">{apt.doctor}</span>
                              </div>
                              <span className="font-medium">{apt.price.toLocaleString()} RON</span>
                            </div>
                            {apt.status === 'cancelled' && apt.cancellationReason && (
                              <div className="mt-2 text-red-600 dark:text-red-400 text-xs">
                                <span className="font-medium">Motiv anulare:</span> {apt.cancellationReason}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
