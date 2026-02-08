import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const sendLabReturnedNotification = async (sample: { doctor_id: string | null; patient_name: string; work_type: string }) => {
  if (!sample.doctor_id) return;
  try {
    const { error } = await supabase.functions.invoke('send-lab-notification', {
      body: {
        doctorId: sample.doctor_id,
        patientName: sample.patient_name,
        workType: sample.work_type,
      },
    });
    if (error) {
      console.error('Error sending lab notification:', error);
    }
  } catch (err) {
    console.error('Failed to send lab notification:', err);
  }
};

export type LabSampleStatus = 'sent' | 'returned' | 'trial' | 'finalized' | 'resent';

export interface LabSample {
  id: string;
  patient_id: string | null;
  patient_name: string;
  work_type: string;
  zone_quadrant: string | null;
  sample_date: string;
  expected_return_date: string | null;
  actual_return_date: string | null;
  laboratory_name: string | null;
  doctor_id: string | null;
  status: LabSampleStatus;
  notes: string | null;
  vita_color: string | null;
  resend_reason: string | null;
  resend_date: string | null;
  trial_date: string | null;
  finalized_date: string | null;
  cabinet_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface LabSampleInsert {
  patient_id?: string | null;
  patient_name: string;
  work_type: string;
  zone_quadrant?: string | null;
  sample_date?: string;
  expected_return_date?: string | null;
  laboratory_name?: string | null;
  doctor_id?: string | null;
  notes?: string | null;
  vita_color?: string | null;
}

export interface LabSampleUpdate {
  actual_return_date?: string | null;
  laboratory_name?: string | null;
  doctor_id?: string | null;
  notes?: string | null;
  status?: LabSampleStatus;
  resend_reason?: string | null;
  cabinet_id?: number | null;
  resend_date?: string | null;
  trial_date?: string | null;
  finalized_date?: string | null;
}

export function useLabSamples() {
  const [samples, setSamples] = useState<LabSample[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSamples = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lab_samples')
        .select('*')
        .order('sample_date', { ascending: false });

      if (error) throw error;
      setSamples((data as LabSample[]) || []);
    } catch (error: any) {
      console.error('Error fetching lab samples:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca probele de laborator',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, []);

  const addSample = async (sample: LabSampleInsert): Promise<LabSample | null> => {
    try {
      // Clean empty strings to null for date fields
      const cleanedSample = {
        ...sample,
        expected_return_date: sample.expected_return_date || null,
        sample_date: sample.sample_date || undefined, // Let DB use default
      };

      const { data, error } = await supabase
        .from('lab_samples')
        .insert(cleanedSample)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Proba a fost trimisă la laborator',
      });

      await fetchSamples();
      return data as LabSample;
    } catch (error: any) {
      console.error('Error adding lab sample:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga proba',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateSample = async (id: string, updates: LabSampleUpdate): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lab_samples')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      const statusMessages: Record<LabSampleStatus, string> = {
        sent: 'Proba a fost trimisă la laborator',
        returned: 'Proba a fost marcată ca primită',
        trial: 'Proba a fost trimisă la cabinet pentru probă',
        finalized: 'Lucrarea a fost finalizată',
        resent: 'Proba a fost retrimisă la laborator',
      };

      toast({
        title: 'Succes',
        description: updates.status ? statusMessages[updates.status] : 'Proba a fost actualizată',
      });

      await fetchSamples();
      return true;
    } catch (error: any) {
      console.error('Error updating lab sample:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza proba',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteSample = async (id: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lab_samples')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Proba a fost ștearsă',
      });

      await fetchSamples();
      return true;
    } catch (error: any) {
      console.error('Error deleting lab sample:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge proba',
        variant: 'destructive',
      });
      return false;
    }
  };

  const markAsReturned = async (id: string, returnDate?: string): Promise<boolean> => {
    const sample = samples.find(s => s.id === id);
    const result = await updateSample(id, {
      status: 'returned',
      actual_return_date: returnDate || new Date().toISOString().split('T')[0],
    });
    // Send WhatsApp notification to doctor (fire-and-forget)
    if (result && sample) {
      sendLabReturnedNotification(sample);
    }
    return result;
  };

  const markAsTrial = async (id: string, cabinetId: number): Promise<boolean> => {
    return updateSample(id, {
      status: 'trial',
      trial_date: new Date().toISOString().split('T')[0],
      cabinet_id: cabinetId,
    });
  };

  const markAsFinalized = async (id: string): Promise<boolean> => {
    return updateSample(id, {
      status: 'finalized',
      finalized_date: new Date().toISOString().split('T')[0],
    });
  };

  const resendToLab = async (id: string, reason: string): Promise<boolean> => {
    return updateSample(id, {
      status: 'resent',
      resend_reason: reason,
      resend_date: new Date().toISOString().split('T')[0],
    });
  };

  return {
    samples,
    loading,
    fetchSamples,
    addSample,
    updateSample,
    deleteSample,
    markAsReturned,
    markAsTrial,
    markAsFinalized,
    resendToLab,
  };
}
