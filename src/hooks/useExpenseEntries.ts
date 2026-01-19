import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface ExpenseEntry {
  id: string;
  expense_id: string;
  description: string | null;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

export const useExpenseEntries = () => {
  const [entries, setEntries] = useState<Record<string, ExpenseEntry[]>>({});
  const [loadingEntries, setLoadingEntries] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const fetchEntries = async (expenseId: string) => {
    setLoadingEntries((prev) => ({ ...prev, [expenseId]: true }));
    try {
      const { data, error } = await supabase
        .from('expense_entries')
        .select('*')
        .eq('expense_id', expenseId)
        .order('created_at');

      if (error) throw error;

      setEntries((prev) => ({ ...prev, [expenseId]: data as ExpenseEntry[] }));
    } catch (error: any) {
      console.error('Error fetching entries:', error);
    } finally {
      setLoadingEntries((prev) => ({ ...prev, [expenseId]: false }));
    }
  };

  const updateMainExpenseAmount = async (expenseId: string, newEntriesTotal: number) => {
    try {
      await supabase
        .from('monthly_expenses')
        .update({ amount: newEntriesTotal })
        .eq('id', expenseId);
    } catch (error) {
      console.error('Error updating main expense amount:', error);
    }
  };

  const addEntry = async (expenseId: string, description: string, amount: number, onExpenseUpdate?: () => void) => {
    try {
      const { data, error } = await supabase
        .from('expense_entries')
        .insert({
          expense_id: expenseId,
          description: description || null,
          amount,
          is_paid: false,
        })
        .select()
        .single();

      if (error) throw error;

      const currentEntries = entries[expenseId] || [];
      const newEntries = [...currentEntries, data as ExpenseEntry];
      const newTotal = newEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

      setEntries((prev) => ({
        ...prev,
        [expenseId]: newEntries,
      }));

      await updateMainExpenseAmount(expenseId, newTotal);
      onExpenseUpdate?.();

      toast({
        title: 'Adăugat',
        description: 'Intrarea a fost adăugată',
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut adăuga intrarea',
        variant: 'destructive',
      });
      return null;
    }
  };

  const updateEntry = async (entryId: string, expenseId: string, updates: Partial<Pick<ExpenseEntry, 'description' | 'amount'>>, onExpenseUpdate?: () => void) => {
    try {
      const { error } = await supabase
        .from('expense_entries')
        .update(updates)
        .eq('id', entryId);

      if (error) throw error;

      const currentEntries = entries[expenseId] || [];
      const updatedEntries = currentEntries.map((entry) =>
        entry.id === entryId ? { ...entry, ...updates } : entry
      );
      const newTotal = updatedEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

      setEntries((prev) => ({
        ...prev,
        [expenseId]: updatedEntries,
      }));

      await updateMainExpenseAmount(expenseId, newTotal);
      onExpenseUpdate?.();
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza intrarea',
        variant: 'destructive',
      });
    }
  };

  const deleteEntry = async (entryId: string, expenseId: string, onExpenseUpdate?: () => void) => {
    try {
      const { error } = await supabase
        .from('expense_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;

      const currentEntries = entries[expenseId] || [];
      const filteredEntries = currentEntries.filter((entry) => entry.id !== entryId);
      const newTotal = filteredEntries.reduce((sum, e) => sum + (e.amount || 0), 0);

      setEntries((prev) => ({
        ...prev,
        [expenseId]: filteredEntries,
      }));

      await updateMainExpenseAmount(expenseId, newTotal);
      onExpenseUpdate?.();

      toast({
        title: 'Șters',
        description: 'Intrarea a fost ștearsă',
      });
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge intrarea',
        variant: 'destructive',
      });
    }
  };

  const toggleEntryPaid = async (entryId: string, expenseId: string, isPaid: boolean) => {
    try {
      const { error } = await supabase
        .from('expense_entries')
        .update({
          is_paid: isPaid,
          paid_at: isPaid ? new Date().toISOString() : null,
        })
        .eq('id', entryId);

      if (error) throw error;

      setEntries((prev) => ({
        ...prev,
        [expenseId]: (prev[expenseId] || []).map((entry) =>
          entry.id === entryId
            ? { ...entry, is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null }
            : entry
        ),
      }));
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza starea plății',
        variant: 'destructive',
      });
    }
  };

  const getEntriesTotal = (expenseId: string) => {
    const expenseEntries = entries[expenseId] || [];
    return expenseEntries.reduce((sum, entry) => sum + (entry.amount || 0), 0);
  };

  const clearEntries = () => {
    setEntries({});
  };

  return {
    entries,
    loadingEntries,
    fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleEntryPaid,
    getEntriesTotal,
    clearEntries,
  };
};
