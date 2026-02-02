import { useState, useMemo } from "react";
import { StockItem } from "@/hooks/useStockItems";
import { StockMovement, StockMovementInsert, MovementType } from "@/hooks/useStockMovements";
import { Cabinet } from "@/hooks/useCabinets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Building2,
  PackageCheck,
  Search,
  Package,
  Calendar,
  Trash2,
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

// Special destinations (virtual cabinets) - use negative IDs to differentiate from real cabinets
const SPECIAL_DESTINATIONS = [
  { id: -1, name: "Sterilizare" },
  { id: -2, name: "Curățenie" },
  { id: -3, name: "Farmacie" },
  { id: -4, name: "Papetărie" },
];

interface CabinetStockTabProps {
  items: StockItem[];
  movements: StockMovement[];
  cabinets: Cabinet[];
  onConsumeFromCabinet: (movement: StockMovementInsert) => Promise<void>;
  onDeleteMovement: (id: string) => Promise<void>;
  isCreatingMovement: boolean;
  isDeletingMovement: boolean;
}

interface CabinetStockItem {
  itemId: string;
  itemName: string;
  unit: string;
  category: string | null;
  quantity: number;
  entryDate: string | null;
  consumedAt: string | null; // Date when item was fully consumed
  movementId: string | null; // ID of the movement that caused consumption (for deletion)
}

