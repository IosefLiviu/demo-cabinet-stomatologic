import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Plus, Users, Calendar as CalendarIcon } from 'lucide-react';
import { Header } from '@/components/Header';
import { DateNavigator } from '@/components/DateNavigator';
import { CabinetTabs } from '@/components/CabinetTabs';
import { TimeSlotGrid } from '@/components/TimeSlotGrid';
import { TodaySummary } from '@/components/TodaySummary';
import { PatientsList } from '@/components/PatientsList';
import { PatientForm } from '@/components/PatientForm';
import { PatientDetails } from '@/components/PatientDetails';
import { AppointmentForm } from '@/components/AppointmentForm';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePatients, Patient } from '@/hooks/usePatients';
import { useAppointmentsDB, AppointmentDB } from '@/hooks/useAppointmentsDB';
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
  const [editingAppointment, setEditingAppointment] = useState<Appointment | undefined>();

  const { patients, loading: patientsLoading, addPatient, updatePatient, deletePatient } = usePatients();
  const { appointments, loading: appointmentsLoading, fetchAppointments, addAppointment } = useAppointmentsDB();

  useEffect(() => {
    fetchAppointments(format(selectedDate, 'yyyy-MM-dd'));
  }, [selectedDate]);

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
    setEditingAppointment(undefined);
    setShowAppointmentForm(true);
  };

  const handleNewAppointment = () => {
    setSelectedTime(undefined);
    setSelectedCabinetForForm(undefined);
    setEditingAppointment(undefined);
    setShowAppointmentForm(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowAppointmentForm(true);
  };

  const handleAppointmentSubmit = async (appointmentData: Omit<Appointment, 'id'>) => {
    // Find patient by name or create mapping
    const patient = patients.find(
      p => `${p.first_name} ${p.last_name}`.toLowerCase() === appointmentData.patientName.toLowerCase()
    );
    
    await addAppointment({
      patient_id: patient?.id || '', // Will need patient selection in future
      cabinet_id: appointmentData.cabinetId,
      appointment_date: appointmentData.date,
      start_time: appointmentData.time,
      duration: appointmentData.duration,
      notes: appointmentData.notes,
    });
    
    setShowAppointmentForm(false);
    fetchAppointments(format(selectedDate, 'yyyy-MM-dd'));
  };

  // Convert appointments to legacy format for existing components
  const legacyAppointments = appointments.map((apt) => ({
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
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="calendar" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="patients" className="gap-2">
              <Users className="h-4 w-4" />
              Pacienți
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
        onClose={() => setShowAppointmentForm(false)}
        onSubmit={handleAppointmentSubmit}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedCabinet={selectedCabinetForForm}
        editingAppointment={editingAppointment}
      />
    </div>
  );
};

export default Index;
