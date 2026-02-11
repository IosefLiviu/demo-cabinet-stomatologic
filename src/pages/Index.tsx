import { useState, useEffect, useCallback, useRef } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Plus, Users, Calendar as CalendarIcon, BarChart3, Wallet, FileText, Pill, UserCheck, Printer, Stethoscope, ClipboardList, Package, List, Home, CalendarClock, MessageSquare, FlaskRound, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { DateNavigator } from '@/components/DateNavigator';
import { CabinetTabs } from '@/components/CabinetTabs';
import { TimeSlotGrid } from '@/components/TimeSlotGrid';
import { TodaySummary } from '@/components/TodaySummary';
import { PatientsList } from '@/components/PatientsList';
import { PatientForm } from '@/components/PatientForm';
import { PatientDetails } from '@/components/PatientDetails';
import { AppointmentForm, AppointmentFormData } from '@/components/AppointmentForm';
import { SelectedIntervention } from '@/components/InterventionSelector';
import { ReportsDashboard } from '@/components/ReportsDashboard';
import { MonthlyExpenses } from '@/components/MonthlyExpenses';
import { TreatmentPlan } from '@/components/TreatmentPlan';
import { PrintablesSection } from '@/components/PrintablesSection';
import { CabinetSettings } from '@/components/CabinetSettings';
import { CompleteAppointmentDialog, PaymentData } from '@/components/CompleteAppointmentDialog';
import { EditPaymentDialog } from '@/components/EditPaymentDialog';
import { CancelAppointmentDialog } from '@/components/CancelAppointmentDialog';

import { AvailableSlotsSearch } from '@/components/AvailableSlotsSearch';
import { AppointmentSearch } from '@/components/AppointmentSearch';
import { StockManagement } from '@/components/StockManagement';
import { DoctorFilter } from '@/components/DoctorFilter';

import { DoctorScheduleManagement } from '@/components/DoctorScheduleManagement';
import { WhatsAppInbox } from '@/components/WhatsAppInbox';
import { LaboratoryTab } from '@/components/LaboratoryTab';
import { PatientRemindersPanel } from '@/components/PatientRemindersPanel';
import { PatientReminderDialog } from '@/components/PatientReminderDialog';
import { WhatsAppQuickSendDialog } from '@/components/WhatsAppQuickSendDialog';
import { AppSidebar } from '@/components/AppSidebar';
import { useWhatsAppMessages } from '@/hooks/useWhatsAppMessages';
import { useUrgentRemindersCount } from '@/hooks/usePatientReminders';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { usePatients, Patient } from '@/hooks/usePatients';
import { useAppointmentsDB, AppointmentDB } from '@/hooks/useAppointmentsDB';
import { useTreatments } from '@/hooks/useTreatments';
import { useCabinets } from '@/hooks/useCabinets';
import { useDoctors } from '@/hooks/useDoctors';
import { useDoctorShifts, DoctorShift } from '@/hooks/useDoctorShifts';
import { useAuth } from '@/hooks/useAuth';
import { TIME_SLOTS, Appointment } from '@/types/appointment';

interface NavigationState {
  tab: string;
  patientId?: string;
  patientName?: string;
}

