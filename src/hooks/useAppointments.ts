import { useState, useEffect } from 'react';
import { Appointment } from '@/types/appointment';

const STORAGE_KEY = 'dental-appointments';

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setAppointments(parsed);
        }
      } catch {
        console.error('Corrupt appointment data in localStorage, resetting');
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const saveAppointments = (newAppointments: Appointment[]) => {
    setAppointments(newAppointments);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newAppointments));
  };

  const addAppointment = (appointment: Omit<Appointment, 'id'>) => {
    const newAppointment: Appointment = {
      ...appointment,
      id: crypto.randomUUID(),
    };
    saveAppointments([...appointments, newAppointment]);
    return newAppointment;
  };

  const updateAppointment = (id: string, updates: Partial<Appointment>) => {
    const updated = appointments.map((apt) =>
      apt.id === id ? { ...apt, ...updates } : apt
    );
    saveAppointments(updated);
  };

  const deleteAppointment = (id: string) => {
    saveAppointments(appointments.filter((apt) => apt.id !== id));
  };

  const getAppointmentsForDate = (date: string, cabinetId?: number) => {
    return appointments.filter(
      (apt) =>
        apt.date === date && (cabinetId === undefined || apt.cabinetId === cabinetId)
    );
  };

  const getAppointmentForSlot = (
    date: string,
    time: string,
    cabinetId: number
  ) => {
    return appointments.find(
      (apt) =>
        apt.date === date && apt.time === time && apt.cabinetId === cabinetId
    );
  };

  const isSlotOccupied = (date: string, time: string, cabinetId: number) => {
    return appointments.some(
      (apt) =>
        apt.date === date && apt.time === time && apt.cabinetId === cabinetId
    );
  };

  return {
    appointments,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsForDate,
    getAppointmentForSlot,
    isSlotOccupied,
  };
}
