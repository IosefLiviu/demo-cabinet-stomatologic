import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  status: 'sent' | 'returned';
  notes: string | null;
  vita_color: string | null;
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
  status?: 'sent' | 'returned';
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
      const { data, error } = await supabase
        .from('lab_samples')
        .insert(sample)
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

      toast({
        title: 'Succes',
        description: updates.status === 'returned' 
          ? 'Proba a fost marcată ca primită' 
          : 'Proba a fost actualizată',
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
    return updateSample(id, {
      status: 'returned',
      actual_return_date: returnDate || new Date().toISOString().split('T')[0],
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
  };
}
