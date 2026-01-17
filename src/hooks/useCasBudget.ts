import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface CasBudget {
  id: string;
  month_year: string;
  initial_budget: number;
  used_budget: number;
}

export function useCasBudget() {
  const [currentBudget, setCurrentBudget] = useState<CasBudget | null>(null);
  const [loading, setLoading] = useState(true);

  const currentMonthYear = format(new Date(), 'yyyy-MM');

  const fetchCurrentBudget = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cas_budget')
        .select('*')
        .eq('month_year', currentMonthYear)
        .maybeSingle();

      if (error) throw error;
      setCurrentBudget(data as CasBudget | null);
    } catch (error) {
      console.error('Error fetching CAS budget:', error);
    } finally {
      setLoading(false);
    }
  }, [currentMonthYear]);

  const setMonthlyBudget = async (amount: number) => {
    try {
      const { data: existing } = await supabase
        .from('cas_budget')
        .select('id')
        .eq('month_year', currentMonthYear)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('cas_budget')
          .update({ initial_budget: amount })
          .eq('month_year', currentMonthYear);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('cas_budget')
          .insert({ month_year: currentMonthYear, initial_budget: amount, used_budget: 0 });
        if (error) throw error;
      }
      await fetchCurrentBudget();
      return true;
    } catch (error) {
      console.error('Error setting CAS budget:', error);
      return false;
    }
  };

  const deductFromBudget = async (amount: number) => {
    if (amount <= 0) return true;
    
    try {
      const { data: existing } = await supabase
        .from('cas_budget')
        .select('*')
        .eq('month_year', currentMonthYear)
        .maybeSingle();

      if (existing) {
        const newUsed = (existing.used_budget || 0) + amount;
        const { error } = await supabase
          .from('cas_budget')
          .update({ used_budget: newUsed })
          .eq('month_year', currentMonthYear);
        if (error) throw error;
      } else {
        // Create budget entry with used amount
        const { error } = await supabase
          .from('cas_budget')
          .insert({ month_year: currentMonthYear, initial_budget: 0, used_budget: amount });
        if (error) throw error;
      }
      await fetchCurrentBudget();
      return true;
    } catch (error) {
      console.error('Error deducting from CAS budget:', error);
      return false;
    }
  };

  const remainingBudget = currentBudget 
    ? (currentBudget.initial_budget || 0) - (currentBudget.used_budget || 0)
    : 0;

  useEffect(() => {
    fetchCurrentBudget();
    
    // Subscribe to realtime changes on cas_budget table
    const channel = supabase
      .channel('cas_budget_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cas_budget',
          filter: `month_year=eq.${currentMonthYear}`,
        },
        () => {
          fetchCurrentBudget();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCurrentBudget, currentMonthYear]);

  return {
    currentBudget,
    loading,
    remainingBudget,
    initialBudget: currentBudget?.initial_budget || 0,
    usedBudget: currentBudget?.used_budget || 0,
    setMonthlyBudget,
    deductFromBudget,
    refetch: fetchCurrentBudget,
  };
}
