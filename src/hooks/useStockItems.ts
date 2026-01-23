import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockItemInsert {
  name: string;
  quantity?: number;
  unit?: string;
  category?: string | null;
}

export interface StockItemUpdate {
  name?: string;
  quantity?: number;
  unit?: string;
  category?: string | null;
}

export function useStockItems() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: items = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stock-items"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_items")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      return data as StockItem[];
    },
  });

  const createItem = useMutation({
    mutationFn: async (item: StockItemInsert) => {
      const { data, error } = await supabase
        .from("stock_items")
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      toast({ title: "Articol adăugat cu succes" });
    },
    onError: (error) => {
      toast({
        title: "Eroare la adăugarea articolului",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, ...updates }: StockItemUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("stock_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      toast({ title: "Articol actualizat cu succes" });
    },
    onError: (error) => {
      toast({
        title: "Eroare la actualizarea articolului",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("stock_items")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      toast({ title: "Articol șters cu succes" });
    },
    onError: (error) => {
      toast({
        title: "Eroare la ștergerea articolului",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const bulkCreateItems = useMutation({
    mutationFn: async (items: StockItemInsert[]) => {
      const { data, error } = await supabase
        .from("stock_items")
        .insert(items)
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      toast({ title: `${data.length} articole importate cu succes` });
    },
    onError: (error) => {
      toast({
        title: "Eroare la importul articolelor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    items,
    isLoading,
    error,
    refetch,
    createItem,
    updateItem,
    deleteItem,
    bulkCreateItems,
  };
}
