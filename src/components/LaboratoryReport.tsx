import { useMemo } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { FlaskConical, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AppointmentDB } from '@/hooks/useAppointmentsDB';
import * as XLSX from 'xlsx';

interface LaboratoryReportProps {
  appointments: AppointmentDB[];
  dateRange: { from: Date; to: Date };
}

interface LabEntry {
  id: string;
  date: string;
  patientName: string;
  patientPhone: string;
  doctorName: string;
  doctorColor: string;
  treatmentName: string;
  laboratorCost: number;
  treatmentPrice: number;
  discountPercent: number;
}

interface DoctorLabStats {
  doctorName: string;
  doctorColor: string;
  totalLaborator: number;
  totalPrice: number;
  totalDiscount: number;
  netRevenue: number;
  entries: LabEntry[];
}

export function LaboratoryReport({ appointments, dateRange }: LaboratoryReportProps) {
  // Get all lab entries from completed appointments
  const labEntries = useMemo(() => {
    const entries: LabEntry[] = [];
    
    appointments
      .filter(a => a.status === 'completed')
      .forEach(a => {
        if (a.appointment_treatments && a.appointment_treatments.length > 0) {
          a.appointment_treatments.forEach(t => {
            const labCost = Number((t as any).laborator) || 0;
            const discountPercent = Number((t as any).discount_percent) || 0;
            if (labCost > 0) {
              entries.push({
                id: `${a.id}-${t.id}`,
                date: a.appointment_date,
                patientName: `${a.patients?.first_name || ''} ${a.patients?.last_name || ''}`.trim(),
                patientPhone: a.patients?.phone || '',
                doctorName: a.doctors?.name || 'Fără doctor',
                doctorColor: a.doctors?.color || '#6B7280',
                treatmentName: t.treatment_name,
                laboratorCost: labCost,
                treatmentPrice: t.price || 0,
                discountPercent: discountPercent,
              });
            }
          });
        }
      });
    
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [appointments]);

  const doctorLabStats = useMemo(() => {
    const stats: Record<string, DoctorLabStats> = {};
    
    labEntries.forEach(entry => {
      if (!stats[entry.doctorName]) {
        stats[entry.doctorName] = {
          doctorName: entry.doctorName,
          doctorColor: entry.doctorColor,
          totalLaborator: 0,
          totalPrice: 0,
          totalDiscount: 0,
          netRevenue: 0,
          entries: [],
        };
      }
      
      const discountAmount = entry.treatmentPrice * (entry.discountPercent / 100);
      stats[entry.doctorName].totalLaborator += entry.laboratorCost;
      stats[entry.doctorName].totalPrice += entry.treatmentPrice;
      stats[entry.doctorName].totalDiscount += discountAmount;
      stats[entry.doctorName].entries.push(entry);
    });
    
    // Calculate net revenue (price - discount - lab cost)
    Object.values(stats).forEach(s => {
      s.netRevenue = s.totalPrice - s.totalDiscount - s.totalLaborator;
    });
    
    return Object.values(stats).sort((a, b) => b.totalLaborator - a.totalLaborator);
  }, [labEntries]);

  // Totals
  const totals = useMemo(() => {
    const totalPrice = labEntries.reduce((sum, e) => sum + e.treatmentPrice, 0);
    const totalDiscount = labEntries.reduce((sum, e) => sum + (e.treatmentPrice * (e.discountPercent / 100)), 0);
    const totalLaborator = labEntries.reduce((sum, e) => sum + e.laboratorCost, 0);
    return {
      totalLaborator,
      totalPrice,
      totalDiscount,
      netRevenue: totalPrice - totalDiscount - totalLaborator,
      count: labEntries.length,
      countWithDiscount: labEntries.filter(e => e.discountPercent > 0).length,
    };
  }, [labEntries]);

  // Export to Excel
  const handleExport = () => {
    const workbook = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Raport Laborator'],
      [`Perioada: ${format(dateRange.from, 'dd.MM.yyyy')} - ${format(dateRange.to, 'dd.MM.yyyy')}`],
      [],
      ['Doctor', 'Total Laborator', 'Total Preț', 'Discount', 'Venit Net', 'Nr. Lucrări'],
      ...doctorLabStats.map(d => [
        d.doctorName,
        d.totalLaborator,
        d.totalPrice,
        d.totalDiscount,
        d.netRevenue,
        d.entries.length,
      ]),
      [],
      ['TOTAL', totals.totalLaborator, totals.totalPrice, totals.totalDiscount, totals.netRevenue, totals.count],
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Sumar');
    
    // Detailed entries sheet
    const detailsData = [
      ['Data', 'Pacient', 'Telefon', 'Doctor', 'Tratament', 'Laborator', 'Preț', 'Discount %', 'Discount RON', 'Venit Net'],
      ...labEntries.map(e => {
        const discountAmount = e.treatmentPrice * (e.discountPercent / 100);
        const netRevenue = e.treatmentPrice - discountAmount - e.laboratorCost;
        return [
          format(new Date(e.date), 'dd.MM.yyyy'),
          e.patientName,
          e.patientPhone,
          e.doctorName,
          e.treatmentName,
          e.laboratorCost,
          e.treatmentPrice,
          e.discountPercent > 0 ? `${e.discountPercent}%` : '',
          discountAmount > 0 ? discountAmount : '',
          netRevenue,
        ];
      }),
    ];
    
    const detailsSheet = XLSX.utils.aoa_to_sheet(detailsData);
    detailsSheet['!cols'] = [
      { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 35 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 }
    ];
    XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Detalii');
    
    const filename = `Raport_Laborator_${format(dateRange.from, 'dd-MM-yyyy')}_${format(dateRange.to, 'dd-MM-yyyy')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-800 dark:bg-purple-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-400">Total Laborator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-400">
              {totals.totalLaborator.toLocaleString()} RON
            </div>
            <p className="text-xs text-muted-foreground">{totals.count} lucrări</p>
          </CardContent>
        </Card>
        
        <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Preț Tratamente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {totals.totalPrice.toLocaleString()} RON
            </div>
            <p className="text-xs text-muted-foreground">cu lucrări laborator</p>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-400">Venit Net</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {totals.netRevenue.toLocaleString()} RON
            </div>
            <p className="text-xs text-muted-foreground">preț - laborator</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Nr. Doctori</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doctorLabStats.length}</div>
            <p className="text-xs text-muted-foreground">cu lucrări laborator</p>
          </CardContent>
        </Card>
      </div>

      {/* Doctor Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-purple-500" />
                Laborator per Doctor
              </CardTitle>
              <CardDescription>
                Sumar costuri laborator pe doctor ({doctorLabStats.length} doctori)
              </CardDescription>
            </div>
            <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {doctorLabStats.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nu există lucrări de laborator în perioada selectată
            </div>
          ) : (
            <div className="space-y-4">
              {doctorLabStats.map((doctor) => (
                <div key={doctor.doctorName} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: doctor.doctorColor }}
                      />
                      <span className="font-medium">{doctor.doctorName}</span>
                      <span className="text-sm text-muted-foreground">
                        ({doctor.entries.length} lucrări)
                      </span>
                    </div>
                    <span className="text-lg font-bold text-purple-600">
                      {doctor.totalLaborator.toLocaleString()} RON
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm mb-3">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-muted-foreground">Preț tratamente:</span>
                      <span className="font-medium text-blue-600">{doctor.totalPrice.toLocaleString()} RON</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-green-500" />
                      <span className="text-muted-foreground">Venit net:</span>
                      <span className="font-medium text-green-600">{doctor.netRevenue.toLocaleString()} RON</span>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                    <div 
                      className="h-full bg-purple-500 transition-all"
                      style={{ width: `${(doctor.totalLaborator / doctor.totalPrice) * 100}%` }}
                    />
                    <div 
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${(doctor.netRevenue / doctor.totalPrice) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              
              {/* Total Summary */}
              <div className="p-4 rounded-lg border-2 border-purple-500/20 bg-purple-500/5">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-purple-600">
                    {totals.totalLaborator.toLocaleString()} RON
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm mt-1">
                  <span className="text-blue-600 font-medium">
                    Preț tratamente: {totals.totalPrice.toLocaleString()} RON
                  </span>
                  <span className="text-green-600 font-medium">
                    Venit net: {totals.netRevenue.toLocaleString()} RON
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed entries table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalii Lucrări Laborator</CardTitle>
          <CardDescription>Lista completă a tratamentelor cu costuri laborator</CardDescription>
        </CardHeader>
        <CardContent>
          {labEntries.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nu există lucrări de laborator în perioada selectată
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Pacient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Tratament</TableHead>
                    <TableHead className="text-right">Laborator</TableHead>
                    <TableHead className="text-right">Preț</TableHead>
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {labEntries.map((entry) => {
                    const discountAmount = entry.treatmentPrice * (entry.discountPercent / 100);
                    const netRevenue = entry.treatmentPrice - discountAmount - entry.laboratorCost;
                    return (
                      <TableRow key={entry.id}>
                        <TableCell className="whitespace-nowrap">
                          {format(new Date(entry.date), 'dd.MM.yyyy', { locale: ro })}
                        </TableCell>
                        <TableCell>
                          <div>{entry.patientName}</div>
                          <div className="text-xs text-muted-foreground">{entry.patientPhone}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-2 h-2 rounded-full" 
                              style={{ backgroundColor: entry.doctorColor }}
                            />
                            {entry.doctorName}
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate" title={entry.treatmentName}>
                          {entry.treatmentName}
                        </TableCell>
                        <TableCell className="text-right font-medium text-purple-600">
                          {entry.laboratorCost.toLocaleString()} RON
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.treatmentPrice.toLocaleString()} RON
                        </TableCell>
                        <TableCell className="text-right">
                          {entry.discountPercent > 0 ? (
                            <span className="text-orange-600 font-medium">
                              {entry.discountPercent}% ({discountAmount.toLocaleString()} RON)
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          {netRevenue.toLocaleString()} RON
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
