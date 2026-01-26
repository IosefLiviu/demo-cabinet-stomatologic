import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { AlertTriangle, Download, Search, Calendar, Clock, User, Phone, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppointmentDB } from '@/hooks/useAppointmentsDB';
import * as XLSX from 'xlsx';

interface NoDoctorAppointmentsReportProps {
  appointments: AppointmentDB[];
  dateRange: { from: Date; to: Date };
}

export function NoDoctorAppointmentsReport({ appointments, dateRange }: NoDoctorAppointmentsReportProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter appointments without doctor
  const noDoctorAppointments = useMemo(() => {
    return appointments
      .filter(a => !a.doctor_id)
      .filter(a => {
        if (!searchTerm) return true;
        const patientName = a.patients 
          ? `${a.patients.first_name} ${a.patients.last_name}`.toLowerCase() 
          : '';
        const phone = a.patients?.phone || '';
        return patientName.includes(searchTerm.toLowerCase()) || phone.includes(searchTerm);
      })
      .sort((a, b) => {
        // Sort by date descending, then by time
        const dateCompare = b.appointment_date.localeCompare(a.appointment_date);
        if (dateCompare !== 0) return dateCompare;
        return b.start_time.localeCompare(a.start_time);
      });
  }, [appointments, searchTerm]);

  // Group by status for summary
  const statusSummary = useMemo(() => {
    const summary = noDoctorAppointments.reduce((acc, a) => {
      acc[a.status] = (acc[a.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return summary;
  }, [noDoctorAppointments]);

  // Calculate total revenue potential
  const totalPotentialRevenue = useMemo(() => {
    return noDoctorAppointments
      .filter(a => a.status !== 'cancelled')
      .reduce((sum, a) => sum + (a.price || 0), 0);
  }, [noDoctorAppointments]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Programat</Badge>;
      case 'confirmed':
        return <Badge variant="outline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Confirmat</Badge>;
      case 'completed':
        return <Badge variant="outline" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Finalizat</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Anulat</Badge>;
      case 'no_show':
        return <Badge variant="outline" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Neprezentare</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Export to Excel
  const exportToExcel = () => {
    const workbook = XLSX.utils.book_new();

    const data = [
      ['Raport Programări Fără Doctor Asignat', '', '', '', '', '', '', ''],
      ['Perioadă', `${format(dateRange.from, 'dd.MM.yyyy')} - ${format(dateRange.to, 'dd.MM.yyyy')}`, '', '', '', '', '', ''],
      ['Total programări fără doctor', noDoctorAppointments.length.toString(), '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', ''],
      ['Data', 'Ora', 'Pacient', 'Telefon', 'Cabinet', 'Status', 'Preț (RON)', 'Note'],
    ];

    noDoctorAppointments.forEach(apt => {
      data.push([
        format(new Date(apt.appointment_date), 'dd.MM.yyyy'),
        apt.start_time.slice(0, 5),
        apt.patients ? `${apt.patients.first_name} ${apt.patients.last_name}` : 'N/A',
        apt.patients?.phone || 'N/A',
        `Cabinet ${apt.cabinet_id}`,
        apt.status === 'scheduled' ? 'Programat' :
          apt.status === 'confirmed' ? 'Confirmat' :
          apt.status === 'completed' ? 'Finalizat' :
          apt.status === 'cancelled' ? 'Anulat' :
          apt.status === 'no_show' ? 'Neprezentare' : apt.status,
        (apt.price || 0).toString(),
        apt.notes || '',
      ]);
    });

    // Add summary
    data.push(['', '', '', '', '', '', '', '']);
    data.push(['TOTAL', '', '', '', '', '', totalPotentialRevenue.toString(), '']);

    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet['!cols'] = [
      { wch: 12 }, { wch: 8 }, { wch: 25 }, { wch: 15 },
      { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 40 }
    ];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Fără Doctor');

    const filename = `Programari_Fara_Doctor_${format(dateRange.from, 'dd-MM-yyyy')}_${format(dateRange.to, 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-400">Fără Doctor</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{noDoctorAppointments.length}</div>
            <p className="text-xs text-muted-foreground">programări neasignate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programate/Confirmate</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(statusSummary['scheduled'] || 0) + (statusSummary['confirmed'] || 0)}
            </div>
            <p className="text-xs text-muted-foreground">în așteptare</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizate</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusSummary['completed'] || 0}</div>
            <p className="text-xs text-muted-foreground">fără doctor asignat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Venit Potențial</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPotentialRevenue.toLocaleString()} RON</div>
            <p className="text-xs text-muted-foreground">din programări active</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută pacient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button variant="outline" size="sm" className="gap-2 ml-auto" onClick={exportToExcel}>
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Programări fără Doctor Asignat
          </CardTitle>
          <CardDescription>
            {noDoctorAppointments.length} programări care necesită asignarea unui doctor
          </CardDescription>
        </CardHeader>
        <CardContent>
          {noDoctorAppointments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium text-green-600">Excelent!</p>
              <p>Nu există programări fără doctor asignat în perioada selectată</p>
            </div>
          ) : (
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
                  {noDoctorAppointments.map((apt) => (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
