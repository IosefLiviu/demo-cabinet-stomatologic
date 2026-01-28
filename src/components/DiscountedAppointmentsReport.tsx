import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Percent, Download, Search, Calendar, User, Phone, Tag } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppointmentDB } from '@/hooks/useAppointmentsDB';
import * as XLSX from 'xlsx';

interface DiscountedAppointmentsReportProps {
  appointments: AppointmentDB[];
  dateRange: { from: Date; to: Date };
}

interface DiscountedAppointment extends AppointmentDB {
  totalDiscount: number;
  totalGross: number;
  avgDiscountPercent: number;
  discountedTreatments: string[];
}

export function DiscountedAppointmentsReport({ appointments, dateRange }: DiscountedAppointmentsReportProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filter appointments with discount
  const discountedAppointments = useMemo(() => {
    return appointments
      .map(a => {
        const treatments = a.appointment_treatments || [];
        const discountedTreatments = treatments.filter(t => (t.discount_percent || 0) > 0);
        
        if (discountedTreatments.length === 0) return null;

        // Calculate total discount amount
        let totalDiscount = 0;
        let totalGross = 0;
        const treatmentNames: string[] = [];

        discountedTreatments.forEach(t => {
          const price = t.price || 0;
          const discountPercent = t.discount_percent || 0;
          const discountAmount = (price * discountPercent) / 100;
          totalDiscount += discountAmount;
          totalGross += price;
          treatmentNames.push(`${t.treatment_name} (${discountPercent}%)`);
        });

        const avgDiscountPercent = totalGross > 0 
          ? (totalDiscount / totalGross) * 100 
          : 0;

        return {
          ...a,
          totalDiscount,
          totalGross,
          avgDiscountPercent,
          discountedTreatments: treatmentNames,
        } as DiscountedAppointment;
      })
      .filter((a): a is DiscountedAppointment => a !== null)
      .filter(a => {
        if (!searchTerm) return true;
        const patientName = a.patients 
          ? `${a.patients.first_name} ${a.patients.last_name}`.toLowerCase() 
          : '';
        const phone = a.patients?.phone || '';
        const doctorName = a.doctors?.name?.toLowerCase() || '';
        return patientName.includes(searchTerm.toLowerCase()) || 
               phone.includes(searchTerm) ||
               doctorName.includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        // Sort by date descending, then by time
        const dateCompare = b.appointment_date.localeCompare(a.appointment_date);
        if (dateCompare !== 0) return dateCompare;
        return b.start_time.localeCompare(a.start_time);
      });
  }, [appointments, searchTerm]);

  // Summary stats
  const stats = useMemo(() => {
    const totalDiscount = discountedAppointments.reduce((sum, a) => sum + a.totalDiscount, 0);
    const totalGross = discountedAppointments.reduce((sum, a) => sum + a.totalGross, 0);
    const completedWithDiscount = discountedAppointments.filter(a => a.status === 'completed').length;
    const avgDiscount = discountedAppointments.length > 0 
      ? totalDiscount / discountedAppointments.length 
      : 0;

    return {
      totalDiscount,
      totalGross,
      completedWithDiscount,
      avgDiscount,
      count: discountedAppointments.length,
    };
  }, [discountedAppointments]);

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
      ['Raport Programări cu Discount Acordat', '', '', '', '', '', '', '', ''],
      ['Perioadă', `${format(dateRange.from, 'dd.MM.yyyy')} - ${format(dateRange.to, 'dd.MM.yyyy')}`, '', '', '', '', '', '', ''],
      ['Total discount acordat', `${stats.totalDiscount.toLocaleString()} RON`, '', '', '', '', '', '', ''],
      ['Total brut', `${stats.totalGross.toLocaleString()} RON`, '', '', '', '', '', '', ''],
      ['', '', '', '', '', '', '', '', ''],
      ['Data', 'Ora', 'Pacient', 'Telefon', 'Doctor', 'Tratamente cu Discount', 'Brut (RON)', 'Discount (RON)', 'Status'],
    ];

    discountedAppointments.forEach(apt => {
      data.push([
        format(new Date(apt.appointment_date), 'dd.MM.yyyy'),
        apt.start_time.slice(0, 5),
        apt.patients ? `${apt.patients.first_name} ${apt.patients.last_name}` : 'N/A',
        apt.patients?.phone || 'N/A',
        apt.doctors?.name || 'Fără doctor',
        apt.discountedTreatments.join(', '),
        apt.totalGross.toFixed(2),
        apt.totalDiscount.toFixed(2),
        apt.status === 'scheduled' ? 'Programat' :
          apt.status === 'confirmed' ? 'Confirmat' :
          apt.status === 'completed' ? 'Finalizat' :
          apt.status === 'cancelled' ? 'Anulat' :
          apt.status === 'no_show' ? 'Neprezentare' : apt.status,
      ]);
    });

    // Add summary
    data.push(['', '', '', '', '', '', '', '', '']);
    data.push(['TOTAL', '', '', '', '', '', stats.totalGross.toFixed(2), stats.totalDiscount.toFixed(2), '']);

    const sheet = XLSX.utils.aoa_to_sheet(data);
    sheet['!cols'] = [
      { wch: 12 }, { wch: 8 }, { wch: 25 }, { wch: 15 },
      { wch: 20 }, { wch: 40 }, { wch: 12 }, { wch: 12 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(workbook, sheet, 'Discounturi');

    const filename = `Programari_Discount_${format(dateRange.from, 'dd-MM-yyyy')}_${format(dateRange.to, 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Discount Acordat</CardTitle>
            <Percent className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">{stats.totalDiscount.toLocaleString()} RON</div>
            <p className="text-xs text-muted-foreground">din {stats.totalGross.toLocaleString()} brut</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Programări</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.count}</div>
            <p className="text-xs text-muted-foreground">cu discount aplicat</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizate</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedWithDiscount}</div>
            <p className="text-xs text-muted-foreground">programări cu discount</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Discount Mediu</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgDiscount.toFixed(0)} RON</div>
            <p className="text-xs text-muted-foreground">per programare</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută pacient sau doctor..."
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
            <Percent className="h-5 w-5 text-rose-500" />
            Programări cu Discount Acordat
          </CardTitle>
          <CardDescription>
            {discountedAppointments.length} programări cu discount în perioada selectată
          </CardDescription>
        </CardHeader>
        <CardContent>
          {discountedAppointments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Percent className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-lg font-medium">Niciun discount</p>
              <p>Nu există programări cu discount în perioada selectată</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Ora</TableHead>
                    <TableHead>Pacient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Tratamente</TableHead>
                    <TableHead className="text-right">Brut</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {discountedAppointments.map((apt) => (
                    <TableRow key={apt.id}>
                      <TableCell className="font-medium">
                        {format(new Date(apt.appointment_date), 'dd MMM yyyy', { locale: ro })}
                      </TableCell>
                      <TableCell>{apt.start_time.slice(0, 5)}</TableCell>
                      <TableCell>
                        {apt.patients ? (
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              {apt.patients.first_name} {apt.patients.last_name}
                            </div>
                            {apt.patients.phone && (
                              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                <Phone className="h-3 w-3" />
                                {apt.patients.phone}
                              </div>
                            )}
                          </div>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {apt.doctors?.name || (
                          <span className="text-muted-foreground italic">Fără doctor</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="space-y-1">
                          {apt.discountedTreatments.map((t, i) => (
                            <Badge key={i} variant="secondary" className="text-xs mr-1 mb-1">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {apt.totalGross.toLocaleString()} RON
                      </TableCell>
                      <TableCell className="text-right font-medium text-rose-600 dark:text-rose-400">
                        -{apt.totalDiscount.toLocaleString()} RON
                      </TableCell>
                      <TableCell>{getStatusBadge(apt.status)}</TableCell>
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
