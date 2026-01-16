import { useState } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { Header } from '@/components/Header';
import { DateNavigator } from '@/components/DateNavigator';
import { CabinetTabs } from '@/components/CabinetTabs';
import { TimeSlotGrid } from '@/components/TimeSlotGrid';
import { TodaySummary } from '@/components/TodaySummary';
import { AppointmentForm } from '@/components/AppointmentForm';
import { AppointmentCard } from '@/components/AppointmentCard';
import { Button } from '@/components/ui/button';
import { useAppointments } from '@/hooks/useAppointments';
import { Appointment } from '@/types/appointment';

const Index = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCabinet, setSelectedCabinet] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [selectedTime, setSelectedTime] = useState<string>();
  const [selectedCabinetForForm, setSelectedCabinetForForm] = useState<number>();
  const [editingAppointment, setEditingAppointment] = useState<Appointment>();

  const {
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsForDate,
  } = useAppointments();

  const handleSlotClick = (time: string, cabinetId: number) => {
    setSelectedTime(time);
    setSelectedCabinetForForm(cabinetId);
    setEditingAppointment(undefined);
    setShowForm(true);
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    setShowForm(true);
  };

  const handleFormSubmit = (data: Omit<Appointment, 'id'>) => {
    if (editingAppointment) {
      updateAppointment(editingAppointment.id, data);
    } else {
      addAppointment(data);
    }
    setShowForm(false);
    setEditingAppointment(undefined);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingAppointment(undefined);
    setSelectedTime(undefined);
    setSelectedCabinetForForm(undefined);
  };

  const todayAppointments = getAppointmentsForDate(
    format(selectedDate, 'yyyy-MM-dd'),
    selectedCabinet ?? undefined
  ).sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container px-4 py-6">
        {/* Summary */}
        <div className="mb-6">
          <TodaySummary selectedDate={selectedDate} appointments={appointments} />
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Programare nouă
          </Button>
        </div>

        {/* Cabinet tabs */}
        <div className="mb-6">
          <CabinetTabs
            selectedCabinet={selectedCabinet}
            onSelectCabinet={setSelectedCabinet}
          />
        </div>

        {/* Main content - Grid view */}
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <TimeSlotGrid
            selectedDate={selectedDate}
            selectedCabinet={selectedCabinet}
            appointments={appointments}
            onSlotClick={handleSlotClick}
            onAppointmentClick={handleAppointmentClick}
          />

          {/* Sidebar - Today's appointments list */}
          <div className="rounded-xl bg-card border border-border p-4 shadow-sm h-fit lg:sticky lg:top-24">
            <h3 className="font-semibold text-foreground mb-4">
              Programări ({todayAppointments.length})
            </h3>
            {todayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nu există programări pentru această zi
              </p>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto pr-1">
                {todayAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onEdit={handleAppointmentClick}
                    onDelete={deleteAppointment}
                    showCabinet={selectedCabinet === null}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Appointment Form Dialog */}
      <AppointmentForm
        open={showForm}
        onClose={handleFormClose}
        onSubmit={handleFormSubmit}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        selectedCabinet={selectedCabinetForForm}
        editingAppointment={editingAppointment}
      />
    </div>
  );
};

export default Index;
