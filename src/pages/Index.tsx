import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Plus, Users, Calendar as CalendarIcon, BarChart3 } from 'lucide-react';
import { Header } from '@/components/Header';
import { DateNavigator } from '@/components/DateNavigator';
import { CabinetTabs } from '@/components/CabinetTabs';
import { TimeSlotGrid } from '@/components/TimeSlotGrid';
import { TodaySummary } from '@/components/TodaySummary';
import { PatientsList } from '@/components/PatientsList';
import { PatientForm } from '@/components/PatientForm';
import { PatientDetails } from '@/components/PatientDetails';
import { AppointmentForm, AppointmentFormData } from '@/components/AppointmentForm';
import { ReportsDashboard } from '@/components/ReportsDashboard';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePatients, Patient } from '@/hooks/usePatients';
import { useAppointmentsDB, AppointmentDB } from '@/hooks/useAppointmentsDB';
import { useTreatments } from '@/hooks/useTreatments';
import { CABINETS, TIME_SLOTS, Appointment } from '@/types/appointment';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCabinet, setSelectedCabinet] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');

  // Patient state
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatient, setEditingPatient] = useState<Patient | undefined>();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

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
    time: string;
    duration: number;
    treatmentId?: string;
    treatmentName: string;
    notes?: string;
    price?: number;
  } | undefined>();

  const { patients, loading: patientsLoading, addPatient, updatePatient, deletePatient } = usePatients();
  const { 
    appointments, 
    loading: appointmentsLoading, 
    fetchAppointments, 
    fetchAppointmentsRange,
    addAppointment,
    updateAppointment,
    deleteAppointment 
  } = useAppointmentsDB();
  const { treatments } = useTreatments();

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
    setShowAppointmentForm(true);
  };

  const handleNewAppointment = () => {
    setSelectedTime(undefined);
    setSelectedCabinetForForm(undefined);
    setEditingAppointmentData(undefined);
    setShowAppointmentForm(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    // Find the full appointment data from DB
    const dbAppointment = appointments.find(a => a.id === appointment.id);
    
    setEditingAppointmentData({
      id: appointment.id,
      patientId: dbAppointment?.patient_id,
      patientName: appointment.patientName,
      patientPhone: appointment.patientPhone,
      cabinetId: appointment.cabinetId,
      time: appointment.time,
      duration: appointment.duration,
      treatmentId: dbAppointment?.treatment_id || undefined,
      treatmentName: appointment.treatment,
      notes: appointment.notes,
      price: dbAppointment?.price || undefined,
    });
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
      appointment_date: dateStr,
      start_time: formData.time,
      duration: formData.duration,
      treatment_id: formData.treatmentId,
      notes: formData.notes,
      price: formData.price,
    };

    if (editingAppointmentData) {
      await updateAppointment(editingAppointmentData.id, appointmentPayload);
    } else {
      await addAppointment(appointmentPayload);
    }
    
    setShowAppointmentForm(false);
    setEditingAppointmentData(undefined);
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

  // Convert appointments to legacy format for existing components
  const legacyAppointments: Appointment[] = appointments.map((apt) => ({
    id: apt.id,
    cabinetId: apt.cabinet_id,
    patientName: apt.patients ? `${apt.patients.first_name} ${apt.patients.last_name}` : 'Pacient necunoscut',
    patientPhone: apt.patients?.phone || '',
    date: apt.appointment_date,
    time: apt.start_time.substring(0, 5),
    duration: apt.duration,
    treatment: apt.treatments?.name || 'Consultație',
    notes: apt.notes,
  }));

  const todayAppointments = legacyAppointments.filter(
    (apt) =>
      apt.date === format(selectedDate, 'yyyy-MM-dd') &&
      (selectedCabinet === null || apt.cabinetId === selectedCabinet)
  ).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="patients" className="gap-2">
              <Users className="h-4 w-4" />
              Pacienți
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Rapoarte
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            {/* Summary */}
            <TodaySummary selectedDate={selectedDate} appointments={legacyAppointments} />

            {/* Controls */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
              <Button className="gap-2" onClick={handleNewAppointment}>
                <Plus className="h-4 w-4" />
                Programare nouă
              </Button>
            </div>

            {/* Cabinet tabs */}
            <CabinetTabs
              selectedCabinet={selectedCabinet}
              onSelectCabinet={setSelectedCabinet}
            />

            {/* Time Grid */}
            <TimeSlotGrid
              selectedDate={selectedDate}
              selectedCabinet={selectedCabinet}
              appointments={legacyAppointments}
              onSlotClick={handleSlotClick}
              onAppointmentClick={handleAppointmentClick}
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
      />

      {/* Appointment Form */}
      <AppointmentForm
        open={showAppointmentForm}
        onClose={() => {
          setShowAppointmentForm(false);
          setEditingAppointmentData(undefined);
        }}
        onSubmit={handleAppointmentSubmit}
        onDelete={editingAppointmentData ? handleAppointmentDelete : undefined}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedCabinet={selectedCabinetForForm}
        editingAppointment={editingAppointmentData}
        patients={patients}
        treatments={treatments}
      />
    </div>
  );
};

export default Index;
