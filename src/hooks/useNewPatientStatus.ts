import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Fetches the set of patient IDs that have at least one completed appointment.
 * Patients NOT in this set are considered "new".
 */
export function useNewPatientStatus() {
  const [patientsWithCompleted, setPatientsWithCompleted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        // Get distinct patient_ids that have completed appointments
        const { data, error } = await supabase
          .from('appointments')
          .select('patient_id')
          .eq('status', 'completed');

        if (error) throw error;

        const ids = new Set<string>((data || []).map(d => d.patient_id));
        setPatientsWithCompleted(ids);
      } catch (err) {
        console.error('Error fetching new patient status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const isNewPatient = (patientId: string) => !patientsWithCompleted.has(patientId);

  return { isNewPatient, loading };
}
