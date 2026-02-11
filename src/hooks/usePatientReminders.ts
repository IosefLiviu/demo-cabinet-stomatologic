import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface PatientReminder {
  id: string;
  patient_id: string;
  reminder_date: string;
  note: string | null;
  is_completed: boolean;
  completed_at: string | null;
  completed_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined data
  patient?: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string;
  };
}

export function usePatientReminders(patientId?: string) {
  const queryClient = useQueryClient();

  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['patient-reminders', patientId],
    queryFn: async () => {
      let query = supabase
        .from('patient_reminders')
        .select(`
          *,
          patient:patients(id, first_name, last_name, phone)
        `)
        .order('reminder_date', { ascending: true });

      if (patientId) {
        query = query.eq('patient_id', patientId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as PatientReminder[];
    },
  });

  const createReminder = useMutation({
    mutationFn: async (data: { patient_id: string; reminder_date: string; note?: string }) => {
      const { error } = await supabase
        .from('patient_reminders')
        .insert({
          patient_id: data.patient_id,
          reminder_date: data.reminder_date,
          note: data.note || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-reminders'] });
      toast.success('Reminder creat cu succes');
    },
    onError: (error) => {
      console.error('Error creating reminder:', error);
      toast.error('Eroare la crearea reminder-ului');
    },
  });

  const updateReminder = useMutation({
    mutationFn: async (data: { id: string; reminder_date?: string; note?: string; is_completed?: boolean }) => {
      const updateData: Record<string, unknown> = {};
      
      if (data.reminder_date !== undefined) updateData.reminder_date = data.reminder_date;
      if (data.note !== undefined) updateData.note = data.note;
      if (data.is_completed !== undefined) {
        updateData.is_completed = data.is_completed;
        if (data.is_completed) {
          updateData.completed_at = new Date().toISOString();
        } else {
          updateData.completed_at = null;
          updateData.completed_by = null;
        }
      }

      const { error } = await supabase
        .from('patient_reminders')
        .update(updateData)
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-reminders'] });
      toast.success('Reminder actualizat');
    },
    onError: (error) => {
      console.error('Error updating reminder:', error);
      toast.error('Eroare la actualizarea reminder-ului');
    },
  });

  const deleteReminder = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('patient_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-reminders'] });
      toast.success('Reminder șters');
    },
    onError: (error) => {
      console.error('Error deleting reminder:', error);
      toast.error('Eroare la ștergerea reminder-ului');
    },
  });

  return {
    reminders,
    isLoading,
    createReminder,
    updateReminder,
    deleteReminder,
  };
}

export function usePendingReminders() {
  const { data: reminders = [], isLoading } = useQuery({
    queryKey: ['patient-reminders', 'pending'],
    queryFn: async () => {
      // Show reminders whose date is within the next 7 days or already overdue
      const inOneWeek = new Date();
      inOneWeek.setDate(inOneWeek.getDate() + 7);
      const maxDate = inOneWeek.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('patient_reminders')
        .select(`
          *,
          patient:patients(id, first_name, last_name, phone)
        `)
        .eq('is_completed', false)
        .lte('reminder_date', maxDate)
        .order('reminder_date', { ascending: true });

      if (error) throw error;
      return data as PatientReminder[];
    },
  });

  return { reminders, isLoading };
}
