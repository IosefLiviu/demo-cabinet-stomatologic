import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Plus, Users, Calendar as CalendarIcon, BarChart3, Wallet, ClipboardList, Printer, ChevronDown, Radio, FileText, Pill, UserCheck } from 'lucide-react';
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
import { RadiologyReferral } from '@/components/RadiologyReferral';
import BillingInvoice from '@/components/BillingInvoice';
import PrescriptionForm from '@/components/PrescriptionForm';
import PatientInformation from '@/components/PatientInformation';
import { CabinetSettings } from '@/components/CabinetSettings';
import { CompleteAppointmentDialog, PaymentData } from '@/components/CompleteAppointmentDialog';
import { CancelAppointmentDialog } from '@/components/CancelAppointmentDialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePatients, Patient } from '@/hooks/usePatients';
import { useAppointmentsDB, AppointmentDB } from '@/hooks/useAppointmentsDB';
import { useTreatments } from '@/hooks/useTreatments';
import { useCabinets } from '@/hooks/useCabinets';
import { useDoctors } from '@/hooks/useDoctors';
import { useAuth } from '@/hooks/useAuth';
import { TIME_SLOTS, Appointment } from '@/types/appointment';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCabinet, setSelectedCabinet] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [showCabinetSettings, setShowCabinetSettings] = useState(false);

  // Patient state
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [treatmentPlanPatientId, setTreatmentPlanPatientId] = useState<string | undefined>();
  const [editingTreatmentPlan, setEditingTreatmentPlan] = useState<any>(undefined);

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

  const { patients, loading: patientsLoading, addPatient, updatePatient, deletePatient } = usePatients();
  const { 
    appointments, 
    loading: appointmentsLoading, 
    fetchAppointments, 
    fetchAppointmentsRange,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    completeAppointment,
    cancelAppointment,
    saveAppointmentTreatments,
    fetchAppointmentTreatments 
  } = useAppointmentsDB();
  const { treatments } = useTreatments();
  const { cabinets, updateCabinetDoctor } = useCabinets();
  const { doctors } = useDoctors();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (activeTab === 'calendar') {
      fetchAppointments(format(selectedDate, 'yyyy-MM-dd'));
    } else if (activeTab === 'reports') {
      const start = startOfMonth(new Date());
      const end = endOfMonth(new Date());
      fetchAppointmentsRange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
    }
  }, [selectedDate, activeTab]);

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
    
    if (editingAppointmentData) {
      await updateAppointment(editingAppointmentData.id, appointmentPayload);
      appointmentId = editingAppointmentData.id;
    } else {
      const newAppointment = await addAppointment(appointmentPayload);
      appointmentId = newAppointment?.id;
    }

    // Save appointment treatments
    if (appointmentId && formData.selectedTreatments.length > 0) {
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
      }));
      await saveAppointmentTreatments(appointmentId, treatmentsToSave);
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

  const todayAppointments = legacyAppointments.filter(
    (apt) =>
      apt.date === format(selectedDate, 'yyyy-MM-dd') &&
      (selectedCabinet === null || apt.cabinetId === selectedCabinet)
  ).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-2 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3 h-auto">
            <TabsTrigger value="calendar" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Calendar</span>
            </TabsTrigger>
            <TabsTrigger value="patients" className="gap-1 sm:gap-2 text-xs sm:text-sm py-2">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Pacienți</span>
            </TabsTrigger>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                className={`inline-flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm py-2 px-3 rounded-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    ['reports', 'expenses', 'radiology-referral', 'billing', 'prescription', 'patient-info'].includes(activeTab)
                      ? 'bg-background text-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Printer className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Printabile</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem 
                  onClick={() => setActiveTab('reports')} 
                  className={`gap-2 ${activeTab === 'reports' ? 'bg-accent font-semibold' : ''}`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Rapoarte
                  {activeTab === 'reports' && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem 
                    onClick={() => setActiveTab('expenses')} 
                    className={`gap-2 ${activeTab === 'expenses' ? 'bg-accent font-semibold' : ''}`}
                  >
                    <Wallet className="h-4 w-4" />
                    Cheltuieli
                    {activeTab === 'expenses' && <span className="ml-auto text-primary">✓</span>}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => setActiveTab('radiology-referral')} 
                  className={`gap-2 ${activeTab === 'radiology-referral' ? 'bg-accent font-semibold' : ''}`}
                >
                  <Radio className="h-4 w-4" />
                  Trimitere Radiologie
                  {activeTab === 'radiology-referral' && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setActiveTab('billing')} 
                  className={`gap-2 ${activeTab === 'billing' ? 'bg-accent font-semibold' : ''}`}
                >
                  <FileText className="h-4 w-4" />
                  Facturare
                  {activeTab === 'billing' && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setActiveTab('prescription')} 
                  className={`gap-2 ${activeTab === 'prescription' ? 'bg-accent font-semibold' : ''}`}
                >
                  <Pill className="h-4 w-4" />
                  Eliberare Rețetă
                  {activeTab === 'prescription' && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setActiveTab('patient-info')} 
                  className={`gap-2 ${activeTab === 'patient-info' ? 'bg-accent font-semibold' : ''}`}
                >
                  <UserCheck className="h-4 w-4" />
                  Informare Pacient
                  {activeTab === 'patient-info' && <span className="ml-auto text-primary">✓</span>}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TabsList>

          <TabsContent value="calendar" className="space-y-4 sm:space-y-6">
            {/* Summary */}
            <TodaySummary selectedDate={selectedDate} appointments={legacyAppointments} />

            {/* Controls */}
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
              <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
              <Button className="gap-2 w-full sm:w-auto" onClick={handleNewAppointment}>
                <Plus className="h-4 w-4" />
                Programare nouă
              </Button>
            </div>

            {/* Cabinet tabs */}
            <CabinetTabs
              selectedCabinet={selectedCabinet}
              onSelectCabinet={setSelectedCabinet}
              cabinets={cabinets}
            />

            {/* Time Grid */}
            <TimeSlotGrid
              selectedDate={selectedDate}
              selectedCabinet={selectedCabinet}
              appointments={legacyAppointments}
              cabinets={cabinets}
              onSlotClick={handleSlotClick}
              onAppointmentClick={handleAppointmentClick}
              onAppointmentComplete={handleAppointmentComplete}
              onAppointmentCancel={handleAppointmentCancelClick}
            />
          </TabsContent>

          <TabsContent value="patients">
            <PatientsList
              patients={patients}
              loading={patientsLoading}
              onEdit={handleEditPatient}
              onDelete={deletePatient}
              onAddNew={() => {
                setEditingPatient(undefined);
                setShowPatientForm(true);
              }}
              onViewDetails={setSelectedPatient}
            />
          </TabsContent>

          <TabsContent value="reports">
            <ReportsDashboard
              appointments={appointments}
              loading={appointmentsLoading}
              onFetchRange={fetchAppointmentsRange}
            />
          </TabsContent>

          <TabsContent value="treatment-plan">
            <TreatmentPlan
              patients={patients}
              treatments={treatments}
              doctors={doctors}
              initialPatientId={treatmentPlanPatientId}
              initialPlan={editingTreatmentPlan}
onPlanSaved={() => {
                // Plan stays open, just clear the initial editing state
                setEditingTreatmentPlan(undefined);
              }}
            />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="expenses">
              <MonthlyExpenses />
            </TabsContent>
          )}

          <TabsContent value="radiology-referral">
            <RadiologyReferral
              patients={patients}
              doctors={doctors}
            />
          </TabsContent>

          <TabsContent value="billing">
            <BillingInvoice patients={patients} />
          </TabsContent>

          <TabsContent value="prescription">
            <PrescriptionForm patients={patients} doctors={doctors} />
          </TabsContent>

          <TabsContent value="patient-info">
            <PatientInformation patients={patients} doctors={doctors} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Patient Form */}
      <PatientForm
        open={showPatientForm}
        onClose={handleClosePatientForm}
        onSubmit={handlePatientFormSubmit}
        editingPatient={editingPatient}
      />

      {/* Patient Details */}
      <PatientDetails
        patient={selectedPatient}
        open={selectedPatient !== null}
        onClose={() => setSelectedPatient(null)}
        onEdit={handleEditPatient}
        onOpenTreatmentPlan={(patient) => {
          setTreatmentPlanPatientId(patient.id);
          setEditingTreatmentPlan(undefined);
          setActiveTab('treatment-plan');
        }}
        onEditTreatmentPlan={(patient, plan) => {
          setTreatmentPlanPatientId(patient.id);
          setEditingTreatmentPlan({
            id: plan.id,
            patientId: plan.patientId,
            doctorId: plan.doctorId,
            nextAppointmentDate: plan.nextAppointmentDate,
            nextAppointmentTime: plan.nextAppointmentTime,
            discountPercent: plan.discountPercent,
            items: plan.items.map(item => ({
              treatmentId: item.treatmentId,
              treatmentName: item.treatmentName,
              toothNumbers: item.toothNumbers || [],
              doctorId: item.doctorId,
              unitPrice: item.price,
            })),
          });
          setActiveTab('treatment-plan');
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
          // Set existing interventions from treatment plan
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
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedCabinet={selectedCabinetForForm}
        editingAppointment={editingAppointmentData}
        existingInterventions={existingInterventions}
        patients={patients}
        treatments={treatments}
        cabinets={cabinets}
        doctors={doctors}
        isAdmin={isAdmin}
      />

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

    </div>
  );
};

export default Index;
