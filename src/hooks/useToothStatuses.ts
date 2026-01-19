import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ToothStatusCustom {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useToothStatuses() {
  const [statuses, setStatuses] = useState<ToothStatusCustom[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tooth_statuses')
        .select('*')
        .order('sort_order');

      if (error) throw error;
      setStatuses(data || []);
    } catch (error: any) {
      console.error('Error fetching tooth statuses:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca statusurile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const addStatus = async (name: string, color: string) => {
    try {
      const maxOrder = statuses.reduce((max, s) => Math.max(max, s.sort_order), 0);
      
      const { error } = await supabase
        .from('tooth_statuses')
        .insert({
          name,
          color,
          sort_order: maxOrder + 1,
        });

      if (error) throw error;
      
      toast({ title: 'Succes', description: 'Statusul a fost adăugat' });
      await fetchStatuses();
    } catch (error: any) {
      console.error('Error adding status:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga statusul',
        variant: 'destructive',
      });
    }
  };

  const updateStatus = async (id: string, name: string, color: string) => {
    try {
      const { error } = await supabase
        .from('tooth_statuses')
        .update({ name, color })
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Succes', description: 'Statusul a fost actualizat' });
      await fetchStatuses();
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza statusul',
        variant: 'destructive',
      });
    }
  };

  const deleteStatus = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tooth_statuses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({ title: 'Succes', description: 'Statusul a fost șters' });
      await fetchStatuses();
    } catch (error: any) {
      console.error('Error deleting status:', error);
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge statusul',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('tooth_statuses')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      await fetchStatuses();
    } catch (error: any) {
      console.error('Error toggling status:', error);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  return {
    statuses,
    activeStatuses: statuses.filter(s => s.is_active),
    loading,
    fetchStatuses,
    addStatus,
    updateStatus,
    deleteStatus,
    toggleActive,
  };
}
