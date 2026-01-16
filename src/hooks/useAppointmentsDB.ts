import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
          treatments (id, name, default_duration)
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
          treatments (id, name, default_duration)
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
  };
}