export function CabinetStockTab({
  items,
  movements,
  cabinets,
  onConsumeFromCabinet,
  onDeleteMovement,
  isCreatingMovement,
  isDeletingMovement,
}: CabinetStockTabProps) {
  const [selectedCabinetId, setSelectedCabinetId] = useState<number | null>(
    cabinets[0]?.id || null
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isConsumeDialogOpen, setIsConsumeDialogOpen] = useState(false);
  const [selectedStockItem, setSelectedStockItem] = useState<CabinetStockItem | null>(null);
  const [consumeQuantity, setConsumeQuantity] = useState(1);
  const [consumeNotes, setConsumeNotes] = useState("");

  // Calculate stock per cabinet from movements
  const cabinetStock = useMemo(() => {
    const stockMap: Record<number, Record<string, { 
      quantity: number; 
      entryDate: string | null;
    }>> = {};

    // Initialize real cabinets
    cabinets.forEach((cabinet) => {
      stockMap[cabinet.id] = {};
    });

    // Initialize special destinations
    SPECIAL_DESTINATIONS.forEach((dest) => {
      stockMap[dest.id] = {};
    });

    // Sort movements by date to process in chronological order
    const sortedMovements = [...movements].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Helper to extract special destination from notes
    const getSpecialDestinationFromNotes = (notes: string | null): number | null => {
      if (!notes) return null;
      for (const dest of SPECIAL_DESTINATIONS) {
        if (notes.includes(`[${dest.name}]`)) {
          return dest.id;
        }
      }
      return null;
    };

    // Process movements
    sortedMovements.forEach((movement) => {
      // company_out: adds to destination cabinet or special destination
      if (movement.type === "company_out" || movement.type === "out") {
        let targetId: number | null = movement.cabinet_id;
        
        // Check if this is a special destination (stored in notes)
        if (!targetId) {
          targetId = getSpecialDestinationFromNotes(movement.notes);
        }
        
        if (targetId !== null) {
          if (!stockMap[targetId]) {
            stockMap[targetId] = {};
          }
          if (!stockMap[targetId][movement.item_id]) {
            stockMap[targetId][movement.item_id] = { quantity: 0, entryDate: null };
          }
          stockMap[targetId][movement.item_id].quantity += movement.quantity;
          // Track the most recent entry date
          const movementDate = movement.created_at;
          if (!stockMap[targetId][movement.item_id].entryDate || 
              movementDate > stockMap[targetId][movement.item_id].entryDate!) {
            stockMap[targetId][movement.item_id].entryDate = movementDate;
          }
        }
      }

      // cabinet_out: subtracts from source cabinet
      if (movement.type === "cabinet_out" && movement.source_cabinet_id) {
        if (!stockMap[movement.source_cabinet_id]) {
          stockMap[movement.source_cabinet_id] = {};
        }
        if (!stockMap[movement.source_cabinet_id][movement.item_id]) {
          stockMap[movement.source_cabinet_id][movement.item_id] = { quantity: 0, entryDate: null };
        }
        stockMap[movement.source_cabinet_id][movement.item_id].quantity -= movement.quantity;
      }
    });

    return stockMap;
  }, [movements, cabinets]);

  // Get consumption movements for selected cabinet (cabinet_out movements)
  // Filter out soft-deleted movements (deleted_at is set)
  const consumptionMovements = useMemo(() => {
    if (!selectedCabinetId) return [];
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return movements.filter(m => 
      m.type === "cabinet_out" && 
      m.source_cabinet_id === selectedCabinetId &&
      new Date(m.created_at) >= thirtyDaysAgo &&
      !m.deleted_at // Exclude soft-deleted movements from display
    );
  }, [movements, selectedCabinetId]);

  // Get items in selected cabinet (including recently consumed ones)
  const cabinetItems = useMemo(() => {
    if (!selectedCabinetId || !cabinetStock[selectedCabinetId]) {
      return [];
    }

    const stockForCabinet = cabinetStock[selectedCabinetId];
    const result: CabinetStockItem[] = [];

    // Add available stock items
    Object.entries(stockForCabinet).forEach(([itemId, data]) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      // Show available stock (quantity > 0)
      if (data.quantity > 0) {
        result.push({
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          category: item.category,
          quantity: data.quantity,
          entryDate: data.entryDate,
          consumedAt: null,
          movementId: null,
        });
      }
    });

    // Add consumption movements as separate entries (each cabinet_out is a consumed entry)
    consumptionMovements.forEach((movement) => {
      const item = items.find((i) => i.id === movement.item_id);
      if (!item) return;

      result.push({
        itemId: `consumed-${movement.id}`, // Unique key based on movement ID
        itemName: item.name,
        unit: item.unit,
        category: item.category,
        quantity: movement.quantity, // Show the consumed quantity
        entryDate: stockForCabinet[movement.item_id]?.entryDate || null,
        consumedAt: movement.created_at,
        movementId: movement.id,
      });
    });

    // Sort: available items first (by name), then consumed items (by consumption date, newest first)
    return result.sort((a, b) => {
      const aConsumed = a.consumedAt !== null;
      const bConsumed = b.consumedAt !== null;
      
      // If one is consumed and the other isn't, non-consumed comes first
      if (aConsumed && !bConsumed) return 1;
      if (!aConsumed && bConsumed) return -1;
      
      // If both are consumed, sort by consumption date (newest first)
      if (aConsumed && bConsumed) {
        return new Date(b.consumedAt!).getTime() - new Date(a.consumedAt!).getTime();
      }
      
      // Otherwise sort by name
      return a.itemName.localeCompare(b.itemName);
    });
  }, [selectedCabinetId, cabinetStock, items, consumptionMovements]);

  // Filter by search
  const filteredCabinetItems = cabinetItems.filter((item) =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate total items and quantity in selected cabinet
  const totalItemsInCabinet = cabinetItems.length;
  const totalQuantityInCabinet = cabinetItems.reduce((sum, item) => sum + item.quantity, 0);

  const handleOpenConsumeDialog = (item: CabinetStockItem) => {
    setSelectedStockItem(item);
    setConsumeQuantity(1);
    setConsumeNotes("");
    setIsConsumeDialogOpen(true);
  };

  const handleConsumeItem = async () => {
    if (!selectedStockItem || !selectedCabinetId) return;

    const movement: StockMovementInsert = {
      item_id: selectedStockItem.itemId,
      item_name: selectedStockItem.itemName,
      quantity: consumeQuantity,
      type: "cabinet_out" as MovementType,
      notes: consumeNotes || null,
      source_cabinet_id: selectedCabinetId,
    };

    await onConsumeFromCabinet(movement);
    setIsConsumeDialogOpen(false);
    setSelectedStockItem(null);
  };

  return (
    <div className="space-y-4">
      {/* Cabinet selector and search */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex gap-3 items-center">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <Label className="text-sm font-medium">Cabinet:</Label>
          </div>
          <Select
            value={selectedCabinetId?.toString() || ""}
            onValueChange={(value) => setSelectedCabinetId(value ? Number(value) : null)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selectează cabinet" />
            </SelectTrigger>
            <SelectContent>
              {cabinets.map((cabinet) => (
                <SelectItem key={cabinet.id} value={cabinet.id.toString()}>
                  {cabinet.name}
                </SelectItem>
              ))}
              {/* Special destinations separator */}
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
                Destinații speciale
              </div>
              {SPECIAL_DESTINATIONS.map((dest) => (
                <SelectItem key={dest.id} value={dest.id.toString()}>
                  {dest.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Caută articole..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 w-[200px]"
          />
        </div>
      </div>

      {/* Summary cards for selected cabinet */}
      {selectedCabinetId && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipuri Articole</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItemsInCabinet}</div>
              <p className="text-xs text-muted-foreground">articole diferite</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bucăți</CardTitle>
              <PackageCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalQuantityInCabinet}</div>
              <p className="text-xs text-muted-foreground">unități în cabinet</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Items list */}
      {!selectedCabinetId ? (
        <div className="text-center py-12 text-muted-foreground">
          <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Selectează un cabinet pentru a vedea stocul</p>
        </div>
      ) : filteredCabinetItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Nu există articole în acest cabinet</p>
          {searchTerm && (
            <p className="text-sm mt-1">Încearcă să modifici căutarea</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredCabinetItems.map((item) => {
            const isConsumed = item.consumedAt !== null;
            
            return (
              <div
                key={item.itemId}
                className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                  isConsumed 
                    ? "bg-muted/50 opacity-60 border-dashed" 
                    : "bg-card hover:bg-muted/30"
                }`}
              >
                {/* Item info */}
                <div className="flex-1 min-w-0">
                  <h4 className={`font-medium text-sm truncate ${isConsumed ? "text-muted-foreground line-through" : ""}`} title={item.itemName}>
                    {item.itemName}
                  </h4>
                  {item.category && (
                    <span className="text-xs text-muted-foreground">{item.category}</span>
                  )}
                </div>

                {/* Entry date - show for both available and consumed items */}
                {item.entryDate && !isConsumed && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>Intrat: {format(new Date(item.entryDate), "dd MMM yyyy", { locale: ro })}</span>
                  </div>
                )}

                {/* Consumed date and quantity - only for consumed items */}
                {isConsumed && item.consumedAt && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <PackageCheck className="h-3 w-3" />
                    <span>Consumat {item.quantity} {item.unit} la {format(new Date(item.consumedAt), "dd MMM yyyy", { locale: ro })}</span>
                  </div>
                )}

                {/* Quantity - only for available items */}
                {!isConsumed && (
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary" 
                      className="text-sm font-medium"
                    >
                      {item.quantity} {item.unit}
                    </Badge>
                  </div>
                )}

                {/* Consume button - only show if not already consumed */}
                {!isConsumed && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300"
                    onClick={() => handleOpenConsumeDialog(item)}
                    disabled={isCreatingMovement}
                  >
                    <PackageCheck className="h-4 w-4 mr-1" />
                    Consumat
                  </Button>
                )}

                {/* Delete button - only show for consumed items */}
                {isConsumed && item.movementId && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onDeleteMovement(item.movementId!)}
                    disabled={isDeletingMovement}
                    title="Șterge înregistrarea de consum"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Consume Dialog */}
      <Dialog open={isConsumeDialogOpen} onOpenChange={setIsConsumeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PackageCheck className="h-5 w-5 text-orange-600" />
              Consumat din Cabinet
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Articol</Label>
              <div className="p-3 bg-muted rounded-md">
                <p className="font-medium">{selectedStockItem?.itemName}</p>
                <p className="text-sm text-muted-foreground">
                  Disponibil: {selectedStockItem?.quantity} {selectedStockItem?.unit}
                </p>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Cabinet</Label>
              <div className="p-3 bg-muted rounded-md flex items-center gap-2">
                <Building2 className="h-4 w-4 text-orange-500" />
                <span className="font-medium">
                  {cabinets.find((c) => c.id === selectedCabinetId)?.name}
                </span>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="consume-qty">Cantitate consumată</Label>
              <Input
                id="consume-qty"
                type="number"
                min={1}
                max={selectedStockItem?.quantity || 1}
                value={consumeQuantity}
                onChange={(e) =>
                  setConsumeQuantity(
                    Math.min(
                      Math.max(1, Number(e.target.value)),
                      selectedStockItem?.quantity || 1
                    )
                  )
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="consume-notes">Note (opțional)</Label>
              <Textarea
                id="consume-notes"
                value={consumeNotes}
                onChange={(e) => setConsumeNotes(e.target.value)}
                placeholder="Pacient, procedură, motiv..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConsumeDialogOpen(false)}
            >
              Anulează
            </Button>
            <Button
              onClick={handleConsumeItem}
              disabled={
                !selectedStockItem ||
                consumeQuantity < 1 ||
                consumeQuantity > (selectedStockItem?.quantity || 0) ||
                isCreatingMovement
              }
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <PackageCheck className="h-4 w-4 mr-1" />
              Marchează Consumat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
