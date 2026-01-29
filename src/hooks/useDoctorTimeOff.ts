import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DoctorTimeOff {
  id: string;
  doctor_id: string;
  start_date: string;
  end_date: string;
  reason?: string | null;
  time_off_type: 'vacation' | 'sick_leave' | 'personal' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string | null;
  approved_at?: string | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateTimeOffData {
  doctor_id: string;
  start_date: string;
  end_date: string;
  reason?: string | null;
  time_off_type?: 'vacation' | 'sick_leave' | 'personal' | 'other';
}

export function useDoctorTimeOff(doctorId?: string, status?: string) {
  const [timeOffRequests, setTimeOffRequests] = useState<DoctorTimeOff[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTimeOffRequests = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('doctor_time_off')
        .select('*')
        .order('start_date', { ascending: false });

      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTimeOffRequests((data || []) as DoctorTimeOff[]);
    } catch (error: any) {
      console.error('Error fetching time off requests:', error);
      toast.error('Eroare la încărcarea cererilor de concediu');
    } finally {
      setLoading(false);
    }
  }, [doctorId, status]);

  const createTimeOffRequest = async (data: CreateTimeOffData) => {
    try {
      const { data: newRequest, error } = await supabase
        .from('doctor_time_off')
        .insert({
          ...data,
          time_off_type: data.time_off_type || 'vacation',
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      
      setTimeOffRequests(prev => [newRequest as DoctorTimeOff, ...prev]);
      toast.success('Cerere de concediu trimisă');
      return newRequest;
    } catch (error: any) {
      console.error('Error creating time off request:', error);
      toast.error('Eroare la crearea cererii de concediu');
      return null;
    }
  };

  const approveTimeOffRequest = async (id: string, userId: string) => {
    try {
      const { data: updated, error } = await supabase
        .from('doctor_time_off')
        .update({
          status: 'approved',
          approved_by: userId,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTimeOffRequests(prev => 
        prev.map(r => r.id === id ? updated as DoctorTimeOff : r)
      );
      toast.success('Cerere aprobată');
      return updated;
    } catch (error: any) {
      console.error('Error approving time off request:', error);
      toast.error('Eroare la aprobarea cererii');
      return null;
    }
  };

  const rejectTimeOffRequest = async (id: string, rejectionReason: string) => {
    try {
      const { data: updated, error } = await supabase
        .from('doctor_time_off')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTimeOffRequests(prev => 
        prev.map(r => r.id === id ? updated as DoctorTimeOff : r)
      );
      toast.success('Cerere respinsă');
      return updated;
    } catch (error: any) {
      console.error('Error rejecting time off request:', error);
      toast.error('Eroare la respingerea cererii');
      return null;
    }
  };

  const deleteTimeOffRequest = async (id: string) => {
    try {
      const { error } = await supabase
        .from('doctor_time_off')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTimeOffRequests(prev => prev.filter(r => r.id !== id));
      toast.success('Cerere ștearsă');
      return true;
    } catch (error: any) {
      console.error('Error deleting time off request:', error);
      toast.error('Eroare la ștergerea cererii');
      return false;
    }
  };

  // Check if a doctor is on time off for a specific date
  const isDoctorOnTimeOff = useCallback((doctorId: string, date: string): DoctorTimeOff | null => {
    return timeOffRequests.find(request => 
      request.doctor_id === doctorId &&
      request.status === 'approved' &&
      date >= request.start_date &&
      date <= request.end_date
    ) || null;
  }, [timeOffRequests]);

  useEffect(() => {
    fetchTimeOffRequests();
  }, [fetchTimeOffRequests]);

  return {
    timeOffRequests,
    loading,
    fetchTimeOffRequests,
    createTimeOffRequest,
    approveTimeOffRequest,
    rejectTimeOffRequest,
    deleteTimeOffRequest,
    isDoctorOnTimeOff,
  };
}
