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
  plan_item_id?: string; // Link to treatment plan item
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
  plan_item_id?: string; // Link to treatment plan item
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
          appointment_treatments (id, appointment_id, treatment_id, treatment_name, price, decont, co_plata, laborator, duration, discount_percent, tooth_numbers, tooth_data)
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
          appointment_treatments (id, appointment_id, treatment_id, treatment_name, price, decont, co_plata, laborator, duration, discount_percent, tooth_numbers, tooth_data)
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

  const sendDoctorNotification = async (
    doctorId: string,
    patientName: string,
    appointmentDate: string,
    appointmentTime: string,
    cabinetName: string,
    notes?: string
  ) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-doctor-notification', {
        body: {
          doctorId,
          patientName,
          appointmentDate,
          appointmentTime,
          cabinetName,
          notes,
        },
      });

      if (error) {
        console.error('Error sending doctor notification:', error);
      } else {
        console.log('Doctor notification result:', data);
      }
    } catch (error) {
      console.error('Failed to send doctor notification:', error);
    }
  };

  const addAppointment = async (appointment: AppointmentInsert, patientName?: string, cabinetName?: string, retryCount = 0): Promise<AppointmentDB | null> => {
    const maxRetries = 2;
    
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
      
      if (!data) {
        throw new Error('No data returned from insert');
      }

      setAppointments((prev) => [...prev, data as unknown as AppointmentDB]);
      toast({
        title: 'Succes',
        description: 'Programarea a fost adăugată',
      });

      // Send email notification to doctor (async, don't block)
      if (appointment.doctor_id && patientName && cabinetName) {
        sendDoctorNotification(
          appointment.doctor_id,
          patientName,
          appointment.appointment_date,
          appointment.start_time,
          cabinetName,
          appointment.notes || undefined
        );
      }

      return data as unknown as AppointmentDB;
    } catch (error: any) {
      console.error('Error adding appointment:', error);
      
      // Retry on transient failures
      if (retryCount < maxRetries) {
        console.log(`Retrying addAppointment (attempt ${retryCount + 2}/${maxRetries + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
        return addAppointment(appointment, patientName, cabinetName, retryCount + 1);
      }
      
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga programarea. Vă rugăm reîncercați.',
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

  // Check if a new appointment would overlap with existing appointments
  const checkOverlap = (
    date: string, 
    startTime: string, 
    endTime: string, 
    cabinetId: number, 
    excludeId?: string
  ): { hasOverlap: boolean; conflictingAppointment?: AppointmentDB } => {
    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const newStart = timeToMinutes(startTime);
    const newEnd = timeToMinutes(endTime);

    for (const apt of appointments) {
      // Skip cancelled appointments and the one being edited
      if (apt.appointment_date !== date || apt.cabinet_id !== cabinetId || apt.status === 'cancelled') continue;
      if (excludeId && apt.id === excludeId) continue;

      const aptStart = timeToMinutes(apt.start_time);
      const aptEnd = aptStart + (apt.duration || 30);

      // Check for overlap: new appointment starts before existing ends AND new appointment ends after existing starts
      if (newStart < aptEnd && newEnd > aptStart) {
        return { hasOverlap: true, conflictingAppointment: apt };
      }
    }

    return { hasOverlap: false };
  };

  const saveAppointmentTreatments = async (appointmentId: string, treatments: AppointmentTreatmentInsert[], retryCount = 0): Promise<boolean> => {
    const maxRetries = 2;
    
    try {
      // First delete existing treatments for this appointment
      const { error: deleteError } = await supabase
        .from('appointment_treatments')
        .delete()
        .eq('appointment_id', appointmentId);

      if (deleteError) {
        console.error('Error deleting existing treatments:', deleteError);
        throw deleteError;
      }

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
          plan_item_id: t.plan_item_id || null,
        }));

        const { error } = await supabase
          .from('appointment_treatments')
          .insert(treatmentsWithAppointmentId);

        if (error) throw error;
      }
      return true;
    } catch (error: any) {
      console.error('Error saving appointment treatments:', error);
      
      // Retry on transient failures
      if (retryCount < maxRetries) {
        console.log(`Retrying saveAppointmentTreatments (attempt ${retryCount + 2}/${maxRetries + 1})...`);
        await new Promise(resolve => setTimeout(resolve, 500 * (retryCount + 1)));
        return saveAppointmentTreatments(appointmentId, treatments, retryCount + 1);
      }
      
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut salva intervențiile. Vă rugăm reîncercați.',
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
        plan_item_id: t.plan_item_id || undefined,
      }));
    } catch (error: any) {
      console.error('Error fetching appointment treatments:', error);
      return [];
    }
  };

  const updatePaymentAmount = async (id: string, paidAmount: number) => {
    try {
      const appointment = appointments.find(a => a.id === id);
      if (!appointment) throw new Error('Appointment not found');

      const treatments = appointment.appointment_treatments ?? [];
      const totalPrice = (appointment.price ?? 0) || 
        treatments.reduce((sum, t) => sum + (t.price || 0), 0);
      
      // Calculate payable amount (price - CAS - discounts)
      const payableAmount = treatments.length
        ? treatments.reduce((sum, t) => {
            const price = t.price || 0;
            const cas = t.decont || 0;
            const discountPercent = t.discount_percent || 0;
            const priceAfterCas = price - cas;
            const discountAmount = priceAfterCas * (discountPercent / 100);
            return sum + (priceAfterCas - discountAmount);
          }, 0)
        : totalPrice;

      const isPaid = paidAmount >= payableAmount;
      const isPartial = paidAmount > 0 && paidAmount < payableAmount;
      
      // Determine payment method based on new amount
      let paymentMethod = appointment.payment_method || 'cash';
      if (paidAmount === 0) {
        paymentMethod = 'unpaid';
      } else if (isPartial && !paymentMethod.startsWith('partial_')) {
        // Convert to partial if it wasn't already
        paymentMethod = paymentMethod.includes('card') ? 'partial_card' : 'partial_cash';
      } else if (isPaid && paymentMethod.startsWith('partial_')) {
        // Convert from partial to full
        paymentMethod = paymentMethod.replace('partial_', '');
      }

      const { data, error } = await supabase
        .from('appointments')
        .update({
          paid_amount: paidAmount,
          is_paid: isPaid,
          payment_method: paymentMethod,
        })
        .eq('id', id)
        .select(`
          *,
          patients (id, first_name, last_name, phone, allergies),
          treatments (id, name, default_duration),
          doctors (id, name, color),
          appointment_treatments (id, appointment_id, treatment_id, treatment_name, price, decont, co_plata, laborator, duration, discount_percent, tooth_numbers, tooth_data, plan_item_id)
        `)
        .single();

      if (error) throw error;

      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? (data as unknown as AppointmentDB) : a))
      );

      toast({
        title: 'Succes',
        description: `Suma achitată a fost actualizată la ${paidAmount.toLocaleString()} RON`,
      });

      return data;
    } catch (error: any) {
      console.error('Error updating payment amount:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza suma achitată',
        variant: 'destructive',
      });
      return null;
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
          appointment_treatments (id, appointment_id, treatment_id, treatment_name, price, decont, co_plata, laborator, duration, discount_percent, tooth_numbers, tooth_data, plan_item_id)
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

        // Update dental_status and record history for each tooth with status data
        const toothUpdates: { toothNumber: number; status: string; notes?: string; treatmentName: string }[] = [];
        completedAppointment.appointment_treatments.forEach(t => {
          if (t.tooth_data && Array.isArray(t.tooth_data)) {
            t.tooth_data.forEach((td: ToothDataEntry) => {
              // Only record non-healthy statuses or those with notes
              if (td.status && td.status !== 'healthy' && td.status !== 'Sănătos') {
                toothUpdates.push({
                  toothNumber: td.toothNumber,
                  status: td.status,
                  notes: td.notes,
                  treatmentName: t.treatment_name,
                });
              }
            });
          }
        });

        // Process dental status updates
        if (toothUpdates.length > 0) {
          // Map status display names to database enum values
          const statusNameToEnum: Record<string, string> = {
            'Sănătos': 'healthy',
            'Carie': 'cavity',
            'Obt Foto': 'filled',
            'Coroană': 'crown',
            'Absent': 'missing',
            'Implant': 'implant',
            'OBT Canal': 'root_canal',
            'Rest Radicular': 'extraction_needed',
          };

          for (const update of toothUpdates) {
            // Get current status for this tooth
            const { data: currentStatus } = await supabase
              .from('dental_status')
              .select('status, notes')
              .eq('patient_id', completedAppointment.patient_id)
              .eq('tooth_number', update.toothNumber)
              .maybeSingle();

            const dbStatus = statusNameToEnum[update.status] || update.status;
            const oldDbStatus = currentStatus?.status || 'healthy';
            
            // Build history note
            const historyNote = `Programare finalizată: ${update.treatmentName}${update.notes ? ` - ${update.notes}` : ''}`;

            // Upsert dental_status
            const { error: statusError } = await supabase
              .from('dental_status')
              .upsert({
                patient_id: completedAppointment.patient_id,
                tooth_number: update.toothNumber,
                status: dbStatus as any,
                notes: update.notes || currentStatus?.notes || null,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'patient_id,tooth_number',
              });

            if (statusError) {
              console.error('Error updating dental status:', statusError);
            }

            // Insert history entry with the appointment date (not current date)
            const appointmentDateTime = new Date(`${completedAppointment.appointment_date}T${completedAppointment.start_time}`);
            const { error: historyError } = await supabase
              .from('dental_status_history')
              .insert({
                patient_id: completedAppointment.patient_id,
                tooth_number: update.toothNumber,
                old_status: oldDbStatus,
                new_status: dbStatus,
                notes: historyNote,
                changed_by: completedAppointment.doctor_id || null,
                changed_at: appointmentDateTime.toISOString(),
              });

            if (historyError) {
              console.error('Error recording dental status history:', historyError);
            }
          }
        }

        // Mark treatment plan items as completed (only if ALL teeth from that item are completed)
        const planItemIds = completedAppointment.appointment_treatments
          .filter(t => t.plan_item_id)
          .map(t => t.plan_item_id as string);
        
        if (planItemIds.length > 0) {
          // Collect unique plan item IDs
          const uniquePlanItemIds = [...new Set(planItemIds)];
          
          // For each unique plan item, check if all its teeth have been completed
          for (const planItemId of uniquePlanItemIds) {
            // Get the original plan item to see how many teeth it had
            const { data: planItem } = await supabase
              .from('treatment_plan_items')
              .select('tooth_numbers')
              .eq('id', planItemId)
              .maybeSingle();
            
            if (!planItem) continue;
            
            const originalTeeth = planItem.tooth_numbers || [];
            
            // If no teeth specified (like PRF), mark as completed immediately
            if (originalTeeth.length === 0) {
              const { error: planUpdateError } = await supabase
                .from('treatment_plan_items')
                .update({
                  completed_at: new Date().toISOString(),
                  payment_status: paymentMethod,
                  paid_amount: actualPaidAmount,
                  completed_appointment_id: id,
                })
                .eq('id', planItemId);
              
              if (planUpdateError) {
                console.error('Error marking plan item as completed:', planUpdateError);
              }
              continue;
            }
            
            // Get all completed teeth for this plan item across all completed appointments
            const { data: completedTreatments } = await supabase
              .from('appointment_treatments')
              .select(`
                tooth_numbers,
                appointments!inner(status)
              `)
              .eq('plan_item_id', planItemId)
              .eq('appointments.status', 'completed');
            
            // Collect all completed teeth
            const completedTeeth = new Set<number>();
            if (completedTreatments) {
              completedTreatments.forEach(ct => {
                (ct.tooth_numbers || []).forEach((t: number) => completedTeeth.add(t));
              });
            }
            
            // Check if all original teeth are now completed
            const allTeethCompleted = originalTeeth.every((t: number) => completedTeeth.has(t));
            
            if (allTeethCompleted) {
              // Calculate total paid amount across all appointments for this plan item
              const { data: allPayments } = await supabase
                .from('appointment_treatments')
                .select(`
                  price,
                  appointments!inner(status, paid_amount, is_paid)
                `)
                .eq('plan_item_id', planItemId)
                .eq('appointments.status', 'completed');
              
              let totalPaidForItem = 0;
              if (allPayments) {
                allPayments.forEach(p => {
                  // Approximate the paid portion based on price ratio
                  totalPaidForItem += (p.price || 0);
                });
              }
              
              const { error: planUpdateError } = await supabase
                .from('treatment_plan_items')
                .update({
                  completed_at: new Date().toISOString(),
                  payment_status: paymentMethod,
                  paid_amount: totalPaidForItem,
                  completed_appointment_id: id,
                })
                .eq('id', planItemId);
              
              if (planUpdateError) {
                console.error('Error marking plan item as completed:', planUpdateError);
              }
            }
          }
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
          appointment_treatments (id, appointment_id, treatment_id, treatment_name, price, decont, co_plata, laborator, duration, discount_percent, tooth_numbers, tooth_data)
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
    updatePaymentAmount,
    getAppointmentsForDate,
    isSlotOccupied,
    checkOverlap,
    saveAppointmentTreatments,
    fetchAppointmentTreatments,
  };
}
