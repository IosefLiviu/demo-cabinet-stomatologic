import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ToothDataEntry {
  toothNumber: number;
  status: string;
  notes?: string;
}

export interface AppointmentTreatment {
  id: string;
  appointment_id: string;
  treatment_id?: string;
  treatment_name: string;
  price: number;
  decont: number;
  co_plata: number;
  laborator: number;
  duration: number;
  discount_percent: number;
  tooth_numbers: number[];
  tooth_data?: ToothDataEntry[];
}

export interface AppointmentDB {
  id: string;
  patient_id: string;
  cabinet_id: number;
  treatment_id?: string;
  doctor_id?: string;
  appointment_date: string;
  start_time: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  price?: number;
  is_paid: boolean;
  paid_amount?: number;
  payment_method?: string;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
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
  doctors?: {
    id: string;
    name: string;
    color: string;
  };
  appointment_treatments?: AppointmentTreatment[];
}

export type AppointmentInsert = {
  patient_id: string;
  cabinet_id: number;
  treatment_id?: string;
  doctor_id?: string;
  appointment_date: string;
  start_time: string;
  duration: number;
  status?: string;
  notes?: string;
  price?: number;
};

export interface ToothDataItem {
  toothNumber: number;
  status: string;
  notes?: string;
}

export type AppointmentTreatmentInsert = {
  appointment_id: string;
  treatment_id?: string;
  treatment_name: string;
  price: number;
  decont: number;
  co_plata: number;
  laborator: number;
  duration: number;
  discount_percent?: number;
  tooth_numbers: number[];
  tooth_data?: ToothDataItem[];
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
          doctors (id, name, color),
          appointment_treatments (id, appointment_id, treatment_id, treatment_name, price, decont, co_plata, laborator, duration, tooth_numbers, tooth_data)
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
          doctors (id, name, color),
          appointment_treatments (id, appointment_id, treatment_id, treatment_name, price, decont, co_plata, laborator, duration, tooth_numbers, tooth_data)
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
          treatments (id, name, default_duration),
          doctors (id, name, color)
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
          treatments (id, name, default_duration),
          doctors (id, name, color)
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
          appointment_id: appointmentId,
          treatment_id: t.treatment_id,
          treatment_name: t.treatment_name,
          price: t.price,
          decont: t.decont,
          co_plata: t.co_plata,
          laborator: t.laborator || 0,
          duration: t.duration,
          discount_percent: t.discount_percent || 0,
          tooth_numbers: t.tooth_numbers,
          tooth_data: t.tooth_data ? JSON.parse(JSON.stringify(t.tooth_data)) : [],
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
        laborator: Number(t.laborator) || 0,
        duration: t.duration || 30,
        discount_percent: Number(t.discount_percent) || 0,
        tooth_numbers: t.tooth_numbers || [],
        tooth_data: (t.tooth_data as unknown as ToothDataEntry[]) || [],
      }));
    } catch (error: any) {
      console.error('Error fetching appointment treatments:', error);
      return [];
    }
  };

  const completeAppointment = async (
    id: string, 
    paymentMethod: 'card' | 'cash' | 'unpaid' | 'partial_card' | 'partial_cash',
    paidAmount?: number
  ) => {
    try {
      const isPartial = paymentMethod.startsWith('partial_');
      const isPaid = paymentMethod !== 'unpaid' && !isPartial;
      
      // First get the appointment with its treatments
      const appointment = appointments.find(a => a.id === id);
      
      // Determine paid amount
      // paidAmount is now passed from the dialog (which calculates price - CAS for full payments)
      const actualPaidAmount = paymentMethod === 'unpaid' ? 0 : (paidAmount || 0);
      
      // Format payment method label
      const getPaymentLabel = () => {
        if (paymentMethod === 'card') return 'Card';
        if (paymentMethod === 'cash') return 'Cash';
        if (paymentMethod === 'partial_card') return `Parțial Card (${actualPaidAmount} RON)`;
        if (paymentMethod === 'partial_cash') return `Parțial Cash (${actualPaidAmount} RON)`;
        return 'Neachitat';
      };
      
      // Update the appointment status and payment info
      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          status: 'completed',
          is_paid: isPaid,
          paid_amount: actualPaidAmount,
          payment_method: paymentMethod,
          notes: appointment?.notes 
            ? `${appointment.notes}\n[Plată: ${getPaymentLabel()}]`
            : `[Plată: ${getPaymentLabel()}]`
        })
        .eq('id', id)
        .select(`
          *,
          patients (id, first_name, last_name, phone, allergies),
          treatments (id, name, default_duration),
          doctors (id, name, color),
          appointment_treatments (id, appointment_id, treatment_id, treatment_name, price, decont, co_plata, duration, tooth_numbers, tooth_data)
        `)
        .single();

      if (error) throw error;

      const completedAppointment = data as unknown as AppointmentDB;

      // Add treatments to patient's treatment_records (fișa pacientului)
      if (completedAppointment.appointment_treatments && completedAppointment.appointment_treatments.length > 0) {
        const treatmentRecords = completedAppointment.appointment_treatments.map(t => ({
          patient_id: completedAppointment.patient_id,
          appointment_id: completedAppointment.id,
          treatment_id: t.treatment_id || null,
          treatment_name: t.treatment_name,
          price: t.price,
          tooth_numbers: t.tooth_numbers,
          cabinet_id: completedAppointment.cabinet_id,
          performed_at: new Date().toISOString(),
          notes: `Metodă plată: ${getPaymentLabel()}`,
        }));

        const { error: recordsError } = await supabase
          .from('treatment_records')
          .insert(treatmentRecords);

        if (recordsError) {
          console.error('Error saving treatment records:', recordsError);
          // Don't throw - the appointment was completed, just log the error
        }

        // Deduct CAS discount from monthly budget
        const totalCas = completedAppointment.appointment_treatments.reduce(
          (sum, t) => sum + (Number(t.decont) || 0), 
          0
        );
        
        if (totalCas > 0) {
          const currentMonthYear = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
          
          // Get current budget
          const { data: budgetData } = await supabase
            .from('cas_budget')
            .select('*')
            .eq('month_year', currentMonthYear)
            .maybeSingle();

          if (budgetData) {
            // Update existing budget
            await supabase
              .from('cas_budget')
              .update({ used_budget: (budgetData.used_budget || 0) + totalCas })
              .eq('month_year', currentMonthYear);
          } else {
            // Create new budget entry with used amount
            await supabase
              .from('cas_budget')
              .insert({ month_year: currentMonthYear, initial_budget: 0, used_budget: totalCas });
          }
        }
      }

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? completedAppointment : a))
      );
      
      toast({
        title: 'Succes',
        description: `Programarea a fost finalizată - ${getPaymentLabel()}`,
      });
      return data;
    } catch (error: any) {
      console.error('Error completing appointment:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut finaliza programarea',
        variant: 'destructive',
      });
      return null;
    }
  };

  const cancelAppointment = async (id: string, cancellationReason?: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          status: 'cancelled',
          cancellation_reason: cancellationReason || null,
          cancelled_at: new Date().toISOString()
        })
        .eq('id', id)
        .select(`
          *,
          patients (id, first_name, last_name, phone, allergies),
          treatments (id, name, default_duration),
          doctors (id, name, color),
          appointment_treatments (id, appointment_id, treatment_id, treatment_name, price, decont, co_plata, duration, tooth_numbers, tooth_data)
        `)
        .single();

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? (data as unknown as AppointmentDB) : a))
      );
      toast({
        title: 'Succes',
        description: 'Programarea a fost anulată',
      });
      return data;
    } catch (error: any) {
      console.error('Error cancelling appointment:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut anula programarea',
        variant: 'destructive',
      });
      return null;
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
    completeAppointment,
    cancelAppointment,
    getAppointmentsForDate,
    isSlotOccupied,
    saveAppointmentTreatments,
    fetchAppointmentTreatments,
  };
}
