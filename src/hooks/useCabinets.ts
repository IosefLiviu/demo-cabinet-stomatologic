import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Cabinet {
  id: number;
  name: string;
  doctor: string;
  is_active: boolean;
}

export function useCabinets() {
  const [cabinets, setCabinets] = useState<Cabinet[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCabinets = async () => {
    try {
      const { data, error } = await supabase
        .from('cabinets')
        .select('*')
        .eq('is_active', true)
        .order('id');

      if (error) throw error;
      setCabinets(data || []);
    } catch (error) {
      console.error('Error fetching cabinets:', error);
      toast.error('Eroare la încărcarea cabinetelor');
    } finally {
      setLoading(false);
    }
  };

  const updateCabinetDoctor = async (cabinetId: number, doctor: string) => {
    try {
      const { error } = await supabase
        .from('cabinets')
        .update({ doctor })
        .eq('id', cabinetId);

      if (error) throw error;
      
      setCabinets(prev => 
        prev.map(c => c.id === cabinetId ? { ...c, doctor } : c)
      );
      toast.success('Doctor actualizat cu succes');
    } catch (error) {
      console.error('Error updating cabinet:', error);
      toast.error('Eroare la actualizarea doctorului');
    }
  };

  useEffect(() => {
    fetchCabinets();
  }, []);

  return {
    cabinets,
    loading,
    updateCabinetDoctor,
    refetch: fetchCabinets
  };
}
