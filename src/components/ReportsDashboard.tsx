import { useState, useMemo, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Calendar as CalendarIcon, TrendingUp, Users, DollarSign, Clock, PieChart, UserCircle, Filter, Download, FlaskConical, ClipboardList, Percent, AlertCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppointmentsPatientReport } from './AppointmentsPatientReport';
import { DiscountedAppointmentsReport } from './DiscountedAppointmentsReport';
import { LaboratoryReport } from './LaboratoryReport';
import { PendingAppointmentsByDoctorReport } from './PendingAppointmentsByDoctorReport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { AppointmentDB } from '@/hooks/useAppointmentsDB';
import { Tooltip } from 'recharts';
import { useDoctors } from '@/hooks/useDoctors';
import { useAuth } from '@/hooks/useAuth';
import * as XLSX from 'xlsx';

interface ReportsDashboardProps {
  appointments: AppointmentDB[];
  loading: boolean;
  onFetchRange: (startDate: string, endDate: string) => Promise<void>;
}

const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export function ReportsDashboard({ appointments, loading, onFetchRange }: ReportsDashboardProps) {
  const { doctors } = useDoctors();
  const { isAdmin, doctorId } = useAuth();
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [period, setPeriod] = useState<'week' | 'month' | 'custom'>('month');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('all');

  // Set initial doctor filter based on user role
  useEffect(() => {
    if (!isAdmin && doctorId) {
      setSelectedDoctorId(doctorId);
    }
  }, [isAdmin, doctorId]);

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
    // Only count stats for appointments whose date is within the selected range
    // (exclude debt-payment-only appointments fetched from outside the range)
    const completed = filteredAppointments.filter(a => {
      if (a.status !== 'completed') return false;
      const d = new Date(a.appointment_date);
      return d >= dateRange.from && d <= dateRange.to;
    });
    
    // Calculate totalRevenue as net payable (after discounts), and CAS/Laborator only for non-100% discounted treatments
    let totalRevenue = 0;
    let totalCas = 0;
    let totalLaborator = 0;
    let totalDiscount = 0;
    let totalGrossPrice = 0;
    
    completed.forEach(a => {
      // Calculate gross price, discount amount, and net payable for this appointment
      let appointmentGross = 0;
      let appointmentDiscount = 0;
      
      if (a.appointment_treatments?.length) {
        a.appointment_treatments.forEach(t => {
          const tPrice = t.price || 0;
          const tCas = t.decont || 0;
          const discountPercent = (t as any).discount_percent || 0;
          const priceAfterCas = tPrice - tCas;
          const discountAmount = priceAfterCas * (discountPercent / 100);
          
          appointmentGross += priceAfterCas;
          appointmentDiscount += discountAmount;
        });
      } else {
        appointmentGross = a.price || 0;
      }
      
      totalGrossPrice += appointmentGross;
      totalDiscount += appointmentDiscount;
      totalRevenue += (appointmentGross - appointmentDiscount);
      
      // Calculate CAS and Laborator from appointment treatments (only for non-100% discounted)
      if (a.appointment_treatments && a.appointment_treatments.length > 0) {
        a.appointment_treatments.forEach(t => {
          const discountPercent = (t as any).discount_percent || 0;
          if (discountPercent < 100) {
            totalCas += (t.decont || 0);
            totalLaborator += (Number((t as any).laborator) || 0);
          }
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
      
      // Calculate payable amount including discount_percent per treatment
      // payable = sum( (price - decont) * (1 - discount_percent/100) )
      const payableAmount = a.appointment_treatments?.length
        ? a.appointment_treatments.reduce((sum, t) => {
            const tPrice = t.price || 0;
            const tCas = t.decont || 0;
            const discountPercent = (t as any).discount_percent || 0;
            const priceAfterCas = tPrice - tCas;
            const discountAmount = priceAfterCas * (discountPercent / 100);
            return sum + (priceAfterCas - discountAmount);
          }, 0)
        : price;
      
      if (method === 'card') {
        // For card payment, use payable (net) amount, not gross price
        cardRevenue += payableAmount;
      } else if (method === 'cash') {
        cashRevenue += payableAmount;
      } else if (method === 'partial_card') {
        partialCardRevenue += paidAmount;
        // Remaining debt is based on payable amount (after CAS + discount)
        remainingDebt += Math.max(0, payableAmount - paidAmount);
      } else if (method === 'partial_cash') {
        partialCashRevenue += paidAmount;
        remainingDebt += Math.max(0, payableAmount - paidAmount);
      } else if (method === 'unpaid' || !a.is_paid) {
        unpaidRevenue += payableAmount;
        remainingDebt += payableAmount;
      } else if (a.is_paid) {
        // Fallback for old data without explicit method
        cashRevenue += payableAmount;
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
      totalGrossPrice,
      totalDiscount,
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

  // Helper function to check if a date falls within the selected range
  const isDateInRange = (dateStr: string | undefined): boolean => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    return date >= dateRange.from && date <= dateRange.to;
  };

  // Helper function to check if appointment date is in range
  const isAppointmentInRange = (appointmentDate: string): boolean => {
    const date = new Date(appointmentDate);
    return date >= dateRange.from && date <= dateRange.to;
  };

  // Doctor revenue data - includes all appointments with cash/card breakdown, CAS and Laborator
  // IMPORTANT: Revenue attribution follows cash flow principle:
  // - Initial payment (paid_amount - debt_amount) is attributed to the appointment month
  // - Debt payment (debt_amount) is attributed to the month when debt_paid_at falls
  const doctorRevenueData = useMemo(() => {
    const doctorStats: Record<string, { name: string; revenue: number; discount: number; paid: number; paidCard: number; paidCash: number; unpaid: number; scheduled: number; cas: number; laborator: number; netLabRevenue: number; totalWithNetLab: number; totalWithNetLabAndUnpaid: number; sixtPercentTotal: number; fortyPercentTotal: number; appointments: number; color: string }> = {};

    const initDoctor = (doctorName: string, doctorColor: string) => {
      if (!doctorStats[doctorName]) {
        doctorStats[doctorName] = { 
          name: doctorName, 
          revenue: 0, 
          discount: 0,
          paid: 0,
          paidCard: 0,
          paidCash: 0,
          unpaid: 0, 
          scheduled: 0,
          cas: 0,
          laborator: 0,
          netLabRevenue: 0,
          totalWithNetLab: 0,
          totalWithNetLabAndUnpaid: 0,
          sixtPercentTotal: 0,
          fortyPercentTotal: 0,
          appointments: 0,
          color: doctorColor 
        };
      }
    };

    // Process all appointments
    filteredAppointments.forEach(a => {
      const doctorName = a.doctors?.name || 'Fără doctor';
      const doctorColor = a.doctors?.color || '#6B7280';
      initDoctor(doctorName, doctorColor);
      
      const price = a.price || 0;
      const appointmentInRange = isAppointmentInRange(a.appointment_date);
      const debtAmount = (a as any).debt_amount || 0;
      const debtPaidAt = (a as any).debt_paid_at;
      const debtPaidInCurrentPeriod = isDateInRange(debtPaidAt);
      
      // Only count appointment towards totals if it's in the date range
      if (appointmentInRange) {
        doctorStats[doctorName].appointments += 1;
      }
      
      if (a.status === 'completed') {
        // Calculate payable amount including discount_percent per treatment
        let appointmentDiscount = 0;
        let appointmentTotalPrice = 0;
        let appointmentCas = 0;
        
        const payableAmount = a.appointment_treatments?.length
          ? a.appointment_treatments.reduce((sum, t) => {
              const tPrice = t.price || 0;
              const tCas = t.decont || 0;
              const discountPercent = (t as any).discount_percent || 0;
              const priceAfterCas = tPrice - tCas;
              const discountAmount = priceAfterCas * (discountPercent / 100);
              appointmentDiscount += discountAmount;
              appointmentTotalPrice += tPrice;
              appointmentCas += tCas;
              return sum + (priceAfterCas - discountAmount);
            }, 0)
          : price;
        
        const method = getPaymentMethod(a);
        const totalPaidAmount = a.paid_amount ?? (a.is_paid ? payableAmount : 0);
        
        // CASE 1: Appointment is in range - process normally but exclude debt if paid in different period
        if (appointmentInRange) {
          // Revenue reflects net payable amount (after discounts)
          doctorStats[doctorName].revenue += payableAmount;
          doctorStats[doctorName].discount += appointmentDiscount;
          
          // Calculate CAS and Laborator from appointment treatments
          if (a.appointment_treatments && a.appointment_treatments.length > 0) {
            a.appointment_treatments.forEach(t => {
              const discountPercent = (t as any).discount_percent || 0;
              if (discountPercent < 100) {
                doctorStats[doctorName].cas += (t.decont || 0);
                const labCost = Number((t as any).laborator) || 0;
                doctorStats[doctorName].laborator += labCost;
                if (labCost > 0) {
                  const treatmentPrice = t.price || 0;
                  const discountedLabRevenue = (treatmentPrice - labCost) * (1 - discountPercent / 100);
                  doctorStats[doctorName].netLabRevenue += discountedLabRevenue;
                }
              }
            });
          }
          
          // Calculate amount to attribute to THIS period
          // If debt was paid in a DIFFERENT period, exclude it
          let periodPaidAmount = totalPaidAmount;
          if (debtAmount > 0 && debtPaidAt && !debtPaidInCurrentPeriod) {
            periodPaidAmount = Math.max(0, totalPaidAmount - debtAmount);
          }
          
          if (method === 'card') {
            doctorStats[doctorName].paidCard += payableAmount;
            doctorStats[doctorName].paid += payableAmount;
            doctorStats[doctorName].totalWithNetLab += (periodPaidAmount + appointmentCas);
          } else if (method === 'cash') {
            doctorStats[doctorName].paidCash += payableAmount;
            doctorStats[doctorName].paid += payableAmount;
            doctorStats[doctorName].totalWithNetLab += (periodPaidAmount + appointmentCas);
          } else if (method === 'partial_card') {
            doctorStats[doctorName].paidCard += periodPaidAmount;
            doctorStats[doctorName].paid += periodPaidAmount;
            doctorStats[doctorName].unpaid += Math.max(0, payableAmount - periodPaidAmount);
            doctorStats[doctorName].totalWithNetLab += (periodPaidAmount + appointmentCas);
          } else if (method === 'partial_cash') {
            doctorStats[doctorName].paidCash += periodPaidAmount;
            doctorStats[doctorName].paid += periodPaidAmount;
            doctorStats[doctorName].unpaid += Math.max(0, payableAmount - periodPaidAmount);
            doctorStats[doctorName].totalWithNetLab += (periodPaidAmount + appointmentCas);
          } else if (method === 'unpaid' || !a.is_paid) {
            doctorStats[doctorName].unpaid += payableAmount;
            // CAS is always attributed to the appointment month regardless of payment status
            doctorStats[doctorName].totalWithNetLab += appointmentCas;
          } else if (a.is_paid) {
            doctorStats[doctorName].paidCash += payableAmount;
            doctorStats[doctorName].paid += payableAmount;
            doctorStats[doctorName].totalWithNetLab += (periodPaidAmount + appointmentCas);
          }
        }
        // CASE 2: Appointment is OUTSIDE range but debt was paid IN this period
        // Only add the debt payment amount to this period's revenue
        else if (debtAmount > 0 && debtPaidInCurrentPeriod) {
          // Add only the debt amount to this period's cash flow
          doctorStats[doctorName].paid += debtAmount;
          doctorStats[doctorName].paidCash += debtAmount; // Assume cash for debt payments
          doctorStats[doctorName].totalWithNetLab += debtAmount;
        }
      } else if (a.status === 'scheduled' && appointmentInRange) {
        doctorStats[doctorName].scheduled += price;
      }
    });

    // Calculate final values for each doctor
    Object.values(doctorStats).forEach(stats => {
      const totalWithNetLabMinusLab = stats.totalWithNetLab - stats.laborator;
      stats.totalWithNetLabAndUnpaid = totalWithNetLabMinusLab + stats.unpaid;
      
      const has50Commission = stats.name.toLowerCase().includes('dumitru bacalim') || stats.name.toLowerCase().includes('sepand');
      const doctorCommissionRate = has50Commission ? 0.5 : 0.4;
      const clinicCommissionRate = has50Commission ? 0.5 : 0.6;
      
      stats.sixtPercentTotal = Math.round(totalWithNetLabMinusLab * clinicCommissionRate);
      stats.fortyPercentTotal = Math.round(totalWithNetLabMinusLab * doctorCommissionRate);
    });

    return Object.values(doctorStats).sort((a, b) => (b.revenue + b.scheduled) - (a.revenue + a.scheduled));
  }, [filteredAppointments, dateRange]);

  // Unpaid amounts by patient report
  const unpaidByPatientData = useMemo(() => {
    const unpaidAppointments = filteredAppointments.filter(a => {
      const method = getPaymentMethod(a);
      const paidAmount = a.paid_amount ?? (a.is_paid ? (a.price || 0) : 0);
      
      // Calculate payable amount including discount
      const payableAmount = a.appointment_treatments?.length
        ? a.appointment_treatments.reduce((sum, t) => {
            const tPrice = t.price || 0;
            const tCas = t.decont || 0;
            const discountPercent = (t as any).discount_percent || 0;
            const priceAfterCas = tPrice - tCas;
            const discountAmount = priceAfterCas * (discountPercent / 100);
            return sum + (priceAfterCas - discountAmount);
          }, 0)
        : (a.price || 0);
      
      // Include if payment method is unpaid, partial payment with remaining balance, or not paid
      // Only include if there's actually something to pay (payableAmount > 0)
      if (payableAmount <= 0) return false;
      if (method === 'unpaid') return true;
      if ((method === 'partial_card' || method === 'partial_cash') && paidAmount < payableAmount) return true;
      if (!a.is_paid && a.status === 'completed') return true;
      return false;
    });

    return unpaidAppointments.map(a => {
      const price = a.price || 0;
      const paidAmount = a.paid_amount ?? (a.is_paid ? price : 0);
      
      // Calculate payable amount including discount_percent
      const payableAmount = a.appointment_treatments?.length
        ? a.appointment_treatments.reduce((sum, t) => {
            const tPrice = t.price || 0;
            const tCas = t.decont || 0;
            const discountPercent = (t as any).discount_percent || 0;
            const priceAfterCas = tPrice - tCas;
            const discountAmount = priceAfterCas * (discountPercent / 100);
            return sum + (priceAfterCas - discountAmount);
          }, 0)
        : price;
      
      // Unpaid amount is what remains after CAS + discount and partial payments
      const unpaidAmount = Math.max(0, payableAmount - paidAmount);
      
      return {
        id: a.id,
        patientName: a.patients ? `${a.patients.first_name} ${a.patients.last_name}` : 'N/A',
        patientPhone: a.patients?.phone || 'N/A',
        date: a.appointment_date,
        treatment: a.treatments?.name || 'N/A',
        doctor: a.doctors?.name || 'N/A',
        totalPrice: price,
        payableAmount: payableAmount,
        paidAmount: paidAmount,
        unpaidAmount: unpaidAmount
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
      ['Preț Brut (RON)', stats.totalGrossPrice],
      ['Discount Total (RON)', stats.totalDiscount],
      ['Venituri Nete (RON)', stats.totalRevenue],
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
      ['Doctor', 'Programări', 'Discount (RON)', 'Card (RON)', 'Cash (RON)', 'Neachitat (RON)', 'Planificat (RON)', 'CAS (RON)', 'Laborator (RON)', 'Venit Net Lab. (RON)', 'Încasări + Net Lab. (RON)', 'Clinică (RON)', 'Medic (RON)', 'Total (RON)'],
      ...doctorRevenueData.map(d => [
        d.name,
        d.appointments,
        d.discount,
        d.paidCard,
        d.paidCash,
        d.unpaid,
        d.scheduled,
        d.cas,
        d.laborator,
        d.netLabRevenue,
        d.totalWithNetLab,
        d.sixtPercentTotal,
        d.fortyPercentTotal,
        d.revenue + d.scheduled
      ]),
      ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['TOTAL', 
        doctorRevenueData.reduce((sum, d) => sum + d.appointments, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.discount, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.paidCard, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.paidCash, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.unpaid, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.scheduled, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.cas, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.laborator, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.netLabRevenue, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.totalWithNetLab, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.sixtPercentTotal, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.fortyPercentTotal, 0),
        doctorRevenueData.reduce((sum, d) => sum + d.revenue + d.scheduled, 0)
      ]
    ];
    const doctorSheet = XLSX.utils.aoa_to_sheet(doctorData);
    doctorSheet['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, doctorSheet, 'Încasări Doctori');
    
    // Sheet 3: Unpaid by Patient
    const unpaidData = [
      ['Sume Neachitate pe Pacienți', '', '', '', '', '', ''],
      ['Perioadă', `${format(dateRange.from, 'dd.MM.yyyy')} - ${format(dateRange.to, 'dd.MM.yyyy')}`, '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['Data', 'Pacient', 'Telefon', 'Tratament', 'Doctor', 'Preț Total (RON)', 'Achitat (RON)', 'Neachitat (RON)'],
      ...unpaidByPatientData.map(u => [
        format(new Date(u.date), 'dd.MM.yyyy'),
        u.patientName,
        u.patientPhone,
        u.treatment,
        u.doctor,
        u.totalPrice,
        u.paidAmount,
        u.unpaidAmount
      ]),
      ['', '', '', '', '', '', '', ''],
      ['TOTAL', '', '', '', '', 
        unpaidByPatientData.reduce((sum, u) => sum + u.totalPrice, 0),
        unpaidByPatientData.reduce((sum, u) => sum + u.paidAmount, 0),
        unpaidByPatientData.reduce((sum, u) => sum + u.unpaidAmount, 0)
      ]
    ];
    const unpaidSheet = XLSX.utils.aoa_to_sheet(unpaidData);
    unpaidSheet['!cols'] = [
      { wch: 12 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, 
      { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }
    ];
    XLSX.utils.book_append_sheet(workbook, unpaidSheet, 'Sume Neachitate');
    
    // Sheet 4: Detailed Appointments
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
    <Tabs defaultValue="financial" className="space-y-6">
      <TabsList className="grid w-full grid-cols-5 max-w-3xl">
        <TabsTrigger value="financial" className="gap-2">
          <DollarSign className="h-4 w-4" />
          Financiar
        </TabsTrigger>
        <TabsTrigger value="pending" className="gap-2">
          <AlertCircle className="h-4 w-4" />
          Nefinalizate
        </TabsTrigger>
        <TabsTrigger value="laboratory" className="gap-2">
          <FlaskConical className="h-4 w-4" />
          Laborator
        </TabsTrigger>
        <TabsTrigger value="patients" className="gap-2">
          <ClipboardList className="h-4 w-4" />
          Pe Pacienți
        </TabsTrigger>
        <TabsTrigger value="discounts" className="gap-2">
          <Percent className="h-4 w-4" />
          Discounturi
        </TabsTrigger>
      </TabsList>

      <TabsContent value="financial">
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
              <Select 
                value={selectedDoctorId} 
                onValueChange={setSelectedDoctorId}
                disabled={!isAdmin && !!doctorId}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Toți doctorii" />
                </SelectTrigger>
                <SelectContent>
                  {isAdmin && <SelectItem value="all">Toți doctorii</SelectItem>}
                  {doctors
                    .filter(doctor => isAdmin || doctor.id === doctorId)
                    .map((doctor) => (
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
              {!isAdmin && doctorId && (
                <span className="text-xs text-muted-foreground">(doar datele tale)</span>
              )}
            </div>

            {/* Export Button */}
            <Button variant="outline" size="sm" className="gap-2 ml-auto" onClick={exportToExcel}>
              <Download className="h-4 w-4" />
              Export Excel
            </Button>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
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
            <CardTitle className="text-sm font-medium">Venituri Nete</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString()} RON</div>
            <p className="text-xs text-muted-foreground">
              {stats.paidRevenue.toLocaleString()} încasați, {stats.unpaidRevenue.toLocaleString()} restanți
            </p>
          </CardContent>
        </Card>

        <Card className="border-rose-200 bg-rose-50/50 dark:border-rose-800 dark:bg-rose-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-rose-700 dark:text-rose-400">Discount Acordat</CardTitle>
            <Percent className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-700 dark:text-rose-400">{stats.totalDiscount.toLocaleString()} RON</div>
            <p className="text-xs text-muted-foreground">
              din {stats.totalGrossPrice.toLocaleString()} brut
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
                // Total value includes revenue (payable amount) + CAS + scheduled
                // This represents the full initial price before CAS deduction
                const totalValueWithCas = doctor.revenue + doctor.cas + doctor.scheduled;
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
                      <span className="text-lg font-bold">{totalValueWithCas.toLocaleString()} RON</span>
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
                      {doctor.discount > 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-rose-500" />
                          <span className="text-muted-foreground">Discount:</span>
                          <span className="font-medium text-rose-600">{doctor.discount.toLocaleString()} RON</span>
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
                      {doctor.sixtPercentTotal !== 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-muted-foreground">Clinică:</span>
                          <span className="font-medium text-amber-600">{doctor.sixtPercentTotal.toLocaleString()} RON</span>
                        </div>
                      )}
                      {doctor.fortyPercentTotal !== 0 && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 rounded-full bg-lime-500" />
                          <span className="text-muted-foreground">Medic:</span>
                          <span className="font-medium text-lime-600">{doctor.fortyPercentTotal.toLocaleString()} RON</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <div className="h-2 rounded-full bg-muted overflow-hidden flex">
                        {totalValueWithCas > 0 && (
                          <>
                            <div 
                              className="h-full bg-blue-500 transition-all"
                              style={{ width: `${(doctor.paidCard / totalValueWithCas) * 100}%` }}
                            />
                            <div 
                              className="h-full bg-green-500 transition-all"
                              style={{ width: `${(doctor.paidCash / totalValueWithCas) * 100}%` }}
                            />
                            <div 
                              className="h-full bg-cyan-500 transition-all"
                              style={{ width: `${(doctor.cas / totalValueWithCas) * 100}%` }}
                            />
                            <div 
                              className="h-full bg-orange-500 transition-all"
                              style={{ width: `${(doctor.unpaid / totalValueWithCas) * 100}%` }}
                            />
                            <div 
                              className="h-full bg-purple-500 transition-all"
                              style={{ width: `${(doctor.scheduled / totalValueWithCas) * 100}%` }}
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
                    {doctorRevenueData.reduce((sum, d) => sum + d.revenue + d.cas + d.scheduled, 0).toLocaleString()} RON
                  </span>
                </div>
                <div className="flex flex-wrap gap-4 text-sm mt-1">
                  <span className="text-blue-600 font-medium">
                    Card: {doctorRevenueData.reduce((sum, d) => sum + d.paidCard, 0).toLocaleString()} RON
                  </span>
                  <span className="text-green-600 font-medium">
                    Cash: {doctorRevenueData.reduce((sum, d) => sum + d.paidCash, 0).toLocaleString()} RON
                  </span>
                  <span className="text-rose-600 font-medium">
                    Discount: {doctorRevenueData.reduce((sum, d) => sum + d.discount, 0).toLocaleString()} RON
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
                  <span className="text-amber-600 font-medium">
                    Clinică: {doctorRevenueData.reduce((sum, d) => sum + d.sixtPercentTotal, 0).toLocaleString()} RON
                  </span>
                  <span className="text-lime-600 font-medium">
                    Medic: {doctorRevenueData.reduce((sum, d) => sum + d.fortyPercentTotal, 0).toLocaleString()} RON
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unpaid Amounts by Patient */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-orange-500" />
            Sume Neachitate pe Pacienți
          </CardTitle>
          <CardDescription>
            Lista pacienților cu sume restante ({unpaidByPatientData.length} înregistrări)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {unpaidByPatientData.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nu există sume neachitate în perioada selectată
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {unpaidByPatientData.map((item) => (
                <div 
                  key={item.id} 
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">{item.patientName}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.date), 'dd.MM.yyyy', { locale: ro })}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {item.treatment} • {item.doctor}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Tel: {item.patientPhone}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-bold text-orange-600">
                        {item.unpaidAmount.toLocaleString()} RON
                      </div>
                      {item.paidAmount > 0 && (
                        <div className="text-xs text-muted-foreground">
                          din {item.totalPrice.toLocaleString()} RON (achitat: {item.paidAmount.toLocaleString()})
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Total Summary */}
              <div className="p-4 rounded-lg border-2 border-orange-500/20 bg-orange-500/5 mt-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Total Neachitat</span>
                  <span className="text-xl font-bold text-orange-600">
                    {unpaidByPatientData.reduce((sum, u) => sum + u.unpaidAmount, 0).toLocaleString()} RON
                  </span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  din {unpaidByPatientData.reduce((sum, u) => sum + u.totalPrice, 0).toLocaleString()} RON total 
                  ({unpaidByPatientData.length} programări)
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
      </TabsContent>

      <TabsContent value="pending">
        <PendingAppointmentsByDoctorReport 
          appointments={appointments} 
          dateRange={dateRange}
        />
      </TabsContent>

      <TabsContent value="laboratory">
        <LaboratoryReport 
          appointments={filteredAppointments} 
          dateRange={dateRange}
        />
      </TabsContent>

      <TabsContent value="patients">
        <AppointmentsPatientReport 
          appointments={appointments} 
          dateRange={dateRange}
        />
      </TabsContent>

      <TabsContent value="discounts">
        <DiscountedAppointmentsReport 
          appointments={appointments} 
          dateRange={dateRange}
        />
      </TabsContent>
    </Tabs>
  );
}
