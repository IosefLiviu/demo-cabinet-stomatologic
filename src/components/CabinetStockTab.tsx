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
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";

interface CabinetStockTabProps {
  items: StockItem[];
  movements: StockMovement[];
  cabinets: Cabinet[];
  onConsumeFromCabinet: (movement: StockMovementInsert) => Promise<void>;
  isCreatingMovement: boolean;
}

interface CabinetStockItem {
  itemId: string;
  itemName: string;
  unit: string;
  category: string | null;
  quantity: number;
  entryDate: string | null;
  consumedAt: string | null; // Date when item was fully consumed
}

export function CabinetStockTab({
  items,
  movements,
  cabinets,
  onConsumeFromCabinet,
  isCreatingMovement,
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
      lastConsumedAt: string | null; // Track the most recent consumption date
    }>> = {};

    // Initialize cabinets
    cabinets.forEach((cabinet) => {
      stockMap[cabinet.id] = {};
    });

    // Sort movements by date to process in chronological order
    const sortedMovements = [...movements].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // Process movements
    sortedMovements.forEach((movement) => {
      // company_out: adds to destination cabinet
      if ((movement.type === "company_out" || movement.type === "out") && movement.cabinet_id) {
        if (!stockMap[movement.cabinet_id]) {
          stockMap[movement.cabinet_id] = {};
        }
        if (!stockMap[movement.cabinet_id][movement.item_id]) {
          stockMap[movement.cabinet_id][movement.item_id] = { quantity: 0, entryDate: null, lastConsumedAt: null };
        }
        stockMap[movement.cabinet_id][movement.item_id].quantity += movement.quantity;
        // Track the most recent entry date
        const movementDate = movement.created_at;
        if (!stockMap[movement.cabinet_id][movement.item_id].entryDate || 
            movementDate > stockMap[movement.cabinet_id][movement.item_id].entryDate!) {
          stockMap[movement.cabinet_id][movement.item_id].entryDate = movementDate;
        }
        // Reset consumedAt when new stock arrives
        stockMap[movement.cabinet_id][movement.item_id].lastConsumedAt = null;
      }

      // cabinet_out: subtracts from source cabinet
      if (movement.type === "cabinet_out" && movement.source_cabinet_id) {
        if (!stockMap[movement.source_cabinet_id]) {
          stockMap[movement.source_cabinet_id] = {};
        }
        if (!stockMap[movement.source_cabinet_id][movement.item_id]) {
          stockMap[movement.source_cabinet_id][movement.item_id] = { quantity: 0, entryDate: null, lastConsumedAt: null };
        }
        stockMap[movement.source_cabinet_id][movement.item_id].quantity -= movement.quantity;
        
        // Track consumption date when quantity reaches 0 or below
        if (stockMap[movement.source_cabinet_id][movement.item_id].quantity <= 0) {
          stockMap[movement.source_cabinet_id][movement.item_id].lastConsumedAt = movement.created_at;
        }
      }
    });

    return stockMap;
  }, [movements, cabinets]);

  // Get items in selected cabinet (including recently consumed ones)
  const cabinetItems = useMemo(() => {
    if (!selectedCabinetId || !cabinetStock[selectedCabinetId]) {
      return [];
    }

    const stockForCabinet = cabinetStock[selectedCabinetId];
    const result: CabinetStockItem[] = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    Object.entries(stockForCabinet).forEach(([itemId, data]) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;

      // Show item if:
      // 1. Has positive quantity (active)
      // 2. OR was consumed within the last 30 days
      const isConsumed = data.quantity <= 0 && data.lastConsumedAt;
      const consumedDate = data.lastConsumedAt ? new Date(data.lastConsumedAt) : null;
      const isWithin30Days = consumedDate && consumedDate >= thirtyDaysAgo;

      if (data.quantity > 0 || (isConsumed && isWithin30Days)) {
        result.push({
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          category: item.category,
          quantity: Math.max(0, data.quantity),
          entryDate: data.entryDate,
          consumedAt: data.lastConsumedAt,
        });
      }
    });

    // Sort: available items first (by name), then consumed items (by name)
    return result.sort((a, b) => {
      const aConsumed = a.quantity === 0 && a.consumedAt;
      const bConsumed = b.quantity === 0 && b.consumedAt;
      
      // If one is consumed and the other isn't, non-consumed comes first
      if (aConsumed && !bConsumed) return 1;
      if (!aConsumed && bConsumed) return -1;
      
      // Otherwise sort by name
      return a.itemName.localeCompare(b.itemName);
    });
  }, [selectedCabinetId, cabinetStock, items]);

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
            const isConsumed = item.quantity === 0 && item.consumedAt;
            
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

                {/* Entry date or Consumed date */}
                {isConsumed && item.consumedAt ? (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <PackageCheck className="h-3 w-3" />
                    <span>Consumat: {format(new Date(item.consumedAt), "dd MMM yyyy", { locale: ro })}</span>
                  </div>
                ) : item.entryDate ? (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    <span>{format(new Date(item.entryDate), "dd MMM yyyy", { locale: ro })}</span>
                  </div>
                ) : null}

                {/* Quantity */}
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={isConsumed ? "outline" : "secondary"} 
                    className={`text-sm font-medium ${isConsumed ? "text-muted-foreground" : ""}`}
                  >
                    {item.quantity} {item.unit}
                  </Badge>
                </div>

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
