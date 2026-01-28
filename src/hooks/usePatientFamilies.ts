import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface PatientFamily {
  id: string;
  family_name: string;
  primary_contact_id: string | null;
  primary_phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PatientFamilyMember {
  id: string;
  family_id: string;
  patient_id: string;
  relationship: string | null;
  is_primary_contact: boolean;
  created_at: string;
}

export interface FamilyWithMembers extends PatientFamily {
  members: (PatientFamilyMember & {
    patient: {
      id: string;
      first_name: string;
      last_name: string;
      phone: string;
      date_of_birth: string | null;
    };
  })[];
}

export function usePatientFamilies() {
  const [families, setFamilies] = useState<FamilyWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFamilies = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch families
      const { data: familiesData, error: familiesError } = await supabase
        .from('patient_families')
        .select('*')
        .order('family_name', { ascending: true });

      if (familiesError) throw familiesError;

      // Fetch members with patient data for each family
      const familiesWithMembers: FamilyWithMembers[] = [];
      
      for (const family of familiesData || []) {
        const { data: membersData, error: membersError } = await supabase
          .from('patient_family_members')
          .select(`
            *,
            patient:patients(id, first_name, last_name, phone, date_of_birth)
          `)
          .eq('family_id', family.id);

        if (membersError) throw membersError;

        familiesWithMembers.push({
          ...family,
          members: (membersData || []).map((m: any) => ({
            ...m,
            patient: m.patient
          }))
        });
      }

      setFamilies(familiesWithMembers);
    } catch (error: any) {
      console.error('Error fetching families:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca familiile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFamilies();
  }, [fetchFamilies]);

  const createFamily = async (familyData: {
    family_name: string;
    primary_phone?: string;
    address?: string;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('patient_families')
        .insert(familyData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Familia a fost creată',
      });
      
      await fetchFamilies();
      return data;
    } catch (error: any) {
      console.error('Error creating family:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut crea familia',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateFamily = async (id: string, updates: Partial<PatientFamily>) => {
    try {
      const { error } = await supabase
        .from('patient_families')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Familia a fost actualizată',
      });
      
      await fetchFamilies();
      return true;
    } catch (error: any) {
      console.error('Error updating family:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza familia',
        variant: 'destructive',
      });
      return false;
    }
  };

  const deleteFamily = async (id: string) => {
    try {
      const { error } = await supabase
        .from('patient_families')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Familia a fost ștearsă',
      });
      
      await fetchFamilies();
      return true;
    } catch (error: any) {
      console.error('Error deleting family:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge familia',
        variant: 'destructive',
      });
      return false;
    }
  };

  const addMember = async (familyId: string, patientId: string, relationship?: string, isPrimary?: boolean) => {
    try {
      const { error } = await supabase
        .from('patient_family_members')
        .insert({
          family_id: familyId,
          patient_id: patientId,
          relationship: relationship || null,
          is_primary_contact: isPrimary || false
        });

      if (error) throw error;

      // If this is primary contact, update family's primary_contact_id
      if (isPrimary) {
        await supabase
          .from('patient_families')
          .update({ primary_contact_id: patientId })
          .eq('id', familyId);
      }

      toast({
        title: 'Succes',
        description: 'Membrul a fost adăugat în familie',
      });
      
      await fetchFamilies();
      return true;
    } catch (error: any) {
      console.error('Error adding member:', error);
      if (error.code === '23505') {
        toast({
          title: 'Eroare',
          description: 'Pacientul este deja membru în această familie',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Eroare',
          description: 'Nu s-a putut adăuga membrul',
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const updateMember = async (memberId: string, updates: { relationship?: string; is_primary_contact?: boolean }) => {
    try {
      const { error } = await supabase
        .from('patient_family_members')
        .update(updates)
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Membrul a fost actualizat',
      });
      
      await fetchFamilies();
      return true;
    } catch (error: any) {
      console.error('Error updating member:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza membrul',
        variant: 'destructive',
      });
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('patient_family_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      toast({
        title: 'Succes',
        description: 'Membrul a fost eliminat din familie',
      });
      
      await fetchFamilies();
      return true;
    } catch (error: any) {
      console.error('Error removing member:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut elimina membrul',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getPatientFamily = (patientId: string) => {
    return families.find(f => f.members.some(m => m.patient_id === patientId));
  };

  return {
    families,
    loading,
    createFamily,
    updateFamily,
    deleteFamily,
    addMember,
    updateMember,
    removeMember,
    getPatientFamily,
    refetch: fetchFamilies,
  };
}
