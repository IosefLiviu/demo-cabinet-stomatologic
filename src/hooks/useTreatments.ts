import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Treatment {
  id: string;
  name: string;
  description?: string;
  default_duration: number;
  default_price?: number;
  category?: string;
  is_active: boolean;
  created_at: string;
}

export function useTreatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('treatments')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setTreatments(data || []);
    } catch (error) {
      console.error('Error fetching treatments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTreatments();
  }, []);

  return {
    treatments,
    loading,
    refetch: fetchTreatments,
  };
}