const Index = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCabinet, setSelectedCabinet] = useState<number | null>(null);
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('activeTab') || 'calendar';
  });
  const [showCabinetSettings, setShowCabinetSettings] = useState(false);

  // Sidebar state: collapsed on calendar, expanded on other tabs
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('activeTab') || 'calendar';
    return saved !== 'calendar';
  });

  // Persist active tab to localStorage
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  // Auto-collapse sidebar on calendar, expand on other tabs
  useEffect(() => {
    setSidebarOpen(activeTab !== 'calendar');
  }, [activeTab]);

  // Navigation history state
  const [navHistory, setNavHistory] = useState<NavigationState[]>([{ tab: 'calendar' }]);
  const [navIndex, setNavIndex] = useState(0);
  const isNavigatingRef = useRef(false);

  // Patient state
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientDetailsInitialTab, setPatientDetailsInitialTab] = useState<string>('info');
  const [treatmentPlanPatientId, setTreatmentPlanPatientId] = useState<string | undefined>();
  const [editingTreatmentPlan, setEditingTreatmentPlan] = useState<any>(undefined);
  const [treatmentPlanSourcePatient, setTreatmentPlanSourcePatient] = useState<Patient | null>(null);

  // Appointment form state
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string | undefined>();
  const [selectedCabinetForForm, setSelectedCabinetForForm] = useState<number | undefined>();
  const [editingAppointmentData, setEditingAppointmentData] = useState<{
    id: string;
    patientId?: string;
    patientName: string;
    patientPhone: string;
    cabinetId: number;
    doctorId?: string;
    time: string;
    duration: number;
    treatmentId?: string;
    treatmentName: string;
    notes?: string;
    price?: number;
    status?: string;
  } | undefined>();
  const [existingInterventions, setExistingInterventions] = useState<SelectedIntervention[]>([]);
  const [reminderDialogPatient, setReminderDialogPatient] = useState<Patient | null>(null);
  const [whatsappDialogPatient, setWhatsappDialogPatient] = useState<Patient | null>(null);

  // Complete appointment dialog state
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [completingAppointmentId, setCompletingAppointmentId] = useState<string | null>(null);
  const [completingAppointmentName, setCompletingAppointmentName] = useState<string>('');
  const [completingAppointmentPrice, setCompletingAppointmentPrice] = useState<number>(0);
  const [completingAppointmentPayable, setCompletingAppointmentPayable] = useState<number>(0);
  const [isCompleting, setIsCompleting] = useState(false);

  // Cancel appointment dialog state
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancellingAppointmentId, setCancellingAppointmentId] = useState<string | null>(null);
  const [cancellingAppointmentName, setCancellingAppointmentName] = useState<string>('');

  // Edit payment dialog state
  const [editPaymentDialogOpen, setEditPaymentDialogOpen] = useState(false);
  const [editingPaymentAppointmentId, setEditingPaymentAppointmentId] = useState<string | null>(null);
  const [editingPaymentPatientName, setEditingPaymentPatientName] = useState<string>('');
  const [editingPaymentTotalPrice, setEditingPaymentTotalPrice] = useState<number>(0);
  const [editingPaymentCurrentAmount, setEditingPaymentCurrentAmount] = useState<number>(0);
  const [isEditingPayment, setIsEditingPayment] = useState(false);

  const { patients, loading: patientsLoading, addPatient, updatePatient, deletePatient, refetch: refetchPatients } = usePatients();
  const { 
    appointments, 
    loading: appointmentsLoading, 
    fetchAppointments, 
    fetchAppointmentsRange,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    completeAppointment,
    uncompleteAppointment,
    cancelAppointment,
    updatePaymentAmount,
    checkOverlap,
    saveAppointmentTreatments,
    fetchAppointmentTreatments 
  } = useAppointmentsDB();
  const { treatments } = useTreatments();
  const { cabinets, updateCabinetDoctor } = useCabinets();
  const { doctors } = useDoctors();
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const { shifts: doctorShifts } = useDoctorShifts(undefined, { start: dateStr, end: dateStr });
  const { isAdmin, doctorId } = useAuth();
  const { unreadCount } = useWhatsAppMessages();
  const urgentRemindersCount = useUrgentRemindersCount();
  
  // Reception user = not admin AND not a doctor
  const isReception = !isAdmin && !doctorId;

  // Navigation helpers
  const pushNavState = useCallback((state: NavigationState) => {
    if (isNavigatingRef.current) {
      isNavigatingRef.current = false;
      return;
    }
    
    setNavHistory(prev => {
      const newHistory = prev.slice(0, navIndex + 1);
      const lastState = newHistory[newHistory.length - 1];
      
      // Don't push duplicate states
      if (lastState && 
          lastState.tab === state.tab && 
          lastState.patientId === state.patientId) {
        return newHistory;
      }
      
      return [...newHistory, state];
    });
    setNavIndex(prev => prev + 1);
  }, [navIndex]);


  // Track tab changes for navigation history
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    pushNavState({ tab });
  }, [pushNavState]);

  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchAppointments(format(selectedDate, 'yyyy-MM-dd'));
    } else if (activeTab === 'reports') {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      fetchAppointmentsRange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    }
  }, [selectedDate, activeTab]);

  // handlePatientFormSubmit, handleEditPatient, handleClosePatientForm
  const handlePatientFormSubmit = async (data: any) => {
    if (editingPatient) {
      return await updatePatient(editingPatient.id, data);
    } else {
      return await addPatient(data);
    }
  };

  const handleEditPatient = (patient: Patient) => {
    setEditingPatient(patient);
    setShowPatientForm(true);
    setSelectedPatient(null);
  };

  const handleClosePatientForm = () => {
    setShowPatientForm(false);
    setEditingPatient(undefined);
  };

  // Appointment handlers
  const handleSlotClick = (time: string, cabinetId: number) => {
    setSelectedTime(time);
    setSelectedCabinetForForm(cabinetId);
    setEditingAppointmentData(undefined);
    setExistingInterventions([]);
    setShowAppointmentForm(true);
  };

  const handleNewAppointment = () => {
    setSelectedTime(undefined);
    setSelectedCabinetForForm(undefined);
    setEditingAppointmentData(undefined);
    setExistingInterventions([]);
    setShowAppointmentForm(true);
  };

  const handleAppointmentClick = async (appointment: Appointment) => {
    // Find the full appointment data from DB
    const dbAppointment = appointments.find(a => a.id === appointment.id);
    
    setEditingAppointmentData({
      id: appointment.id,
      patientId: dbAppointment?.patient_id,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      cabinetId: appointment.cabinetId,
      doctorId: dbAppointment?.doctor_id || undefined,
      time: appointment.time,
      duration: appointment.duration,
      treatmentId: dbAppointment?.treatment_id || undefined,
      treatmentName: appointment.treatment,
      notes: appointment.notes,
      price: dbAppointment?.price || undefined,
      status: dbAppointment?.status || appointment.status,
    });

    // Load existing interventions from DB
    if (dbAppointment?.appointment_treatments && dbAppointment.appointment_treatments.length > 0) {
      setExistingInterventions(
        dbAppointment.appointment_treatments.map((t: any): SelectedIntervention => {
          const intervention: SelectedIntervention = {
            id: t.id,
            treatmentId: t.treatment_id || '',
            treatmentName: t.treatment_name,
            price: t.price,
            cas: (t.decont || 0) + (t.co_plata || 0),
            laborator: t.laborator || 0,
            duration: t.duration,
            discountPercent: t.discount_percent || 0,
            selectedTeeth: t.tooth_numbers || [],
            teethDetails: (t.tooth_data || []).map((td: any) => ({
              toothNumber: td.toothNumber,
              status: td.status as any,
              notes: td.notes,
            })),
          };
          return intervention;
        })
      );
    } else {
      // Fallback: fetch from DB if not included
      const treatmentsData = await fetchAppointmentTreatments(appointment.id);
      if (treatmentsData.length > 0) {
        setExistingInterventions(
          treatmentsData.map((t): SelectedIntervention => {
            const intervention: SelectedIntervention = {
              id: t.id,
              treatmentId: t.treatment_id || '',
              treatmentName: t.treatment_name,
              price: t.price,
              cas: (t.decont || 0) + (t.co_plata || 0),
              laborator: t.laborator || 0,
              duration: t.duration,
              discountPercent: t.discount_percent || 0,
              selectedTeeth: t.tooth_numbers || [],
              teethDetails: (t.tooth_data || []).map((td) => ({
                toothNumber: td.toothNumber,
                status: td.status as any,
                notes: td.notes,
              })),
            };
            return intervention;
          })
        );
      } else {
        setExistingInterventions([]);
      }
    }
    
    setShowAppointmentForm(true);
  };

  const handleAppointmentSubmit = async (formData: AppointmentFormData) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    
    // If it's a new patient, we need to create them first
    let patientId = formData.patientId;
    
    if (!patientId && formData.patientName) {
      // Try to find existing patient or create new one
      const nameParts = formData.patientName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const newPatient = await addPatient({
        first_name: firstName,
        last_name: lastName,
        phone: formData.patientPhone,
      });
      
      if (newPatient) {
        patientId = newPatient.id;
      }
    }
    
    if (!patientId) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut identifica pacientul',
        variant: 'destructive',
      });
      return;
    }

    const appointmentPayload = {
      patient_id: patientId,
      cabinet_id: formData.cabinetId,
      doctor_id: formData.doctorId || undefined,
      appointment_date: dateStr,
      start_time: formData.time,
      duration: formData.duration,
      treatment_id: formData.treatmentId,
      notes: formData.notes,
      price: formData.price,
    };

    let appointmentId: string | undefined;
    let saveSuccess = false;
    
    // Get patient name for notification
    let patientFullName = formData.patientName;
    if (!patientFullName && formData.patientId) {
      const patient = patients.find(p => p.id === formData.patientId);
      if (patient) {
        patientFullName = `${patient.first_name} ${patient.last_name}`;
      }
    }
    
    // Get cabinet name for notification
    const cabinet = cabinets.find(c => c.id === formData.cabinetId);
    const cabinetName = cabinet?.name || 'Cabinet';
    
    if (editingAppointmentData) {
      const result = await updateAppointment(editingAppointmentData.id, appointmentPayload);
      if (result) {
        appointmentId = editingAppointmentData.id;
        saveSuccess = true;
      }
    } else {
      const newAppointment = await addAppointment(appointmentPayload, patientFullName, cabinetName);
      if (newAppointment) {
        appointmentId = newAppointment.id;
        saveSuccess = true;
      }
    }

    // If appointment save failed, don't close the form
    if (!saveSuccess || !appointmentId) {
      return;
    }

    // Save appointment treatments
    if (formData.selectedTreatments.length > 0) {
      const treatmentsToSave = formData.selectedTreatments.map(t => ({
        appointment_id: appointmentId!,
        treatment_id: t.treatmentId || undefined,
        treatment_name: t.treatmentName,
        price: t.price,
        decont: t.cas,
        co_plata: 0,
        laborator: t.laborator || 0,
        duration: t.duration,
        discount_percent: t.discountPercent || 0,
        tooth_numbers: t.selectedTeeth || [],
        tooth_data: t.teethDetails || [],
        plan_item_id: t.planItemId || undefined,
      }));
      
      const treatmentsSaved = await saveAppointmentTreatments(appointmentId, treatmentsToSave);
      if (!treatmentsSaved) {
        // Treatments failed but appointment was saved - notify user
        toast({
          title: 'Atenție',
          description: 'Programarea a fost salvată, dar intervențiile nu au putut fi adăugate. Editați programarea pentru a le adăuga din nou.',
          variant: 'destructive',
        });
      }
    }
    
    setShowAppointmentForm(false);
    setEditingAppointmentData(undefined);
    setExistingInterventions([]);
    fetchAppointments(format(selectedDate, 'yyyy-MM-dd'));
  };

  const handleAppointmentDelete = async () => {
    if (editingAppointmentData) {
      await deleteAppointment(editingAppointmentData.id);
      setShowAppointmentForm(false);
      setEditingAppointmentData(undefined);
      fetchAppointments(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  const handleAppointmentComplete = (id: string) => {
    // Find appointment from DB appointments
    const dbAppointment = appointments.find((a) => a.id === id);
    const patientName = dbAppointment?.patients
      ? `${dbAppointment.patients.first_name} ${dbAppointment.patients.last_name}`
      : '';

    const treatments = dbAppointment?.appointment_treatments ?? [];

    // Total price is the "gross" amount (before CAS + discounts)
    const totalPrice =
      (dbAppointment?.price ?? 0) ||
      treatments.reduce((sum, t) => sum + (t.price || 0), 0);

    // De plată (net) = sum( (price - decont) * (1 - discount_percent/100) )
    const payableAmount = treatments.length
      ? treatments.reduce((sum, t) => {
          const price = t.price || 0;
          const cas = t.decont || 0;
          const discountPercent = t.discount_percent || 0;

          const priceAfterCas = price - cas;
          const discountAmount = priceAfterCas * (discountPercent / 100);
          return sum + (priceAfterCas - discountAmount);
        }, 0)
      : totalPrice -
        (treatments.reduce((sum, t) => sum + (t.decont || 0), 0) || 0);

    setCompletingAppointmentId(id);
    setCompletingAppointmentName(patientName);
    setCompletingAppointmentPrice(totalPrice);
    setCompletingAppointmentPayable(payableAmount);
    setCompleteDialogOpen(true);
  };

  const handleConfirmComplete = async (paymentData: PaymentData) => {
    if (!completingAppointmentId) return;
    
    setIsCompleting(true);
    await completeAppointment(completingAppointmentId, paymentData.method, paymentData.paidAmount);
    setIsCompleting(false);
    setCompleteDialogOpen(false);
    setCompletingAppointmentId(null);
    setCompletingAppointmentName('');
    setCompletingAppointmentPrice(0);
    setCompletingAppointmentPayable(0);
  };

  const handleAppointmentCancelClick = (id: string) => {
    const appointment = appointments.find(a => a.id === id);
    if (appointment) {
      setCancellingAppointmentId(id);
      setCancellingAppointmentName(
        appointment.patients 
          ? `${appointment.patients.first_name} ${appointment.patients.last_name}`
          : 'Pacient necunoscut'
      );
      setCancelDialogOpen(true);
    }
  };

  const handleAppointmentCancelConfirm = async (reason: string) => {
    if (cancellingAppointmentId) {
      await cancelAppointment(cancellingAppointmentId, reason);
      setCancelDialogOpen(false);
      setCancellingAppointmentId(null);
      setCancellingAppointmentName('');
    }
  };

  // Handler for uncompleting (reverting) a completed appointment
  const handleAppointmentUncomplete = async () => {
    if (editingAppointmentData && editingAppointmentData.status === 'completed') {
      await uncompleteAppointment(editingAppointmentData.id);
      setShowAppointmentForm(false);
      setEditingAppointmentData(undefined);
      fetchAppointments(format(selectedDate, 'yyyy-MM-dd'));
    }
  };

  // Handler for editing payment on completed appointments
  const handleEditPayment = (id: string) => {
    const dbAppointment = appointments.find(a => a.id === id);
    if (!dbAppointment) return;

    const patientName = dbAppointment.patients
      ? `${dbAppointment.patients.first_name} ${dbAppointment.patients.last_name}`
      : '';

    const treatments = dbAppointment.appointment_treatments ?? [];
    const totalPrice = (dbAppointment.price ?? 0) ||
      treatments.reduce((sum, t) => sum + (t.price || 0), 0);

    setEditingPaymentAppointmentId(id);
    setEditingPaymentPatientName(patientName);
    setEditingPaymentTotalPrice(totalPrice);
    setEditingPaymentCurrentAmount(dbAppointment.paid_amount || 0);
    setEditPaymentDialogOpen(true);
  };

  const handleConfirmEditPayment = async (paidAmount: number) => {
    if (!editingPaymentAppointmentId) return;
    
    setIsEditingPayment(true);
    await updatePaymentAmount(editingPaymentAppointmentId, paidAmount);
    setIsEditingPayment(false);
    setEditPaymentDialogOpen(false);
    setEditingPaymentAppointmentId(null);
  };

  // Convert appointments to legacy format for existing components
  const legacyAppointments: Appointment[] = appointments.map((apt) => {
    const doctorFromJoin = apt.doctors;
    const doctorFromList = apt.doctor_id ? doctors.find(d => d.id === apt.doctor_id) : undefined;
    const doctor = doctorFromJoin || doctorFromList;

    return {
      id: apt.id,
      cabinetId: apt.cabinet_id,
      patientName: apt.patients ? `${apt.patients.first_name} ${apt.patients.last_name}` : 'Pacient necunoscut',
      patientPhone: apt.patients?.phone || '',
      date: apt.appointment_date,
      time: apt.start_time.substring(0, 5),
      duration: apt.duration,
      treatment: apt.treatments?.name || 'Consultație',
      notes: apt.notes,
      doctorId: apt.doctor_id || undefined,
      doctorName: doctor?.name || undefined,
      doctorColor: doctor?.color || undefined,
      status: apt.status,
    };
  });

  // Filter appointments by selected doctor
  const filteredAppointments = selectedDoctorFilter
    ? legacyAppointments.filter(apt => apt.doctorId === selectedDoctorFilter)
    : legacyAppointments;

  const todayAppointments = filteredAppointments.filter(
    (apt) =>
      apt.date === format(selectedDate, 'yyyy-MM-dd') &&
      (selectedCabinet === null || apt.cabinetId === selectedCabinet)
  ).sort((a, b) => a.time.localeCompare(b.time));

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'calendar':
        return (
          <div className="mt-2">
            <TimeSlotGrid
              selectedDate={selectedDate}
              selectedCabinet={selectedCabinet}
              appointments={filteredAppointments}
              cabinets={cabinets}
              doctorShifts={doctorShifts}
              doctors={doctors}
              onSlotClick={handleSlotClick}
              onAppointmentClick={handleAppointmentClick}
              onAppointmentComplete={handleAppointmentComplete}
              onAppointmentCancel={handleAppointmentCancelClick}
              onEditPayment={handleEditPayment}
            />
          </div>
        );
      case 'patients':
        return (
          <PatientsList
            patients={patients}
            loading={patientsLoading}
            onEdit={handleEditPatient}
            onDelete={deletePatient}
            onAddNew={() => {
              setEditingPatient(undefined);
              setShowPatientForm(true);
            }}
            onViewDetails={(patient) => {
              pushNavState({ 
                tab: 'patients', 
                patientId: patient.id, 
                patientName: `${patient.first_name} ${patient.last_name}` 
              });
              setSelectedPatient(patient);
            }}
            onRefetch={refetchPatients}
          />
        );
      case 'reminders':
        return <PatientRemindersPanel />;
      case 'reports':
        return (
          <div className="space-y-4">
            <TodaySummary selectedDate={selectedDate} appointments={legacyAppointments} />
            <ReportsDashboard
              appointments={appointments}
              loading={appointmentsLoading}
              onFetchRange={fetchAppointmentsRange}
            />
          </div>
        );
      case 'treatment-plan':
        return (
          <TreatmentPlan
            patients={patients}
            treatments={treatments}
            doctors={doctors}
            initialPatientId={treatmentPlanPatientId}
            initialPlan={editingTreatmentPlan}
            onPlanSaved={() => {
              setEditingTreatmentPlan(undefined);
            }}
          />
        );
      case 'printabile':
        return <PrintablesSection patients={patients} doctors={doctors} />;
      case 'expenses':
        return isAdmin ? <MonthlyExpenses /> : null;
      case 'stock':
        return <StockManagement />;
      case 'schedule':
        return (
          <DoctorScheduleManagement 
            selectedDoctorId={doctorId || undefined}
            isAdmin={isAdmin} 
          />
        );
      case 'whatsapp':
        return <WhatsAppInbox />;
      case 'laborator':
        return <LaboratoryTab patients={patients} doctors={doctors} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen} style={{ '--sidebar-top': '3.5rem' } as React.CSSProperties} className="!min-h-0 flex-1 sm:[--sidebar-top:4rem]">
        <div className="flex w-full">
          <AppSidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isAdmin={isAdmin}
            isReception={isReception}
            unreadCount={unreadCount}
            pendingRemindersCount={urgentRemindersCount}
          />

          <main className="flex-1 min-w-0 w-full">
            {/* Calendar controls - only shown on calendar tab */}
            {activeTab === 'calendar' && (
              <div className="sticky top-14 sm:top-16 z-30 bg-background py-2 border-b border-border px-1 sm:px-2 lg:px-4 space-y-2 md:space-y-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <SidebarTrigger />
                  <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
                  <DoctorFilter
                    doctors={doctors}
                    selectedDoctorId={selectedDoctorFilter}
                    onDoctorChange={setSelectedDoctorFilter}
                  />
                  <div className="hidden md:flex md:items-center md:gap-2">
                    <div className="border-l border-border h-6 mx-1" />
                    <CabinetTabs
                      selectedCabinet={selectedCabinet}
                      onSelectCabinet={setSelectedCabinet}
                      cabinets={cabinets}
                    />
                  </div>
                  <div className="flex gap-2 ml-auto">
                    <AppointmentSearch
                      appointments={legacyAppointments}
                      onAppointmentSelect={(date, appointmentId) => {
                        setSelectedDate(date);
                        const apt = legacyAppointments.find(a => a.id === appointmentId);
                        if (apt) {
                          setSelectedCabinet(apt.cabinetId);
                          if (apt.doctorId) {
                            setSelectedDoctorFilter(apt.doctorId);
                          }
                        }
                      }}
                    />
                    <AvailableSlotsSearch
                      appointments={legacyAppointments}
                      cabinets={cabinets}
                      onSlotSelect={(date, time, cabinetId) => {
                        setSelectedDate(date);
                        setSelectedCabinet(cabinetId);
                        handleSlotClick(time, cabinetId);
                      }}
                    />
                    <Button className="gap-2" onClick={handleNewAppointment}>
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Programare nouă</span>
                      <span className="sm:hidden">Nou</span>
                    </Button>
                  </div>
                </div>
                {/* Row 2: Cabinet tabs - mobile only */}
                <div className="flex items-center gap-2 mt-2 md:hidden">
                  <CabinetTabs
                    selectedCabinet={selectedCabinet}
                    onSelectCabinet={setSelectedCabinet}
                    cabinets={cabinets}
                  />
                </div>
              </div>
            )}

            {/* Content area */}
            <div className="px-1 sm:px-2 lg:px-4 py-2 sm:py-4">
              {activeTab !== 'calendar' && <SidebarTrigger className="mb-2" />}
              {renderActiveContent()}
            </div>
          </main>
        </div>
      </SidebarProvider>

      {/* Patient Form */}
      <PatientForm
        open={showPatientForm}
        onClose={handleClosePatientForm}
        onSubmit={handlePatientFormSubmit}
        editingPatient={editingPatient}
        allPatients={patients}
      />

      {/* Patient Details */}
      <PatientDetails
        patient={selectedPatient}
        open={selectedPatient !== null}
        onClose={() => {
          pushNavState({ tab: activeTab });
          setSelectedPatient(null);
          setPatientDetailsInitialTab('info');
        }}
        initialTab={patientDetailsInitialTab}
        onEdit={handleEditPatient}
        onOpenTreatmentPlan={(patient) => {
          pushNavState({ 
            tab: 'patients', 
            patientId: patient.id, 
            patientName: `${patient.first_name} ${patient.last_name}` 
          });
          
          setTreatmentPlanPatientId(patient.id);
          setEditingTreatmentPlan(undefined);
          setTreatmentPlanSourcePatient(patient);
          setSelectedPatient(null);
          setActiveTab('treatment-plan');
          
          pushNavState({ tab: 'treatment-plan' });
        }}
        onEditTreatmentPlan={(patient, plan) => {
          pushNavState({ 
            tab: 'patients', 
            patientId: patient.id, 
            patientName: `${patient.first_name} ${patient.last_name}` 
          });
          
          setTreatmentPlanPatientId(patient.id);
          setEditingTreatmentPlan({
            id: plan.id,
            patientId: plan.patientId,
            name: plan.name,
            doctorId: plan.doctorId,
            nextAppointmentDate: plan.nextAppointmentDate,
            nextAppointmentTime: plan.nextAppointmentTime,
            discountPercent: plan.discountPercent,
            items: plan.items.map(item => ({
              treatmentId: item.treatmentId,
              treatmentName: item.treatmentName,
              toothNumbers: item.toothNumbers || [],
              doctorId: item.doctorId,
              duration: item.duration || 30,
              initialPrice: item.price,
              laborator: item.laborator || 0,
              cas: item.cas || 0,
              discountPercent: item.discountPercent || 0,
              completedAt: item.completedAt,
              paymentStatus: item.paymentStatus,
              paidAmount: item.paidAmount || 0,
            })),
          });
          setTreatmentPlanSourcePatient(patient);
          setSelectedPatient(null);
          setActiveTab('treatment-plan');
          
          pushNavState({ tab: 'treatment-plan' });
        }}
        onCreateAppointment={(patient, treatmentName, interventions, doctorId) => {
          setSelectedPatient(null);
          setEditingAppointmentData({
            id: '',
            patientId: patient.id,
            patientName: `${patient.first_name} ${patient.last_name}`,
            patientPhone: patient.phone,
            cabinetId: selectedCabinet || cabinets[0]?.id || 1,
            doctorId: doctorId || '',
            time: '',
            duration: interventions ? interventions.reduce((sum, i) => sum + i.duration, 0) : 30,
            treatmentName: treatmentName || '',
            notes: treatmentName ? `Plan tratament: ${treatmentName}` : '',
          });
          if (interventions && interventions.length > 0) {
            setExistingInterventions(interventions);
          }
          setShowAppointmentForm(true);
        }}
      />

      {/* Appointment Form */}
      <AppointmentForm
        open={showAppointmentForm}
        onClose={() => {
          setShowAppointmentForm(false);
          setEditingAppointmentData(undefined);
          setExistingInterventions([]);
        }}
        onSubmit={handleAppointmentSubmit}
        onDelete={editingAppointmentData ? handleAppointmentDelete : undefined}
        onUncomplete={editingAppointmentData?.status === 'completed' ? handleAppointmentUncomplete : undefined}
        onViewPatient={(patient) => {
          setShowAppointmentForm(false);
          pushNavState({ 
            tab: 'patients', 
            patientId: patient.id, 
            patientName: `${patient.first_name} ${patient.last_name}` 
          });
          setPatientDetailsInitialTab('info');
          setSelectedPatient(patient);
        }}
        onViewDentalStatus={(patient) => {
          setShowAppointmentForm(false);
          pushNavState({ 
            tab: 'patients', 
            patientId: patient.id, 
            patientName: `${patient.first_name} ${patient.last_name}` 
          });
          setPatientDetailsInitialTab('dental');
          setSelectedPatient(patient);
        }}
        onViewRadiographs={(patient) => {
          setShowAppointmentForm(false);
          pushNavState({ 
            tab: 'patients', 
            patientId: patient.id, 
            patientName: `${patient.first_name} ${patient.last_name}` 
          });
          setPatientDetailsInitialTab('radiographs');
          setSelectedPatient(patient);
        }}
        onViewPrintables={() => {
          setShowAppointmentForm(false);
          pushNavState({ tab: 'printabile' });
          setActiveTab('printabile');
        }}
        onViewReminder={(patient) => {
          setReminderDialogPatient(patient);
        }}
        onSendWhatsApp={(patient) => {
          setWhatsappDialogPatient(patient);
        }}
        selectedDate={selectedDate}
        onDateChange={(newDate) => setSelectedDate(newDate)}
        selectedTime={selectedTime}
        selectedCabinet={selectedCabinetForForm}
        editingAppointment={editingAppointmentData}
        existingInterventions={existingInterventions}
        patients={patients}
        treatments={treatments}
        cabinets={cabinets}
        doctors={doctors}
        isAdmin={isAdmin}
        userDoctorId={doctorId}
        checkOverlap={checkOverlap}
      />

      {/* Patient Reminder Dialog from Appointment Form */}
      {reminderDialogPatient && (
        <PatientReminderDialog
          open={!!reminderDialogPatient}
          onClose={() => setReminderDialogPatient(null)}
          patientId={reminderDialogPatient.id}
          patientName={`${reminderDialogPatient.last_name} ${reminderDialogPatient.first_name}`}
        />
      )}

      {/* WhatsApp Quick Send Dialog from Appointment Form */}
      {whatsappDialogPatient && (
        <WhatsAppQuickSendDialog
          open={!!whatsappDialogPatient}
          onOpenChange={(open) => { if (!open) setWhatsappDialogPatient(null); }}
          patientPhone={whatsappDialogPatient.phone}
          patientName={`${whatsappDialogPatient.last_name} ${whatsappDialogPatient.first_name}`}
          patientId={whatsappDialogPatient.id}
        />
      )}

      {/* Cabinet Settings */}
      <CabinetSettings
        open={showCabinetSettings}
        onClose={() => setShowCabinetSettings(false)}
        cabinets={cabinets}
        onUpdateDoctor={updateCabinetDoctor}
      />

      {/* Complete Appointment Dialog */}
      <CompleteAppointmentDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
        onConfirm={handleConfirmComplete}
        patientName={completingAppointmentName}
        totalPrice={completingAppointmentPrice}
        payableAmount={completingAppointmentPayable}
        isLoading={isCompleting}
      />

      {/* Cancel Appointment Dialog */}
      <CancelAppointmentDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        onConfirm={handleAppointmentCancelConfirm}
        patientName={cancellingAppointmentName}
      />

      {/* Edit Payment Dialog */}
      <EditPaymentDialog
        open={editPaymentDialogOpen}
        onOpenChange={setEditPaymentDialogOpen}
        onConfirm={handleConfirmEditPayment}
        patientName={editingPaymentPatientName}
        totalPrice={editingPaymentTotalPrice}
        currentPaidAmount={editingPaymentCurrentAmount}
        isLoading={isEditingPayment}
      />

    </div>
  );
};

export default Index;
