import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Movement types for the stock flow:
// - company_in: Item enters company stock (from supplier)
// - company_out: Item leaves company stock, enters a cabinet
// - cabinet_out: Item is consumed/used from a cabinet
export type MovementType = "in" | "out" | "company_in" | "company_out" | "cabinet_out";

export interface StockMovement {
  id: string;
  item_id: string;
  item_name: string;
  quantity: number;
  type: string;
  notes: string | null;
  cabinet_id: number | null;
  source_cabinet_id: number | null;
  created_at: string;
}

export interface StockMovementInsert {
  item_id: string;
  item_name: string;
  quantity: number;
  type: MovementType;
  notes?: string | null;
  cabinet_id?: number | null;
  source_cabinet_id?: number | null;
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
      
      // Determine quantity change based on movement type
      let newQty: number;
      switch (movement.type) {
        case "in":
        case "company_in":
          // Items entering company stock
          newQty = currentQty + movementQty;
          break;
        case "out":
        case "company_out":
          // Items leaving company stock (going to a cabinet)
          newQty = currentQty - movementQty;
          break;
        case "cabinet_out":
          // Items consumed from a cabinet - doesn't affect company stock directly
          // The item was already deducted when it went to the cabinet
          newQty = currentQty;
          break;
        default:
          newQty = currentQty;
      }

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

      // Update item quantity (only for movements that affect company stock)
      if (movement.type !== "cabinet_out") {
        const { error: updateError } = await supabase
          .from("stock_items")
          .update({ quantity: newQty })
          .eq("id", movement.item_id);

        if (updateError) throw updateError;
      }

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
      
      let newQty: number;
      switch (movement.type) {
        case "in":
        case "company_in":
          newQty = currentQty - movementQty;
          break;
        case "out":
        case "company_out":
          newQty = currentQty + movementQty;
          break;
        case "cabinet_out":
          newQty = currentQty; // Doesn't affect company stock
          break;
        default:
          newQty = currentQty;
      }

      // Delete movement
      const { error } = await supabase
        .from("stock_movements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      // Update item quantity (only for movements that affect company stock)
      if (movement.type !== "cabinet_out") {
        const { error: updateError } = await supabase
          .from("stock_items")
          .update({ quantity: newQty })
          .eq("id", movement.item_id);

        if (updateError) throw updateError;
      }
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
