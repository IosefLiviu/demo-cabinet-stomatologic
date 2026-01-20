import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface TreatmentPlanItem {
  id?: string;
  treatmentId?: string;
  treatmentName: string;
  toothNumber: number | null;
  toothNumbers?: number[];
  doctorId: string;
  quantity: number;
  price: number;
  duration?: number;
  laborator?: number;
  cas?: number;
  discountPercent?: number;
  sortOrder?: number;
  // Completion tracking
  completedAt?: string;
  paymentStatus?: string;
  paidAmount?: number;
  completedAppointmentId?: string;
}

export interface TreatmentPlan {
  id: string;
  patientId: string;
  doctorId?: string;
  nextAppointmentDate?: string;
  nextAppointmentTime?: string;
  notes?: string;
  discountPercent?: number;
  createdAt: string;
  updatedAt: string;
  items: TreatmentPlanItem[];
}

export function useTreatmentPlans() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPatientTreatmentPlans = async (patientId: string): Promise<TreatmentPlan[]> => {
    setLoading(true);
    try {
      const { data: plans, error } = await supabase
        .from('treatment_plans')
        .select(`
          *,
          treatment_plan_items (*)
        `)
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (plans || []).map(plan => ({
        id: plan.id,
        patientId: plan.patient_id,
        doctorId: plan.doctor_id || undefined,
        nextAppointmentDate: plan.next_appointment_date || undefined,
        nextAppointmentTime: plan.next_appointment_time || undefined,
        notes: plan.notes || undefined,
        discountPercent: plan.discount_percent || 0,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
        items: (plan.treatment_plan_items || []).map((item: any) => ({
          id: item.id,
          treatmentId: item.treatment_id || undefined,
          treatmentName: item.treatment_name,
          toothNumber: item.tooth_number,
          toothNumbers: item.tooth_numbers || (item.tooth_number ? [item.tooth_number] : []),
          doctorId: item.doctor_id || '',
          quantity: item.quantity || 1,
          price: item.price || 0,
          duration: item.duration || 30,
          laborator: item.laborator || 0,
          cas: item.cas || 0,
          discountPercent: item.discount_percent || 0,
          sortOrder: item.sort_order || 0,
          // Completion tracking
          completedAt: item.completed_at || undefined,
          paymentStatus: item.payment_status || undefined,
          paidAmount: item.paid_amount || 0,
          completedAppointmentId: item.completed_appointment_id || undefined,
        })),
      }));
    } catch (error: any) {
      console.error('Error fetching treatment plans:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca planurile de tratament',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const saveTreatmentPlan = async (
    patientId: string,
    doctorId: string | undefined,
    nextAppointmentDate: string | undefined,
    nextAppointmentTime: string | undefined,
    items: TreatmentPlanItem[],
    existingPlanId?: string,
    discountPercent?: number
  ): Promise<string | null> => {
    setLoading(true);
    try {
      let planId = existingPlanId;

      if (existingPlanId) {
        // Update existing plan
        const { error: updateError } = await supabase
          .from('treatment_plans')
          .update({
            doctor_id: doctorId || null,
            next_appointment_date: nextAppointmentDate || null,
            next_appointment_time: nextAppointmentTime || null,
            discount_percent: discountPercent || 0,
          })
          .eq('id', existingPlanId);

        if (updateError) throw updateError;

        // Delete existing items
        const { error: deleteError } = await supabase
          .from('treatment_plan_items')
          .delete()
          .eq('treatment_plan_id', existingPlanId);

        if (deleteError) throw deleteError;
      } else {
        // Create new plan
        const { data: newPlan, error: insertError } = await supabase
          .from('treatment_plans')
          .insert({
            patient_id: patientId,
            doctor_id: doctorId || null,
            next_appointment_date: nextAppointmentDate || null,
            next_appointment_time: nextAppointmentTime || null,
            discount_percent: discountPercent || 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        planId = newPlan.id;
      }

      // Insert items
      if (items.length > 0 && planId) {
        const itemsToInsert = items.map((item, index) => ({
          treatment_plan_id: planId,
          treatment_id: item.treatmentId || null,
          treatment_name: item.treatmentName,
          tooth_number: item.toothNumbers && item.toothNumbers.length > 0 ? item.toothNumbers[0] : item.toothNumber,
          tooth_numbers: item.toothNumbers || (item.toothNumber ? [item.toothNumber] : []),
          doctor_id: item.doctorId || null,
          quantity: item.quantity,
          price: item.price,
          duration: item.duration || 30,
          laborator: item.laborator || 0,
          cas: item.cas || 0,
          discount_percent: item.discountPercent || 0,
          sort_order: index,
        }));

        const { error: itemsError } = await supabase
          .from('treatment_plan_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast({
        title: 'Succes',
        description: existingPlanId ? 'Planul de tratament a fost actualizat' : 'Planul de tratament a fost salvat',
      });

      return planId || null;
    } catch (error: any) {
      console.error('Error saving treatment plan:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut salva planul de tratament',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteTreatmentPlan = async (planId: string): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('treatment_plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Planul de tratament a fost șters',
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting treatment plan:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge planul de tratament',
        variant: 'destructive',
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const markItemsAsCompleted = async (
    itemIds: string[],
    appointmentId: string,
    paymentStatus: string,
    paidAmount: number
  ): Promise<boolean> => {
    if (itemIds.length === 0) return true;
    
    try {
      const { error } = await supabase
        .from('treatment_plan_items')
        .update({
          completed_at: new Date().toISOString(),
          payment_status: paymentStatus,
          paid_amount: paidAmount,
          completed_appointment_id: appointmentId,
        })
        .in('id', itemIds);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Error marking plan items as completed:', error);
      return false;
    }
  };

  return {
    loading,
    fetchPatientTreatmentPlans,
    saveTreatmentPlan,
    deleteTreatmentPlan,
    markItemsAsCompleted,
  };
}
