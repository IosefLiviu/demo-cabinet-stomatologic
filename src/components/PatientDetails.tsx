import { useState, useEffect } from 'react';
import { format, subDays, subMonths, subYears, isAfter } from 'date-fns';
import { ro } from 'date-fns/locale';
import {
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  Pill,
  Heart,
  User,
  FileText,
  Edit,
  Loader2,
  Stethoscope,
  Filter,
  ChevronDown,
  CreditCard,
  Banknote,
  AlertCircle,
  ClipboardList,
  Printer,
  Trash2,
  FileImage,
  Plus,
  CalendarPlus,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Patient } from '@/hooks/usePatients';
import { supabase } from '@/integrations/supabase/client';
import { MiniDentalChart, ToothData } from './MiniDentalChart';
import { PatientDentalStatusTab } from './PatientDentalStatusTab';
import { PatientRecordTab } from './PatientRecordTab';
import { useTreatmentPlans, TreatmentPlan } from '@/hooks/useTreatmentPlans';
import { PatientRadiographs } from './PatientRadiographs';
import { escapeHtml, escapeHtmlArray, escapeNumberArray } from '@/lib/print-utils';
import { cleanDentalNotes } from '@/lib/cleanDentalNotes';
import { CLINIC, getClinicCopyright, getLogoPrintUrl } from '@/constants/clinic';

interface ToothDataRecord {
  toothNumber: number;
  status: string;
  notes?: string;
}

interface TreatmentRecord {
  id: string;
  appointment_id: string;
  treatment_name: string;
  price: number | null;
  cas: number | null;
  appointment_total_cas: number | null;
  appointment_total_payable: number | null;
  tooth_numbers: number[] | null;
  tooth_data: ToothDataRecord[];
  duration: number | null;
  appointment_date: string;
  start_time: string;
  payment_method: 'card' | 'cash' | 'unpaid' | 'partial_card' | 'partial_cash' | null;
  paid_amount: number | null;
  total_price: number | null;
  doctor_name: string | null;
  appointment_notes: string | null;
}

type PaymentMethod = 'card' | 'cash' | 'unpaid' | 'partial_card' | 'partial_cash';

import { SelectedIntervention } from './InterventionSelector';

interface PatientDetailsProps {
  patient: Patient | null;
  open: boolean;
  onClose: () => void;
  onEdit: (patient: Patient) => void;
  onOpenTreatmentPlan?: (patient: Patient) => void;
  onEditTreatmentPlan?: (patient: Patient, plan: TreatmentPlan) => void;
  onCreateAppointment?: (patient: Patient, treatmentName?: string, interventions?: SelectedIntervention[], doctorId?: string) => void;
  initialTab?: string;
}

type PeriodFilter = 'all' | '30days' | '3months' | '1year';

