import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AppointmentTreatment {
  id: string;
  appointment_id: string;
  treatment_id?: string;
  treatment_name: string;
  price: number;
  decont: number;
  co_plata: number;
  duration: number;
  tooth_numbers: number[];
}

export interface AppointmentDB {
  id: string;
  patient_id: string;
  cabinet_id: number;
  treatment_id?: string;
  appointment_date: string;
  start_time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  price?: number;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  patients?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
    allergies?: string[];
  };
  treatments?: {
    id: string;
    name: string;
    default_duration: number;
  };
  appointment_treatments?: AppointmentTreatment[];
}

export type AppointmentInsert = {
  patient_id: string;
  cabinet_id: number;
  treatment_id?: string;
  appointment_date: string;
  start_time: string;
  duration: number;
  status?: string;
  notes?: string;
  price?: number;
};

export type AppointmentTreatmentInsert = {
  appointment_id: string;
  treatment_id?: string;
  treatment_name: string;
  price: number;
  decont: number;
  co_plata: number;
  duration: number;
  tooth_numbers: number[];
};

export function useAppointmentsDB() {
  const [appointments, setAppointments] = useState<AppointmentDB[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAppointments = async (date?: string) => {
    try {
      setLoading(true);
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients (id, first_name, last_name, phone, allergies),
          treatments (id, name, default_duration),
          appointment_treatments (id, appointment_id, treatment_id, treatment_name, price, decont, co_plata, duration, tooth_numbers)
        `)
        .order('start_time', { ascending: true });

      if (date) {
        query = query.eq('appointment_date', date);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments((data as unknown as AppointmentDB[]) || []);
    } catch (error: any) {
      console.error('Error fetching appointments:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca programările',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointmentsRange = async (startDate: string, endDate: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients (id, first_name, last_name, phone, allergies),
          treatments (id, name, default_duration),
          appointment_treatments (id, appointment_id, treatment_id, treatment_name, price, decont, co_plata, duration, tooth_numbers)
        `)
        .gte('appointment_date', startDate)
        .lte('appointment_date', endDate)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setAppointments((data as unknown as AppointmentDB[]) || []);
    } catch (error: any) {
      console.error('Error fetching appointments range:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca programările',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addAppointment = async (appointment: AppointmentInsert) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .insert(appointment)
        .select(`
          *,
          patients (id, first_name, last_name, phone, allergies),
          treatments (id, name, default_duration)
        `)
        .single();

      if (error) throw error;

      setAppointments((prev) => [...prev, data as unknown as AppointmentDB]);
      toast({
        title: 'Succes',
        description: 'Programarea a fost adăugată',
      });
      return data;
    } catch (error: any) {
      console.error('Error adding appointment:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga programarea',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateAppointment = async (id: string, updates: Partial<AppointmentInsert>) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          patients (id, first_name, last_name, phone, allergies),
          treatments (id, name, default_duration)
        `)
        .single();

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? (data as unknown as AppointmentDB) : a))
      );
      toast({
        title: 'Succes',
        description: 'Programarea a fost actualizată',
      });
      return data;
    } catch (error: any) {
      console.error('Error updating appointment:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza programarea',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteAppointment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAppointments((prev) => prev.filter((a) => a.id !== id));
      toast({
        title: 'Succes',
        description: 'Programarea a fost ștearsă',
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting appointment:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge programarea',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getAppointmentsForDate = (date: string, cabinetId?: number) => {
    return appointments.filter(
      (apt) =>
        apt.appointment_date === date &&
        (cabinetId === undefined || apt.cabinet_id === cabinetId)
    );
  };

  const isSlotOccupied = (date: string, time: string, cabinetId: number, excludeId?: string) => {
    return appointments.some(
      (apt) =>
        apt.appointment_date === date &&
        apt.start_time === time &&
        apt.cabinet_id === cabinetId &&
        apt.status !== 'cancelled' &&
        apt.id !== excludeId
    );
  };

  const saveAppointmentTreatments = async (appointmentId: string, treatments: AppointmentTreatmentInsert[]) => {
    try {
      // First delete existing treatments for this appointment
      await supabase
        .from('appointment_treatments')
        .delete()
        .eq('appointment_id', appointmentId);

      // Then insert new treatments
      if (treatments.length > 0) {
        const treatmentsWithAppointmentId = treatments.map(t => ({
          ...t,
          appointment_id: appointmentId,
        }));

        const { error } = await supabase
          .from('appointment_treatments')
          .insert(treatmentsWithAppointmentId);

        if (error) throw error;
      }
      return true;
    } catch (error: any) {
      console.error('Error saving appointment treatments:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut salva intervențiile',
        variant: 'destructive',
      });
      return false;
    }
  };

  const fetchAppointmentTreatments = async (appointmentId: string): Promise<AppointmentTreatment[]> => {
    try {
      const { data, error } = await supabase
        .from('appointment_treatments')
        .select('*')
        .eq('appointment_id', appointmentId);

      if (error) throw error;
      return (data || []).map(t => ({
        id: t.id,
        appointment_id: t.appointment_id,
        treatment_id: t.treatment_id || undefined,
        treatment_name: t.treatment_name,
        price: Number(t.price) || 0,
        decont: Number(t.decont) || 0,
        co_plata: Number(t.co_plata) || 0,
        duration: t.duration || 30,
        tooth_numbers: t.tooth_numbers || [],
      }));
    } catch (error: any) {
      console.error('Error fetching appointment treatments:', error);
      return [];
    }
  };

  return {
    appointments,
    loading,
    fetchAppointments,
    fetchAppointmentsRange,
    addAppointment,
    updateAppointment,
    deleteAppointment,
    getAppointmentsForDate,
    isSlotOccupied,
    saveAppointmentTreatments,
    fetchAppointmentTreatments,
  };
}
