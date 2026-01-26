import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  date_of_birth?: string;
  gender?: 'M' | 'F' | 'other';
  address?: string;
  city?: string;
  cnp?: string;
  registration_number?: string;
  allergies?: string[];
  medical_conditions?: string[];
  medications?: string[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type PatientInsert = Omit<Patient, 'id' | 'created_at' | 'updated_at'>;
export type PatientUpdate = Partial<PatientInsert>;

export function usePatients() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchPatients = async () => {
    try {
      setLoading(true);
      // Fetch all patients - override default 1000 limit
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('last_name', { ascending: true })
        .limit(10000);

      if (error) throw error;
      setPatients((data as Patient[]) || []);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca pacienții',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const addPatient = async (patient: PatientInsert) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert(patient)
        .select()
        .single();

      if (error) throw error;

      setPatients((prev) => [...prev, data as Patient]);
      toast({
        title: 'Succes',
        description: 'Pacientul a fost adăugat',
      });
      return data;
    } catch (error: any) {
      console.error('Error adding patient:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga pacientul',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updatePatient = async (id: string, updates: PatientUpdate) => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setPatients((prev) =>
        prev.map((p) => (p.id === id ? (data as Patient) : p))
      );
      toast({
        title: 'Succes',
        description: 'Pacientul a fost actualizat',
      });
      return data;
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza pacientul',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deletePatient = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPatients((prev) => prev.filter((p) => p.id !== id));
      toast({
        title: 'Succes',
        description: 'Pacientul a fost șters',
      });
      return true;
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge pacientul',
        variant: 'destructive',
      });
      return false;
    }
  };

  const searchPatients = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return patients.filter(
      (p) =>
        p.first_name.toLowerCase().includes(lowerQuery) ||
        p.last_name.toLowerCase().includes(lowerQuery) ||
        p.phone.includes(query) ||
        (p.email && p.email.toLowerCase().includes(lowerQuery))
    );
  };

  return {
    patients,
    loading,
    addPatient,
    updatePatient,
    deletePatient,
    searchPatients,
    refetch: fetchPatients,
  };
}
