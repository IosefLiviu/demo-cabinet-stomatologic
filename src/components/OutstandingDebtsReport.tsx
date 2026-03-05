import { useState, useMemo, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Download, Search, Filter, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useDoctors } from '@/hooks/useDoctors';
import * as XLSX from 'xlsx';

interface OutstandingDebtsReportProps {
  onPatientClick?: (patientId: string) => void;
}

interface DebtRow {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  billingMonth: string;
  treatmentDetails: string;
  doctorId: string;
  doctorName: string;
  totalAmount: number;
  paidAmount: number;
  debt: number;
  daysOverdue: number;
}

export function OutstandingDebtsReport({ onPatientClick }: OutstandingDebtsReportProps) {
  const { doctors } = useDoctors();
  const [searchName, setSearchName] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'over30'>('all');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');
  const [debtsData, setDebtsData] = useState<DebtRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch ALL completed appointments with outstanding debts
  useEffect(() => {
    const fetchDebts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('appointments')
          .select(`
            *,
            patients (id, first_name, last_name, phone),
            treatments (id, name),
            doctors (id, name),
            appointment_treatments (id, treatment_name, price, decont, discount_percent)
          `)
          .eq('status', 'completed')
          .eq('is_paid', false)
          .order('appointment_date', { ascending: false });

        if (error) throw error;

        const today = new Date();
        const rows: DebtRow[] = [];

        for (const a of data || []) {
          const payableAmount = a.appointment_treatments?.length
            ? a.appointment_treatments.reduce((sum: number, t: any) => {
                const tPrice = t.price || 0;
                const tCas = t.decont || 0;
                const discountPercent = t.discount_percent || 0;
                const priceAfterCas = tPrice - tCas;
                const discountAmount = priceAfterCas * (discountPercent / 100);
                return sum + (priceAfterCas - discountAmount);
              }, 0)
            : (a.price || 0);

          const paidAmount = a.paid_amount ?? 0;
          const debt = Math.max(0, payableAmount - paidAmount);
          if (debt <= 0) continue;

          const aptDate = new Date(a.appointment_date);
          const treatmentNames = a.appointment_treatments?.length
            ? a.appointment_treatments.map((t: any) => t.treatment_name).join(', ')
            : ((a.treatments as any)?.name || 'N/A');

          rows.push({
            id: a.id,
            patientId: a.patient_id,
            patientName: a.patients ? `${(a.patients as any).last_name} ${(a.patients as any).first_name}` : 'N/A',
            patientPhone: (a.patients as any)?.phone || '',
            appointmentDate: a.appointment_date,
            billingMonth: format(aptDate, 'MMMM yyyy', { locale: ro }),
            treatmentDetails: treatmentNames,
            doctorId: a.doctor_id || '',
            doctorName: (a.doctors as any)?.name || 'N/A',
            totalAmount: payableAmount,
            paidAmount,
            debt,
            daysOverdue: differenceInDays(today, aptDate),
          });
        }

        rows.sort((a, b) => b.debt - a.debt);
        setDebtsData(rows);
      } catch (error) {
        console.error('Error fetching outstanding debts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDebts();
  }, []);

  // Apply filters
  const filteredDebts = useMemo(() => {
    let result = debtsData;

    if (selectedDoctorId !== 'all') {
      result = result.filter(d => d.doctorId === selectedDoctorId);
    }

    if (searchName.trim()) {
      const search = searchName.toLowerCase();
      result = result.filter(d => d.patientName.toLowerCase().includes(search));
    }

    if (statusFilter === 'over30') {
      result = result.filter(d => d.daysOverdue > 30);
    }

    return result;
  }, [debtsData, searchName, statusFilter, selectedDoctorId]);

  const totalDebt = filteredDebts.reduce((sum, d) => sum + d.debt, 0);
  const totalAmount = filteredDebts.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalPaid = filteredDebts.reduce((sum, d) => sum + d.paidAmount, 0);

  const exportToExcel = () => {
    const data = [
      ['Raport Restanțe', '', '', '', '', '', ''],
      ['Filtru', statusFilter === 'over30' ? 'Restanțe peste 30 zile' : 'Toate restanțele', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['Pacient', 'Detalii Programare', 'Doctor', 'Luna Facturării', 'Sumă Totală (RON)', 'Sumă Achitată (RON)', 'Restanță (RON)', 'Zile Restante'],
      ...filteredDebts.map(d => [
        d.patientName,
        d.treatmentDetails,
        d.doctorName,
        d.billingMonth,
        d.totalAmount,
        d.paidAmount,
        d.debt,
        d.daysOverdue,
      ]),
      ['', '', '', '', '', '', '', ''],
      ['TOTAL', '', '', '', totalAmount, totalPaid, totalDebt, ''],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [
      { wch: 25 }, { wch: 35 }, { wch: 20 }, { wch: 18 },
      { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Restanțe');
    XLSX.writeFile(wb, `Restante_${format(new Date(), 'dd-MM-yyyy')}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Se încarcă restanțele...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută pacient..."
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Doctor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toți doctorii</SelectItem>
              {doctors.map(d => (
                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v: 'all' | 'over30') => setStatusFilter(v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate restanțele</SelectItem>
              <SelectItem value="over30">Restanțe peste 30 de zile</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button variant="outline" size="sm" className="gap-2 ml-auto" onClick={exportToExcel}>
          <Download className="h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Restanțe</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalDebt.toLocaleString()} RON</div>
            <p className="text-xs text-muted-foreground">{filteredDebts.length} programări cu restanță</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Facturat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAmount.toLocaleString()} RON</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Achitat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalPaid.toLocaleString()} RON</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredDebts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nu există restanțe.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Pacient</TableHead>
                  <TableHead>Detalii Programare</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Luna Facturării</TableHead>
                  <TableHead className="text-right">Sumă Totală</TableHead>
                  <TableHead className="text-right">Achitat</TableHead>
                  <TableHead className="text-right">Restanță</TableHead>
                  <TableHead className="text-right">Zile</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDebts.map(d => (
                  <TableRow
                    key={d.id}
                    className={onPatientClick ? 'cursor-pointer hover:bg-muted/80' : ''}
                    onClick={() => onPatientClick?.(d.patientId)}
                  >
                    <TableCell className="font-medium text-primary underline-offset-2 hover:underline">{d.patientName}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{d.treatmentDetails}</TableCell>
                    <TableCell>{d.doctorName}</TableCell>
                    <TableCell className="capitalize">{d.billingMonth}</TableCell>
                    <TableCell className="text-right">{d.totalAmount.toLocaleString()} RON</TableCell>
                    <TableCell className="text-right">{d.paidAmount.toLocaleString()} RON</TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{d.debt.toLocaleString()} RON</TableCell>
                    <TableCell className="text-right">
                      <span className={d.daysOverdue > 30 ? 'text-destructive font-semibold' : ''}>
                        {d.daysOverdue}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Totals row */}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={4}>TOTAL</TableCell>
                  <TableCell className="text-right">{totalAmount.toLocaleString()} RON</TableCell>
                  <TableCell className="text-right">{totalPaid.toLocaleString()} RON</TableCell>
                  <TableCell className="text-right text-destructive">{totalDebt.toLocaleString()} RON</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
