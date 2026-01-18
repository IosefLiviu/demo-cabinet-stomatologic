import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface MonthlyExpense {
  id: string;
  month_year: string;
  expense_name: string;
  amount: number;
  is_paid: boolean;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

const EXPENSE_CATEGORIES = [
  'Chirie',
  'Contabila',
  'Întreținere 1',
  'Întreținere 2',
  'Curent 1',
  'Curent 2',
  'Gaz 1',
  'Gaz 2',
  'Digi',
  'Publicitate',
  'Curățenie',
  'Asistenta',
  'Istoma',
  'IT',
  'Chirurgie',
  'Ortodontic',
  'Bugetul De Stat',
  'Doctori',
  'Infecțioase',
  'Salserv',
  'Mentenanță Unit',
  'Mentenanță Camere',
  'Materiale Curățenie',
  'Dentfactory',
  'Dentstore',
  'Jd',
  'Dentex',
  'Chișinău',
  'Necula',
  'Rate Banca',
  'Protecția Muncii',
  'Papetarie',
  'Farmacie',
];

export const useMonthlyExpenses = () => {
  const [expenses, setExpenses] = useState<MonthlyExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchExpenses = async (monthYear: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('monthly_expenses')
        .select('*')
        .eq('month_year', monthYear)
        .order('expense_name');

      if (error) throw error;

      // If no expenses exist for this month, initialize them
      if (!data || data.length === 0) {
        await initializeMonth(monthYear);
        return;
      }

      setExpenses(data as MonthlyExpense[]);
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu s-au putut încărca cheltuielile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const initializeMonth = async (monthYear: string) => {
    try {
      const expensesToInsert = EXPENSE_CATEGORIES.map((name) => ({
        month_year: monthYear,
        expense_name: name,
        amount: 0,
        is_paid: false,
      }));

      const { data, error } = await supabase
        .from('monthly_expenses')
        .insert(expensesToInsert)
        .select();

      if (error) throw error;

      setExpenses(data as MonthlyExpense[]);
    } catch (error: any) {
      console.error('Error initializing month:', error);
    }
  };

  const updateExpense = async (id: string, amount: number) => {
    try {
      const { error } = await supabase
        .from('monthly_expenses')
        .update({ amount })
        .eq('id', id);

      if (error) throw error;

      setExpenses((prev) =>
        prev.map((exp) => (exp.id === id ? { ...exp, amount } : exp))
      );
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza suma',
        variant: 'destructive',
      });
    }
  };

  const updateExpenseName = async (id: string, expenseName: string) => {
    try {
      const { error } = await supabase
        .from('monthly_expenses')
        .update({ expense_name: expenseName })
        .eq('id', id);

      if (error) throw error;

      setExpenses((prev) =>
        prev.map((exp) => (exp.id === id ? { ...exp, expense_name: expenseName } : exp))
      );

      toast({
        title: 'Actualizat',
        description: 'Denumirea a fost actualizată',
      });
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza denumirea',
        variant: 'destructive',
      });
    }
  };

  const addExpense = async (monthYear: string, expenseName: string, amount: number = 0) => {
    try {
      const { data, error } = await supabase
        .from('monthly_expenses')
        .insert({
          month_year: monthYear,
          expense_name: expenseName,
          amount,
          is_paid: false,
        })
        .select()
        .single();

      if (error) throw error;

      setExpenses((prev) => [...prev, data as MonthlyExpense].sort((a, b) => 
        a.expense_name.localeCompare(b.expense_name)
      ));

      toast({
        title: 'Adăugat',
        description: `Cheltuiala "${expenseName}" a fost adăugată`,
      });

      return data;
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: error.message?.includes('duplicate') 
          ? 'Această cheltuială există deja pentru luna selectată'
          : 'Nu s-a putut adăuga cheltuiala',
        variant: 'destructive',
      });
      return null;
    }
  };

  const deleteExpense = async (id: string) => {
    try {
      const { error } = await supabase
        .from('monthly_expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setExpenses((prev) => prev.filter((exp) => exp.id !== id));

      toast({
        title: 'Șters',
        description: 'Cheltuiala a fost ștearsă',
      });
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut șterge cheltuiala',
        variant: 'destructive',
      });
    }
  };

  const togglePaid = async (id: string, isPaid: boolean) => {
    try {
      const { error } = await supabase
        .from('monthly_expenses')
        .update({
          is_paid: isPaid,
          paid_at: isPaid ? new Date().toISOString() : null,
        })
        .eq('id', id);

      if (error) throw error;

      setExpenses((prev) =>
        prev.map((exp) =>
          exp.id === id
            ? { ...exp, is_paid: isPaid, paid_at: isPaid ? new Date().toISOString() : null }
            : exp
        )
      );

      toast({
        title: isPaid ? 'Marcat ca plătit' : 'Marcat ca neplătit',
        description: `Cheltuiala a fost ${isPaid ? 'marcată ca plătită' : 'demarcată'}`,
      });
    } catch (error: any) {
      toast({
        title: 'Eroare',
        description: 'Nu s-a putut actualiza starea plății',
        variant: 'destructive',
      });
    }
  };

  return {
    expenses,
    loading,
    fetchExpenses,
    updateExpense,
    updateExpenseName,
    addExpense,
    deleteExpense,
    togglePaid,
    categories: EXPENSE_CATEGORIES,
  };
};
