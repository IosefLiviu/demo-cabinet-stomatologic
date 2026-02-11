import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface DentalCondition {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
  sort_order: number;
}

export interface ToothCondition {
  id: string;
  patient_id: string;
  tooth_number: number;
  condition_id: string;
  condition?: DentalCondition;
  notes: string | null;
  created_at: string;
}

export interface ToothIntervention {
  id: string;
  patient_id: string;
  tooth_number: number;
  treatment_id: string | null;
  treatment_name: string;
  doctor_id: string | null;
  doctor?: { name: string } | null;
  notes: string | null;
  performed_at: string;
}

export function useDentalConditionsCatalog() {
  const [conditions, setConditions] = useState<DentalCondition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from('dental_conditions')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) console.error(error);
      setConditions((data as DentalCondition[]) || []);
      setLoading(false);
    })();
  }, []);

  return { conditions, loading };
}

export function useToothConditions(patientId: string) {
  const [conditions, setConditions] = useState<ToothCondition[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tooth_conditions')
      .select('*, condition:dental_conditions(*)')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    setConditions((data as any[]) || []);
    setLoading(false);
  }, [patientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addCondition = async (toothNumber: number, conditionId: string, notes?: string) => {
    const { error } = await supabase.from('tooth_conditions').insert({
      patient_id: patientId,
      tooth_number: toothNumber,
      condition_id: conditionId,
      notes: notes || null,
    });
    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Afecțiunea există deja pe acest dinte', variant: 'destructive' });
      } else {
        toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
      }
      return false;
    }
    await fetch();
    return true;
  };

  const removeCondition = async (id: string) => {
    const { error } = await supabase.from('tooth_conditions').delete().eq('id', id);
    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetch();
    return true;
  };

  return { conditions, loading, addCondition, removeCondition, refetch: fetch };
}

export function useToothInterventions(patientId: string) {
  const [interventions, setInterventions] = useState<ToothIntervention[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tooth_interventions')
      .select('*, doctor:doctors(name)')
      .eq('patient_id', patientId)
      .order('performed_at', { ascending: false });
    if (error) console.error(error);
    setInterventions((data as any[]) || []);
    setLoading(false);
  }, [patientId]);

  useEffect(() => { fetch(); }, [fetch]);

  const addIntervention = async (toothNumber: number, treatmentName: string, treatmentId?: string, doctorId?: string, notes?: string) => {
    const { error } = await supabase.from('tooth_interventions').insert({
      patient_id: patientId,
      tooth_number: toothNumber,
      treatment_name: treatmentName,
      treatment_id: treatmentId || null,
      doctor_id: doctorId || null,
      notes: notes || null,
    });
    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetch();
    return true;
  };

  const removeIntervention = async (id: string) => {
    const { error } = await supabase.from('tooth_interventions').delete().eq('id', id);
    if (error) {
      toast({ title: 'Eroare', description: error.message, variant: 'destructive' });
      return false;
    }
    await fetch();
    return true;
  };

  return { interventions, loading, addIntervention, removeIntervention, refetch: fetch };
}
