import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface StockMovement {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  type: string;
  notes: string | null;
  created_at: string;
}

export interface StockMovementInsert {
  item_id: string;
  item_name: string;
  quantity: number;
  type: "in" | "out";
  notes?: string | null;
}

export function useStockMovements(itemId?: string) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    data: movements = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stock-movements", itemId],
    queryFn: async () => {
      let query = supabase
        .from("stock_movements")
        .select("*")
        .order("created_at", { ascending: false });

      if (itemId) {
        query = query.eq("item_id", itemId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as StockMovement[];
    },
  });

  const createMovement = useMutation({
    mutationFn: async (movement: StockMovementInsert) => {
      // First, get current item quantity
      const { data: item, error: itemError } = await supabase
        .from("stock_items")
        .select("quantity")
        .eq("id", movement.item_id)
        .single();

      if (itemError) throw itemError;

      const currentQty = Number(item.quantity);
      const movementQty = Number(movement.quantity);
      const newQty = movement.type === "in" 
        ? currentQty + movementQty 
        : currentQty - movementQty;

      if (newQty < 0) {
        throw new Error("Stoc insuficient pentru această operațiune");
      }

      // Insert movement
      const { data, error } = await supabase
        .from("stock_movements")
        .insert(movement)
        .select()
        .single();

      if (error) throw error;

      // Update item quantity
      const { error: updateError } = await supabase
        .from("stock_items")
        .update({ quantity: newQty })
        .eq("id", movement.item_id);

      if (updateError) throw updateError;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      toast({ title: "Mișcare de stoc înregistrată" });
    },
    onError: (error) => {
      toast({
        title: "Eroare la înregistrarea mișcării",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMovement = useMutation({
    mutationFn: async (id: string) => {
      // Get movement details first
      const { data: movement, error: getError } = await supabase
        .from("stock_movements")
        .select("*")
        .eq("id", id)
        .single();

      if (getError) throw getError;

      // Get current item quantity
      const { data: item, error: itemError } = await supabase
        .from("stock_items")
        .select("quantity")
        .eq("id", movement.item_id)
        .single();

      if (itemError) throw itemError;

      // Reverse the movement
      const currentQty = Number(item.quantity);
      const movementQty = Number(movement.quantity);
      const newQty = movement.type === "in" 
        ? currentQty - movementQty 
        : currentQty + movementQty;

      // Delete movement
      const { error } = await supabase
        .from("stock_movements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update item quantity
      const { error: updateError } = await supabase
        .from("stock_items")
        .update({ quantity: newQty })
        .eq("id", movement.item_id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-movements"] });
      queryClient.invalidateQueries({ queryKey: ["stock-items"] });
      toast({ title: "Mișcare anulată cu succes" });
    },
    onError: (error) => {
      toast({
        title: "Eroare la anularea mișcării",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    movements,
    isLoading,
    error,
    refetch,
    createMovement,
    deleteMovement,
  };
}