export function PatientDetails({ patient, open, onClose, onEdit, onOpenTreatmentPlan, onEditTreatmentPlan, onCreateAppointment, initialTab }: PatientDetailsProps) {
  const [activeTab, setActiveTab] = useState(initialTab || 'info');
  const [treatmentHistory, setTreatmentHistory] = useState<TreatmentRecord[]>([]);
  const [dentalStatus, setDentalStatus] = useState<ToothData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  
  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState(false);
  const [partialPaymentAmount, setPartialPaymentAmount] = useState<string>('');

  // Treatment plans
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const { loading: loadingPlans, fetchPatientTreatmentPlans, deleteTreatmentPlan } = useTreatmentPlans();
  
  // Track completed teeth per plan item
  const [completedTeethByPlanItem, setCompletedTeethByPlanItem] = useState<Map<string, Set<number>>>(new Map());

  const getFilteredHistory = () => {
    if (periodFilter === 'all') return treatmentHistory;
    
    const now = new Date();
    let cutoffDate: Date;
    
    switch (periodFilter) {
      case '30days':
        cutoffDate = subDays(now, 30);
        break;
      case '3months':
        cutoffDate = subMonths(now, 3);
        break;
      case '1year':
        cutoffDate = subYears(now, 1);
        break;
      default:
        return treatmentHistory;
    }
    
    return treatmentHistory.filter(record => 
      isAfter(new Date(record.appointment_date), cutoffDate)
    );
  };

  const filteredHistory = getFilteredHistory();

  useEffect(() => {
    if (patient && open) {
      fetchTreatmentHistory();
      fetchDentalStatus();
      loadTreatmentPlans();
      // Reset to initialTab when opening
      setActiveTab(initialTab || 'info');
    }
  }, [patient, open, initialTab]);

  const loadTreatmentPlans = async () => {
    if (!patient) return;
    const plans = await fetchPatientTreatmentPlans(patient.id);
    setTreatmentPlans(plans);
    
    // Fetch completed teeth for each plan item
    const planItemIds = plans.flatMap(p => p.items.map(i => i.id)).filter(Boolean) as string[];
    if (planItemIds.length > 0) {
      const { data: completedTreatments } = await supabase
        .from('appointment_treatments')
        .select(`
          plan_item_id,
          tooth_numbers,
          appointments!inner(status)
        `)
        .in('plan_item_id', planItemIds)
        .eq('appointments.status', 'completed');
      
      const teethMap = new Map<string, Set<number>>();
      if (completedTreatments) {
        completedTreatments.forEach(ct => {
          const key = ct.plan_item_id as string;
          if (!teethMap.has(key)) {
            teethMap.set(key, new Set());
          }
          (ct.tooth_numbers || []).forEach((t: number) => {
            teethMap.get(key)!.add(t);
          });
        });
      }
      setCompletedTeethByPlanItem(teethMap);
    }
  };

  const handleDeletePlan = async () => {
    if (!planToDelete) return;
    const success = await deleteTreatmentPlan(planToDelete);
    if (success) {
      setTreatmentPlans(prev => prev.filter(p => p.id !== planToDelete));
    }
    setDeleteDialogOpen(false);
    setPlanToDelete(null);
  };

  const confirmDeletePlan = (planId: string) => {
    setPlanToDelete(planId);
    setDeleteDialogOpen(true);
  };

  const handlePrintPlan = (plan: TreatmentPlan) => {
    const discountPercent = plan.discountPercent || 0;
    const subtotal = plan.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCasPrint = plan.items.reduce((sum, item) => sum + (item.cas || 0), 0);
    const totalDePlataPrint = plan.items.reduce((sum, item) => {
      const itemDiscount = item.discountPercent || 0;
      const gross = item.price * item.quantity;
      const afterCas = gross - (item.cas || 0);
      return sum + Math.max(0, afterCas * (1 - itemDiscount / 100));
    }, 0);
    const discountAmount = totalDePlataPrint * (discountPercent / 100);
    const total = Math.max(0, totalDePlataPrint - discountAmount);
    
    // Collect all selected teeth from the plan - use toothNumbers array if available
    const selectedTeeth = new Set<number>();
    plan.items.forEach(item => {
      if (item.toothNumbers && item.toothNumbers.length > 0) {
        item.toothNumbers.forEach(t => selectedTeeth.add(t));
      } else if (item.toothNumber) {
        selectedTeeth.add(item.toothNumber);
      }
    });
    
    const renderTooth = (tooth: number, isDeciduous: boolean = false) => {
      const isSelected = selectedTeeth.has(tooth);
      const deciduousClass = isDeciduous ? 'deciduous' : '';
      return `<div class="tooth ${deciduousClass} ${isSelected ? 'selected' : ''}">
        ${isSelected ? '<span class="checkmark">✓</span>' : ''}
        <span>${tooth}</span>
      </div>`;
    };
    
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Plan de Tratament</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1a365d; }
            .header { 
              display: flex; justify-content: space-between; align-items: flex-start; 
              margin-bottom: 20px; border-bottom: 3px solid #b8860b; padding-bottom: 15px;
              background: linear-gradient(to right, #fef9e7, #fff8e1, #fef9e7);
              padding: 15px; border-radius: 8px;
            }
            .logo-section { display: flex; align-items: center; gap: 10px; }
            .logo { width: 120px; height: 80px; object-fit: contain; }
            .header h1 { font-size: 18px; margin: 0; color: #b8860b; }
            .clinic-name { font-weight: bold; font-size: 14px; color: #b8860b; }
            .section { margin: 15px 0; }
            .section-title { font-weight: bold; margin-bottom: 5px; color: #b8860b; }
            .dental-chart { margin: 20px 0; text-align: center; }
            .dental-row { display: flex; justify-content: center; gap: 2px; margin: 5px 0; }
            .tooth { width: 28px; height: 34px; border: 1px solid #b8860b; text-align: center; font-size: 9px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
            .tooth.deciduous { width: 26px; height: 30px; border-radius: 50%; border-style: dashed; }
            .tooth.selected { background: linear-gradient(to bottom, #fef9e7, #fff8e1); border: 2px solid #b8860b; font-weight: bold; }
            .tooth.deciduous.selected { border-style: dashed; }
            .tooth .checkmark { color: #228B22; font-size: 12px; font-weight: bold; line-height: 1; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 12px; }
            th, td { border: 1px solid #b8860b; padding: 6px; text-align: left; }
            th { background: linear-gradient(to bottom, #b8860b, #9a7209); color: #fff; }
            .total { font-weight: bold; text-align: right; margin-top: 10px; font-size: 14px; color: #b8860b; }
            .discount-info { text-align: right; font-size: 12px; color: #666; }
            .clinic-contact { text-align: right; font-size: 11px; color: #b8860b; }
            .clinic-contact p { margin: 2px 0; }
            @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <img src="${getLogoPrintUrl()}" alt="Perfect Smile Logo" class="logo" />
              <div style="font-weight: bold; font-size: 14px;">
                ${CLINIC.shortName}
              </div>
            </div>
            <div class="clinic-contact">
              <p>0721.702.820</p>
              <p>perfectsmilevarteju@gmail.com</p>
              <p>www.perfectsmileglim.ro</p>
            </div>
          </div>
          <h1 style="text-align: center; color: #b8860b; font-size: 18px;">Plan de Tratament</h1>
          <div class="section">
            <p class="clinic-name">PERFECT SMILE GLIM</p>
            <p>Str. București, Nr 68-70, Vârteju, Ilfov</p>
          </div>
          <div class="section">
            <p><strong>Pacient:</strong> ${escapeHtml(patient?.first_name)} ${escapeHtml(patient?.last_name)}</p>
            <p><strong>Data:</strong> ${format(new Date(plan.createdAt), 'dd.MM.yyyy', { locale: ro })}</p>
            ${plan.nextAppointmentDate ? `<p><strong>Următoarea programare:</strong> ${format(new Date(plan.nextAppointmentDate), 'dd.MM.yyyy', { locale: ro })} ${escapeHtml(plan.nextAppointmentTime) || ''}</p>` : ''}
          </div>
          
          <div class="section">
            <p class="section-title">Dinți selectați</p>
            <div class="dental-chart">
              <div class="dental-row">
                ${[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(t => renderTooth(t)).join('')}
              </div>
              <div class="dental-row deciduous">
                ${[55, 54, 53, 52, 51, 61, 62, 63, 64, 65].map(t => renderTooth(t, true)).join('')}
              </div>
              <div class="dental-row deciduous">
                ${[85, 84, 83, 82, 81, 71, 72, 73, 74, 75].map(t => renderTooth(t, true)).join('')}
              </div>
              <div class="dental-row">
                ${[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map(t => renderTooth(t)).join('')}
              </div>
            </div>
          </div>
          
          <div class="section">
            <table>
              <thead>
                <tr>
                  <th>Dinți</th>
                  <th>Tratament</th>
                  <th>Cant.</th>
                  <th>Preț</th>
                </tr>
              </thead>
              <tbody>
              ${plan.items.map(item => {
                  const teethDisplay = item.toothNumbers && item.toothNumbers.length > 0 
                    ? escapeNumberArray(item.toothNumbers, ', ')
                    : (item.toothNumber || '-');
                  return `
                  <tr>
                    <td>${teethDisplay}</td>
                    <td>${escapeHtml(item.treatmentName)}</td>
                    <td style="text-align: center">${item.quantity}</td>
                    <td style="text-align: right">${Math.max(0, (item.price * item.quantity) - (item.cas || 0)).toFixed(0)} RON</td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
          </div>
          ${totalCasPrint > 0 ? `
            <div class="discount-info">
              <p>Preț brut: ${subtotal.toFixed(0)} LEI</p>
              <p>CAS: -${totalCasPrint.toFixed(0)} LEI</p>
            </div>
          ` : ''}
          ${discountPercent > 0 ? `
            <div class="discount-info">
              <p>Subtotal: ${totalDePlataPrint.toFixed(0)} LEI</p>
              <p>Discount (${discountPercent}%): -${discountAmount.toFixed(0)} LEI</p>
            </div>
          ` : ''}
          <div class="total">DE PLATĂ: ${total.toFixed(0)} LEI</div>
          
          <div style="margin-top: 30px; padding-top: 10px; border-top: 2px solid #b8860b;">
            <div style="text-align: center; font-size: 9px; color: #666;">
              <p><strong>PERFECT SMILE GLIM SRL</strong> | Str. București 68-70, Vârteju, Măgurele, Ilfov</p>
              <p>Tel: 0721.702.820 | Email: perfectsmilevarteju@gmail.com | www.perfectsmileglim.ro</p>
              <p style="margin-top: 5px; font-size: 8px; color: #999;">© ${new Date().getFullYear()} Perfect Smile Glim. Toate drepturile rezervate.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintHistory = () => {
    if (!patient) return;
    
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    // Group treatments by date for printing
    const groupedByDate = filteredHistory.reduce((acc, record) => {
      const dateKey = record.appointment_date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(record);
      return acc;
    }, {} as Record<string, typeof filteredHistory>);

    const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
      new Date(b).getTime() - new Date(a).getTime()
    );

    const totalAmount = filteredHistory.reduce((sum, r) => sum + (r.price || 0), 0);
    const totalCas = filteredHistory.reduce((sum, r) => sum + (r.cas || 0), 0);
    const totalUnpaid = filteredHistory
      .filter(r => r.payment_method === 'unpaid')
      .reduce((sum, r) => sum + (r.price || 0), 0);

    const periodLabel = periodFilter === 'all' ? 'Toate' 
      : periodFilter === '30days' ? 'Ultimele 30 zile'
      : periodFilter === '3months' ? 'Ultimele 3 luni'
      : 'Ultimul an';

    printWindow.document.write(`
      <html>
        <head>
          <title>Istoric Tratamente - ${escapeHtml(patient.first_name)} ${escapeHtml(patient.last_name)}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #1a365d; font-size: 12px; }
            .header { 
              display: flex; justify-content: space-between; align-items: flex-start; 
              margin-bottom: 20px; border-bottom: 3px solid #b8860b; padding-bottom: 15px;
              background: linear-gradient(to right, #fef9e7, #fff8e1, #fef9e7);
              padding: 15px; border-radius: 8px;
            }
            .logo-section { display: flex; align-items: center; gap: 10px; }
            .logo { width: 100px; height: 70px; object-fit: contain; }
            .clinic-contact { text-align: right; font-size: 11px; color: #b8860b; }
            .clinic-contact p { margin: 2px 0; }
            .patient-info { margin: 15px 0; padding: 10px; background: #f5f5f5; border-radius: 8px; }
            .patient-info h2 { margin: 0 0 5px 0; color: #b8860b; font-size: 16px; }
            .patient-info p { margin: 3px 0; font-size: 11px; }
            .period-badge { 
              display: inline-block; padding: 3px 10px; background: #b8860b; color: white; 
              border-radius: 15px; font-size: 10px; margin-left: 10px;
            }
            .date-section { margin: 15px 0; }
            .date-header { 
              background: linear-gradient(to right, #b8860b, #9a7209); color: white; 
              padding: 8px 12px; border-radius: 6px 6px 0 0; font-weight: bold;
              display: flex; justify-content: space-between; align-items: center;
            }
            .date-header .count { font-size: 10px; font-weight: normal; }
            .treatments-table { width: 100%; border-collapse: collapse; }
            .treatments-table th, .treatments-table td { 
              border: 1px solid #ddd; padding: 6px 8px; text-align: left; 
            }
            .treatments-table th { background: #f9f9f9; font-size: 10px; color: #666; }
            .treatments-table td { font-size: 11px; }
            .text-right { text-align: right !important; }
            .text-center { text-align: center !important; }
            .payment-badge { 
              display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; 
            }
            .payment-paid { background: #dcfce7; color: #166534; }
            .payment-unpaid { background: #fee2e2; color: #991b1b; }
            .payment-partial { background: #fef3c7; color: #92400e; }
            .summary { margin-top: 20px; padding: 15px; background: #fef9e7; border-radius: 8px; border: 2px solid #b8860b; }
            .summary-row { display: flex; justify-content: space-between; padding: 5px 0; }
            .summary-row.total { font-weight: bold; font-size: 14px; border-top: 2px solid #b8860b; padding-top: 10px; margin-top: 10px; }
            .summary-row.unpaid { color: #dc2626; }
            .footer { 
              margin-top: 30px; padding-top: 10px; border-top: 2px solid #b8860b; 
              text-align: center; font-size: 9px; color: #666; 
            }
            @media print { 
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              .date-section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo-section">
              <img src="${getLogoPrintUrl()}" alt="Perfect Smile Logo" class="logo" />
              <div style="font-weight: bold; font-size: 14px; color: #b8860b;">
                ${CLINIC.shortName}
              </div>
            </div>
            <div class="clinic-contact">
              <p>0721.702.820</p>
              <p>perfectsmilevarteju@gmail.com</p>
              <p>www.perfectsmileglim.ro</p>
            </div>
          </div>

          <div class="patient-info">
            <h2>
              ${escapeHtml(patient.first_name)} ${escapeHtml(patient.last_name)}
              <span class="period-badge">${periodLabel}</span>
            </h2>
            <p><strong>Telefon:</strong> ${escapeHtml(patient.phone)}</p>
            ${patient.email ? `<p><strong>Email:</strong> ${escapeHtml(patient.email)}</p>` : ''}
            <p><strong>Data raport:</strong> ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: ro })}</p>
          </div>

          <h3 style="color: #b8860b; margin: 20px 0 10px;">Istoric Tratamente</h3>

          ${sortedDates.map(dateKey => {
            const records = groupedByDate[dateKey];
            const dateTotal = records.reduce((sum, r) => sum + (r.price || 0), 0);
            
            return `
              <div class="date-section">
                <div class="date-header">
                  <span>${format(new Date(dateKey), 'd MMMM yyyy', { locale: ro })}</span>
                  <span class="count">${records.length} tratament${records.length > 1 ? 'e' : ''} • ${dateTotal} RON</span>
                </div>
                <table class="treatments-table">
                  <thead>
                    <tr>
                      <th>Ora</th>
                      <th>Tratament</th>
                      <th>Medic</th>
                      <th class="text-center">Durată</th>
                      <th class="text-right">CAS</th>
                      <th class="text-right">Preț</th>
                      <th class="text-center">Plată</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${records.map(record => {
                      const paymentClass = record.payment_method === 'unpaid' ? 'payment-unpaid' 
                        : (record.payment_method === 'partial_card' || record.payment_method === 'partial_cash') ? 'payment-partial' 
                        : 'payment-paid';
                      const paymentLabel = record.payment_method === 'unpaid' ? 'Neachitat'
                        : record.payment_method === 'card' ? 'Card'
                        : record.payment_method === 'cash' ? 'Cash'
                        : record.payment_method === 'partial_card' ? 'Parțial Card'
                        : record.payment_method === 'partial_cash' ? 'Parțial Cash'
                        : '-';
                      
                      return `
                        <tr>
                          <td>${escapeHtml(record.start_time.slice(0, 5))}</td>
                          <td>${escapeHtml(record.treatment_name)}</td>
                          <td>${record.doctor_name ? escapeHtml('Dr. ' + record.doctor_name) : '-'}</td>
                          <td class="text-center">${record.duration ? record.duration + ' min' : '-'}</td>
                          <td class="text-right">${record.cas ? record.cas + ' RON' : '-'}</td>
                          <td class="text-right">${record.price ? record.price + ' RON' : '-'}</td>
                          <td class="text-center">
                            <span class="payment-badge ${paymentClass}">${paymentLabel}</span>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            `;
          }).join('')}

          <div class="summary">
            <div class="summary-row">
              <span>Total intervenții:</span>
              <span>${filteredHistory.length}</span>
            </div>
            ${totalCas > 0 ? `
              <div class="summary-row">
                <span>Total CAS:</span>
                <span>${totalCas} RON</span>
              </div>
            ` : ''}
            ${totalUnpaid > 0 ? `
              <div class="summary-row unpaid">
                <span>Total neachitat:</span>
                <span>${totalUnpaid} RON</span>
              </div>
            ` : ''}
            <div class="summary-row total">
              <span>TOTAL GENERAL:</span>
              <span>${totalAmount} RON</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>PERFECT SMILE GLIM SRL</strong> | Str. București 68-70, Vârteju, Măgurele, Ilfov</p>
            <p>Tel: 0721.702.820 | Email: perfectsmilevarteju@gmail.com | www.perfectsmileglim.ro</p>
            <p style="margin-top: 5px; font-size: 8px; color: #999;">© ${new Date().getFullYear()} Perfect Smile Glim. Toate drepturile rezervate.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const fetchDentalStatus = async () => {
    if (!patient) return;

    const { data, error } = await supabase
      .from('dental_status')
      .select('tooth_number, status, notes')
      .eq('patient_id', patient.id);

    if (error) {
      console.error('Error fetching dental status:', error);
      return;
    }

    setDentalStatus((data || []).map(d => ({
      tooth_number: d.tooth_number,
      status: d.status as ToothData['status'],
      notes: d.notes || undefined,
    })));
  };

  const fetchTreatmentHistory = async () => {
    if (!patient) return;
    setLoadingHistory(true);

    // Fetch from appointment_treatments joined with appointments - ONLY completed appointments
    const { data, error } = await supabase
      .from('appointments')
      .select(`
        id,
        appointment_date,
        start_time,
        status,
        is_paid,
        notes,
        price,
        paid_amount,
        payment_method,
        doctors (
          id,
          name
        ),
        appointment_treatments (
          id,
          treatment_name,
          price,
          decont,
          discount_percent,
          tooth_numbers,
          tooth_data,
          duration
        )
      `)
      .eq('patient_id', patient.id)
      .eq('status', 'completed')
      .order('appointment_date', { ascending: false });

    if (error) {
      console.error('Error fetching treatment history:', error);
      setTreatmentHistory([]);
    } else {
      // Flatten the data
      const records: TreatmentRecord[] = [];
      data?.forEach((appointment: any) => {
        // Use payment_method column first, fallback to notes parsing
        let paymentMethod: PaymentMethod | null = appointment.payment_method || null;
        
        // Fallback to notes parsing for old data
        if (!paymentMethod && appointment.notes) {
          if (appointment.notes.includes('[Plată: Card]')) {
            paymentMethod = 'card';
          } else if (appointment.notes.includes('[Plată: Cash]')) {
            paymentMethod = 'cash';
          } else if (appointment.notes.includes('[Plată: Neachitat]')) {
            paymentMethod = 'unpaid';
          } else if (appointment.notes.includes('[Plată: Parțial Card')) {
            paymentMethod = 'partial_card';
          } else if (appointment.notes.includes('[Plată: Parțial Cash')) {
            paymentMethod = 'partial_cash';
          }
        }
        // Fallback to is_paid if no explicit payment method
        if (!paymentMethod && appointment.is_paid !== null) {
          paymentMethod = appointment.is_paid ? 'cash' : 'unpaid';
        }

        const doctorName = appointment.doctors?.name || null;
        const appointmentPrice = appointment.price || 0;

        const appointmentTreatments = (appointment.appointment_treatments || []) as any[];
        const appointmentTotalCas = appointmentTreatments.reduce((sum, t) => sum + (t.decont || 0), 0);
        const appointmentTotalPayable = appointmentTreatments.reduce((sum, t) => {
          const price = t.price || 0;
          const cas = t.decont || 0;
          const discount = t.discount_percent || 0;
          return sum + (price - cas) * (1 - discount / 100);
        }, 0);

        const paidAmount = appointment.paid_amount ?? (appointment.is_paid ? appointmentTotalPayable : 0);

        appointmentTreatments.forEach((treatment: any) => {
          records.push({
            id: treatment.id,
            appointment_id: appointment.id,
            treatment_name: treatment.treatment_name,
            price: treatment.price,
            cas: treatment.decont || 0,
            appointment_total_cas: appointmentTotalCas,
            appointment_total_payable: appointmentTotalPayable,
            tooth_numbers: treatment.tooth_numbers,
            tooth_data: (treatment.tooth_data || []) as ToothDataRecord[],
            duration: treatment.duration,
            appointment_date: appointment.appointment_date,
            start_time: appointment.start_time,
            payment_method: paymentMethod,
            paid_amount: paidAmount,
            total_price: appointmentPrice,
            doctor_name: doctorName,
            appointment_notes: appointment.notes || null,
          });
        });
      });
      setTreatmentHistory(records);
    }
    setLoadingHistory(false);
  };

  const handleMarkAsPaid = (appointmentId: string) => {
    setSelectedAppointmentId(appointmentId);
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async (method: 'card' | 'cash' | 'partial_card' | 'partial_cash', partialAmount?: number) => {
    if (!selectedAppointmentId) return;
    
    setIsUpdatingPayment(true);
    try {
      // Get current appointment data including price and paid_amount
      const { data: appointment } = await supabase
        .from('appointments')
        .select('notes, price, paid_amount')
        .eq('id', selectedAppointmentId)
        .maybeSingle();

      const totalPrice = appointment?.price || 0;
      const currentPaidAmount = appointment?.paid_amount || 0;
      
      const isPartial = method === 'partial_card' || method === 'partial_cash';
      const newPaidAmount = isPartial ? currentPaidAmount + (partialAmount || 0) : totalPrice;
      const isFullyPaid = newPaidAmount >= totalPrice;

      // Determine final payment method
      let finalMethod: PaymentMethod = method;
      if (isPartial && isFullyPaid) {
        // If partial payment completes the total, convert to full payment
        finalMethod = method === 'partial_card' ? 'card' : 'cash';
      }

      // Update notes to reflect new payment method
      let newNotes = appointment?.notes || '';
      // Remove old payment info (including partial payments)
      newNotes = newNotes.replace(/\[Plată: [^\]]+\]/g, '').trim();
      
      // Add new payment info
      let paymentLabel = '';
      if (isFullyPaid) {
        paymentLabel = finalMethod === 'card' ? 'Card' : 'Cash';
      } else {
        paymentLabel = method === 'partial_card' 
          ? `Parțial Card ${newPaidAmount} RON` 
          : `Parțial Cash ${newPaidAmount} RON`;
      }
      newNotes = newNotes ? `${newNotes}\n[Plată: ${paymentLabel}]` : `[Plată: ${paymentLabel}]`;

      const { error } = await supabase
        .from('appointments')
        .update({ 
          is_paid: isFullyPaid,
          paid_amount: newPaidAmount,
          payment_method: isFullyPaid ? finalMethod : method,
          notes: newNotes
        })
        .eq('id', selectedAppointmentId);

      if (error) throw error;

      // Update local state
      setTreatmentHistory(prev => 
        prev.map(record => 
          record.appointment_id === selectedAppointmentId 
            ? { ...record, payment_method: isFullyPaid ? finalMethod : method, paid_amount: newPaidAmount }
            : record
        )
      );

      setPaymentDialogOpen(false);
      setSelectedAppointmentId(null);
      setPartialPaymentAmount('');
    } catch (error) {
      console.error('Error updating payment:', error);
    } finally {
      setIsUpdatingPayment(false);
    }
  };

  const getPaymentBadge = (
    method: PaymentMethod | null,
    appointmentId?: string,
    paidAmount?: number | null,
    appointmentTotalPayable?: number | null,
    appointmentTotalCas?: number | null
  ) => {
    // Remaining is based on discounted payable amount (CAS already subtracted per line)
    const payableAmount = appointmentTotalPayable || 0;
    const remaining = payableAmount - (paidAmount || 0);
    
    switch (method) {
      case 'card':
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 gap-1">
            <CreditCard className="h-3 w-3" />
            Card
          </Badge>
        );
      case 'cash':
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1">
            <Banknote className="h-3 w-3" />
            Cash
          </Badge>
        );
      case 'partial_card':
      case 'partial_cash':
        const hasCas = (appointmentTotalCas || 0) > 0;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (appointmentId) handleMarkAsPaid(appointmentId);
            }}
            className="cursor-pointer hover:scale-105 transition-transform"
          >
            <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 gap-1 hover:bg-cyan-200">
              {method === 'partial_card' ? <CreditCard className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
              Parțial ({paidAmount?.toLocaleString()} RON)
              {hasCas && <span className="text-cyan-600">• CAS: {appointmentTotalCas?.toLocaleString()}</span>}
              - Rest: {remaining.toLocaleString()} RON
            </Badge>
          </button>
        );
      case 'unpaid':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (appointmentId) handleMarkAsPaid(appointmentId);
            }}
            className="cursor-pointer hover:scale-105 transition-transform"
          >
            <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 gap-1 hover:bg-orange-200 dark:hover:bg-orange-900/50">
              <AlertCircle className="h-3 w-3" />
              Neachitat
            </Badge>
          </button>
        );
      default:
        return null;
    }
  };

  const calculateAge = (dateOfBirth?: string) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!patient) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-5xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div>
                <div className="text-xl">
                  {patient.last_name} {patient.first_name}
                </div>
                {patient.date_of_birth && (
                  <div className="text-sm text-muted-foreground font-normal">
                    {calculateAge(patient.date_of_birth)} ani
                  </div>
                )}
              </div>
            </SheetTitle>
            <Button variant="outline" size="sm" onClick={() => onEdit(patient)}>
              <Edit className="h-4 w-4 mr-2" />
              Editează
            </Button>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid grid-cols-6">
            <TabsTrigger value="info">Informații</TabsTrigger>
            <TabsTrigger value="record" className="gap-1">
              <FileText className="h-3 w-3" />
              Fișă
            </TabsTrigger>
            <TabsTrigger value="dental" className="gap-1">
              <Stethoscope className="h-3 w-3" />
              Status Dentar
            </TabsTrigger>
            <TabsTrigger value="history">Istoric</TabsTrigger>
            <TabsTrigger value="radiographs" className="gap-1">
              <FileImage className="h-3 w-3" />
              Radiografii
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-1">
              <ClipboardList className="h-3 w-3" />
              Planuri
            </TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-6 space-y-6">
            {/* Contact */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase">Contact</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${patient.phone}`} className="text-foreground hover:text-primary underline-offset-2 hover:underline">
                    {patient.phone}
                  </a>
                </div>
                {patient.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${patient.email}`} className="text-foreground hover:text-primary underline-offset-2 hover:underline">
                      {patient.email}
                    </a>
                  </div>
                )}
                {(patient.address || patient.city) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {[patient.address, patient.city].filter(Boolean).join(', ')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Medical Alerts */}
            {((patient.allergies && patient.allergies.length > 0) ||
              (patient.medical_conditions && patient.medical_conditions.length > 0)) && (
              <div className="space-y-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                <h4 className="text-sm font-semibold text-destructive flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alerte medicale
                </h4>
                
                {patient.allergies && patient.allergies.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">Alergii:</div>
                    <div className="flex flex-wrap gap-2">
                      {patient.allergies.map((allergy, i) => (
                        <Badge key={i} variant="destructive">
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {patient.medical_conditions && patient.medical_conditions.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Heart className="h-3 w-3" />
                      Afecțiuni:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {patient.medical_conditions.map((condition, i) => (
                        <Badge key={i} variant="secondary" className="bg-warning/20">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* Medications */}
            {patient.medications && patient.medications.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Medicamente curente
                </h4>
                <div className="flex flex-wrap gap-2">
                  {patient.medications.map((medication, i) => (
                    <Badge key={i} variant="outline">
                      {medication}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {patient.notes && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Observații
                </h4>
                <p className="text-sm text-foreground/80">{patient.notes}</p>
              </div>
            )}

            {/* Emergency Contact */}
            {patient.emergency_contact_name && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase">
                  Contact de urgență
                </h4>
                <div className="text-sm">
                  <div>{patient.emergency_contact_name}</div>
                  {patient.emergency_contact_phone && (
                    <div className="text-muted-foreground">{patient.emergency_contact_phone}</div>
                  )}
                </div>
              </div>
            )}

            {/* Registration date */}
            <div className="pt-4 border-t text-xs text-muted-foreground flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Înregistrat la {format(new Date(patient.created_at), 'd MMMM yyyy', { locale: ro })}
            </div>
          </TabsContent>

          {/* Patient Record Tab */}
          <TabsContent value="record" className="mt-6">
            <PatientRecordTab
              patientId={patient.id}
              patientName={`${patient.first_name} ${patient.last_name}`}
            />
          </TabsContent>

          {/* Dental Status Tab */}
          <TabsContent value="dental" className="mt-6">
            <PatientDentalStatusTab
              patientId={patient.id}
              dentalStatus={dentalStatus}
              onStatusChange={setDentalStatus}
            />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            {loadingHistory ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : treatmentHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu există tratamente înregistrate</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Period filter and print button */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-1 flex-wrap">
                      {[
                        { value: 'all', label: 'Toate' },
                        { value: '30days', label: '30 zile' },
                        { value: '3months', label: '3 luni' },
                        { value: '1year', label: '1 an' },
                      ].map((option) => (
                        <Button
                          key={option.value}
                          variant={periodFilter === option.value ? 'default' : 'outline'}
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => setPeriodFilter(option.value as PeriodFilter)}
                        >
                          {option.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs gap-1"
                    onClick={handlePrintHistory}
                  >
                    <Printer className="h-3.5 w-3.5" />
                    Printează
                  </Button>
                </div>

                {filteredHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">Nu există tratamente în perioada selectată</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Group treatments by date */}
                    {(() => {
                      const groupedByDate = filteredHistory.reduce((acc, record) => {
                        const dateKey = record.appointment_date;
                        if (!acc[dateKey]) {
                          acc[dateKey] = [];
                        }
                        acc[dateKey].push(record);
                        return acc;
                      }, {} as Record<string, typeof filteredHistory>);

                      const sortedDates = Object.keys(groupedByDate).sort((a, b) => 
                        new Date(b).getTime() - new Date(a).getTime()
                      );

                      return sortedDates.map((dateKey) => {
                        const records = groupedByDate[dateKey];
                        const totalPrice = records.reduce((sum, r) => sum + (r.price || 0), 0);
                        const totalCas = records.reduce((sum, r) => sum + (r.cas || 0), 0);
                        const totalDePlata = totalPrice - totalCas;
                        const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0);

                        return (
                          <Collapsible key={dateKey} defaultOpen={false}>
                            {/* Date header with summary - clickable */}
                            <CollapsibleTrigger asChild>
                              <button className="w-full flex items-center justify-between bg-muted/50 hover:bg-muted/70 rounded-lg px-4 py-3 transition-colors cursor-pointer">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-primary" />
                                  <div className="text-left">
                                    <div className="font-medium text-sm">
                                      {format(new Date(dateKey), 'd MMMM yyyy', { locale: ro })}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {records.length} {records.length === 1 ? 'tratament' : 'tratamente'}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge variant="outline" className="font-medium">
                                    {totalPrice} RON
                                  </Badge>
                                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                                </div>
                              </button>
                            </CollapsibleTrigger>

                            {/* Treatments for this date - collapsible */}
                            <CollapsibleContent className="space-y-2 pl-2 mt-3">
                              {records.map((record) => (
                                <div
                                  key={record.id}
                                  className="p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors"
                                >
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-start gap-3">
                                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 mt-0.5">
                                        <Stethoscope className="h-3.5 w-3.5 text-primary" />
                                      </div>
                                      <div className="space-y-1">
                                        <h4 className="font-medium text-sm">{record.treatment_name}</h4>
                                        <div className="text-xs text-muted-foreground">
                                          Ora {record.start_time.slice(0, 5)}
                                          {record.duration && ` • ${record.duration} min`}
                                          {record.doctor_name && (
                                            <>
                                              {' • '}
                                              <span className="text-primary font-medium">Dr. {record.doctor_name}</span>
                                            </>
                                          )}
                                        </div>
                                        {(() => {
                                          const cleaned = cleanDentalNotes(record.appointment_notes);
                                          // Strip old payment tags from notes
                                          const visibleNotes = cleaned
                                            .replace(/\[Plată:.*?\]/g, '')
                                            .replace(/\[Restanță:.*?\]/g, '')
                                            .trim();
                                          if (!visibleNotes) return null;
                                          return (
                                            <div className="flex items-start gap-1 mt-1 text-xs text-muted-foreground">
                                              <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                                              <span className="italic line-clamp-2">{visibleNotes}</span>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      {record.payment_method && getPaymentBadge(
                                        record.payment_method,
                                        record.appointment_id,
                                        record.paid_amount,
                                        record.appointment_total_payable,
                                        record.appointment_total_cas
                                      )}
                                      {record.price !== null && record.price > 0 && (
                                        <div className="flex flex-col items-end gap-0.5">
                                          {record.cas && record.cas > 0 && (
                                            <span className="text-[10px] text-cyan-600">CAS: {record.cas} RON</span>
                                          )}
                                          <Badge variant="outline" className="text-xs">
                                            {record.cas && record.cas > 0 
                                              ? `${record.price - record.cas} RON` 
                                              : `${record.price} RON`}
                                          </Badge>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </CollapsibleContent>
                          </Collapsible>
                        );
                      });
                    })()}

                    {/* Grand total for filtered results */}
                    <div className="border-t pt-4 mt-6 space-y-3">
                      {/* Unpaid total - show only if there are unpaid items */}
                      {filteredHistory.filter(r => r.payment_method === 'unpaid').length > 0 && (
                        <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg px-4 py-3">
                          <div className="flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <span className="font-medium text-sm text-orange-700 dark:text-orange-400">
                              Total neachitat
                            </span>
                          </div>
                          <Badge className="bg-orange-500 hover:bg-orange-600 font-medium">
                            {filteredHistory
                              .filter(r => r.payment_method === 'unpaid')
                              .reduce((sum, r) => sum + (r.price || 0), 0)} RON
                          </Badge>
                        </div>
                      )}
                      
                      {/* General total */}
                      <div className="flex items-center justify-between bg-primary/5 rounded-lg px-4 py-3">
                        <span className="font-medium text-sm">
                          Total {periodFilter !== 'all' ? 'perioadă' : 'general'}
                        </span>
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">
                            {filteredHistory.length} intervenții
                          </Badge>
                          <Badge className="font-medium">
                            {filteredHistory.reduce((sum, r) => sum + (r.price || 0), 0)} RON
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Radiographs Tab */}
          <TabsContent value="radiographs" className="mt-6">
            <PatientRadiographs 
              patientId={patient.id} 
              patientName={`${patient.first_name} ${patient.last_name}`} 
            />
          </TabsContent>

          {/* Treatment Plans Tab */}
          <TabsContent value="plans" className="mt-6">
            {/* Add Treatment Plan Button */}
            {onOpenTreatmentPlan && patient && (
              <div className="mb-4">
                <Button
                  onClick={() => {
                    onClose();
                    onOpenTreatmentPlan(patient);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Creează plan de tratament
                </Button>
              </div>
            )}

            {loadingPlans ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : treatmentPlans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nu există planuri de tratament salvate</p>
                {!onOpenTreatmentPlan && <p className="text-sm mt-2">Creați un plan din tab-ul "Plan Tratament"</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {treatmentPlans.map((plan) => {
                  const planDiscount = plan.discountPercent || 0;
                  const totalDePlata = plan.items.reduce((sum, item) => {
                    const itemDiscount = item.discountPercent || 0;
                    const gross = item.price * item.quantity;
                    const afterCas = gross - (item.cas || 0);
                    const afterItemDiscount = afterCas * (1 - itemDiscount / 100);
                    return sum + Math.max(0, afterItemDiscount);
                  }, 0);
                  const total = Math.max(0, totalDePlata * (1 - planDiscount / 100));
                  const totalCas = plan.items.reduce((sum, item) => sum + (item.cas || 0), 0);
                  
                  return (
                    <Collapsible key={plan.id} defaultOpen={false}>
                      <div className="border rounded-lg overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <button className="w-full flex items-center justify-between bg-muted/50 hover:bg-muted/70 px-4 py-3 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3">
                              <ClipboardList className="h-4 w-4 text-primary" />
                              <div className="text-left">
                                <div className="font-medium text-sm">
                                  {format(new Date(plan.createdAt), 'd MMMM yyyy', { locale: ro })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {plan.items.length} tratamente
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-medium">
                                {total.toFixed(0)} RON
                              </Badge>
                              <ChevronDown className="h-4 w-4 transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
                            </div>
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="p-4 border-t space-y-3">
                            {/* Plan details */}
                            {plan.nextAppointmentDate && (
                              <div className="text-sm text-muted-foreground">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                Următoarea programare: {format(new Date(plan.nextAppointmentDate), 'd MMMM yyyy', { locale: ro })}
                                {plan.nextAppointmentTime && ` la ${plan.nextAppointmentTime}`}
                              </div>
                            )}

                            {/* Items table */}
                            <div className="border rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="bg-muted/50">
                                    <th className="px-3 py-2 text-left font-medium">Dinte</th>
                                    <th className="px-3 py-2 text-left font-medium">Tratament</th>
                                    <th className="px-3 py-2 text-center font-medium">Cant.</th>
                                    <th className="px-3 py-2 text-right font-medium">De plată</th>
                                    <th className="px-3 py-2 text-center font-medium">Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                {plan.items.map((item, idx) => {
                                    const isCompleted = !!item.completedAt;
                                    const paymentStatus = item.paymentStatus || 'neachitat';
                                    const totalTeeth = item.toothNumbers?.length || 0;
                                    const completedTeeth = completedTeethByPlanItem.get(item.id || '')?.size || 0;
                                    const hasPartialProgress = totalTeeth > 0 && completedTeeth > 0 && completedTeeth < totalTeeth;
                                    const allTeethDone = totalTeeth > 0 && completedTeeth >= totalTeeth;
                                    
                                    return (
                                      <tr 
                                        key={item.id || idx} 
                                        className={cn(
                                          'border-t',
                                          (isCompleted || allTeethDone) && 'bg-success/10',
                                          hasPartialProgress && !allTeethDone && 'bg-warning/10'
                                        )}
                                      >
                                        <td className={cn('px-3 py-2', (isCompleted || allTeethDone) && 'text-success', hasPartialProgress && !allTeethDone && 'text-warning')}>
                                          {item.toothNumber || (item.toothNumbers?.join(', ')) || '-'}
                                        </td>
                                        <td className={cn('px-3 py-2', (isCompleted || allTeethDone) && 'text-success', hasPartialProgress && !allTeethDone && 'text-warning')}>
                                          {item.treatmentName}
                                          {(isCompleted || allTeethDone) && <span className="ml-2">✓</span>}
                                          {hasPartialProgress && !allTeethDone && <span className="ml-2 text-xs">({completedTeeth}/{totalTeeth})</span>}
                                        </td>
                                        <td className={cn('px-3 py-2 text-center', (isCompleted || allTeethDone) && 'text-success')}>
                                          {item.quantity}
                                        </td>
                                        <td className={cn('px-3 py-2 text-right', (isCompleted || allTeethDone) && 'text-success')}>
                                          {(() => {
                                            const gross = item.price * item.quantity;
                                            const afterCas = gross - (item.cas || 0);
                                            const itemDisc = item.discountPercent || 0;
                                            const dePlata = Math.max(0, afterCas * (1 - itemDisc / 100));
                                            return `${dePlata.toFixed(0)} RON`;
                                          })()}
                                        </td>
                                        <td className="px-3 py-2 text-center">
                                          {(isCompleted || allTeethDone) ? (
                                            <Badge 
                                              variant="outline"
                                              className={
                                                paymentStatus === 'achitat' || paymentStatus === 'card' || paymentStatus === 'cash'
                                                  ? 'bg-success/15 text-success border-success/30' 
                                                  : paymentStatus === 'partial' || paymentStatus === 'partial_card' || paymentStatus === 'partial_cash'
                                                    ? 'bg-warning/15 text-warning border-warning/30'
                                                    : 'bg-destructive/15 text-destructive border-destructive/30'
                                              }
                                            >
                                              {paymentStatus === 'achitat' || paymentStatus === 'card' || paymentStatus === 'cash' ? 'Achitat' : paymentStatus.startsWith('partial') ? `Parțial (${item.paidAmount || 0})` : 'Neachitat'}
                                            </Badge>
                                          ) : hasPartialProgress ? (
                                            <Badge variant="outline" className="bg-warning/15 text-warning border-warning/30">
                                              {completedTeeth}/{totalTeeth} finalizat
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-muted-foreground">
                                              În așteptare
                                            </Badge>
                                          )}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  {totalCas > 0 && (
                                    <tr className="border-t bg-muted/30">
                                      <td colSpan={4} className="px-3 py-2 text-right text-xs text-muted-foreground">CAS:</td>
                                      <td className="px-3 py-2 text-right text-xs text-success">{totalCas.toFixed(0)} RON</td>
                                    </tr>
                                  )}
                                  <tr className={cn('border-t bg-muted/30', !totalCas && '')}>
                                    <td colSpan={4} className="px-3 py-2 text-right font-medium">De plată:</td>
                                    <td className="px-3 py-2 text-right font-bold">{total.toFixed(0)} RON</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2 pt-2">
                              {onCreateAppointment && patient && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    const treatmentNames = plan.items.map(i => i.treatmentName).join(', ');
                                    // Convert plan items to interventions for the appointment
                                    const interventions: SelectedIntervention[] = plan.items
                                      .filter((i) => !i.completedAt)
                                      .map((item, index) => ({
                                      id: `plan-item-${index}`,
                                      treatmentId: item.treatmentId || '',
                                      treatmentName: item.treatmentName,
                                      price: item.price * item.quantity,
                                      cas: (item.cas || 0) * item.quantity,
                                      laborator: (item.laborator || 0) * item.quantity,
                                      duration: item.duration || 30,
                                      discountPercent: item.discountPercent || plan.discountPercent || 0,
                                      selectedTeeth: item.toothNumbers || [],
                                      planItemId: item.id,
                                    }));
                                    onClose();
                                    onCreateAppointment(patient, treatmentNames, interventions, plan.doctorId);
                                  }}
                                  className="gap-1"
                                >
                                  <CalendarPlus className="h-3 w-3" />
                                  Programare
                                </Button>
                              )}
                              {onEditTreatmentPlan && patient && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    onClose();
                                    onEditTreatmentPlan(patient, plan);
                                  }}
                                  className="gap-1"
                                >
                                  <Edit className="h-3 w-3" />
                                  Editează
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintPlan(plan)}
                                className="gap-1"
                              >
                                <Printer className="h-3 w-3" />
                                Printează
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => confirmDeletePlan(plan.id)}
                                className="gap-1 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                                Șterge
                              </Button>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Payment Dialog */}
        {paymentDialogOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div 
              className="absolute inset-0 bg-black/50" 
              onClick={() => {
                setPaymentDialogOpen(false);
                setSelectedAppointmentId(null);
              }}
            />
            <div className="relative bg-background rounded-lg p-6 shadow-xl max-w-sm w-full mx-4 z-10">
              <h3 className="text-lg font-semibold mb-2">Marchează ca achitat</h3>
              <p className="text-sm font-medium mb-2">Plată integrală:</p>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <button
                  onClick={() => handleConfirmPayment('card')}
                  disabled={isUpdatingPayment}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-border hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all disabled:opacity-50"
                >
                  <CreditCard className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">Card</span>
                </button>
                <button
                  onClick={() => handleConfirmPayment('cash')}
                  disabled={isUpdatingPayment}
                  className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 border-border hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 transition-all disabled:opacity-50"
                >
                  <Banknote className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">Cash</span>
                </button>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm font-medium mb-2">Plată parțială:</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    placeholder="Sumă plătită (RON)"
                    value={partialPaymentAmount}
                    onChange={(e) => setPartialPaymentAmount(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg text-sm bg-background"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleConfirmPayment('partial_card', parseFloat(partialPaymentAmount) || 0)}
                    disabled={isUpdatingPayment || !partialPaymentAmount || parseFloat(partialPaymentAmount) <= 0}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 border-border hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-all disabled:opacity-50"
                  >
                    <CreditCard className="h-5 w-5 text-cyan-600" />
                    <span className="text-xs font-medium">Parțial Card</span>
                  </button>
                  <button
                    onClick={() => handleConfirmPayment('partial_cash', parseFloat(partialPaymentAmount) || 0)}
                    disabled={isUpdatingPayment || !partialPaymentAmount || parseFloat(partialPaymentAmount) <= 0}
                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-lg border-2 border-border hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition-all disabled:opacity-50"
                  >
                    <Banknote className="h-5 w-5 text-cyan-600" />
                    <span className="text-xs font-medium">Parțial Cash</span>
                  </button>
                </div>
              </div>
              
              <button
                onClick={() => {
                  setPaymentDialogOpen(false);
                  setSelectedAppointmentId(null);
                  setPartialPaymentAmount('');
                }}
                disabled={isUpdatingPayment}
                className="w-full mt-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Anulează
              </button>
            </div>
          </div>
        )}

        {/* Delete Plan Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Șterge planul de tratament?</AlertDialogTitle>
              <AlertDialogDescription>
                Această acțiune nu poate fi anulată. Planul de tratament va fi șters definitiv.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anulează</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeletePlan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Șterge
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}