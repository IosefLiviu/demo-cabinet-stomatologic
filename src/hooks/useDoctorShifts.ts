import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DoctorShift {
  id: string;
  doctor_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  cabinet_id?: number | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateShiftData {
  doctor_id: string;
  shift_date: string;
  start_time: string;
  end_time: string;
  cabinet_id?: number | null;
  notes?: string | null;
}

export function useDoctorShifts(doctorId?: string, dateRange?: { start: string; end: string }) {
  const [shifts, setShifts] = useState<DoctorShift[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('doctor_shifts')
        .select('*')
        .order('shift_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      if (dateRange) {
        query = query.gte('shift_date', dateRange.start).lte('shift_date', dateRange.end);
      }

      const { data, error } = await query;

      if (error) throw error;
      setShifts(data || []);
    } catch (error: any) {
      console.error('Error fetching doctor shifts:', error);
      toast.error('Eroare la încărcarea schimburilor');
    } finally {
      setLoading(false);
    }
  }, [doctorId, dateRange?.start, dateRange?.end]);

  const createShift = async (data: CreateShiftData) => {
    try {
      const { data: newShift, error } = await supabase
        .from('doctor_shifts')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      
      setShifts(prev => [...prev, newShift]);
      toast.success('Schimb adăugat cu succes');
      return newShift;
    } catch (error: any) {
      console.error('Error creating shift:', error);
      if (error.code === '23505') {
        toast.error('Există deja un schimb pentru această oră');
      } else {
        toast.error('Eroare la adăugarea schimbului');
      }
      return null;
    }
  };

  const updateShift = async (id: string, data: Partial<CreateShiftData>) => {
    try {
      const { data: updated, error } = await supabase
        .from('doctor_shifts')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setShifts(prev => prev.map(s => s.id === id ? updated : s));
      toast.success('Schimb actualizat');
      return updated;
    } catch (error: any) {
      console.error('Error updating shift:', error);
      toast.error('Eroare la actualizarea schimbului');
      return null;
    }
  };

  const deleteShift = async (id: string) => {
    try {
      const { error } = await supabase
        .from('doctor_shifts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setShifts(prev => prev.filter(s => s.id !== id));
      toast.success('Schimb șters');
      return true;
    } catch (error: any) {
      console.error('Error deleting shift:', error);
      toast.error('Eroare la ștergerea schimbului');
      return false;
    }
  };

  useEffect(() => {
    fetchShifts();
  }, [fetchShifts]);

  return {
    shifts,
    loading,
    fetchShifts,
    createShift,
    updateShift,
    deleteShift,
  };
}
