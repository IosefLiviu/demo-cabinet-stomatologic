import { useState, useRef } from "react";
import { useStockItems, StockItem, StockItemInsert } from "@/hooks/useStockItems";
import { useStockMovements, StockMovementInsert } from "@/hooks/useStockMovements";
import { useCabinets } from "@/hooks/useCabinets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Minus,
  Pencil,
  Trash2,
  ArrowDownCircle,
  ArrowUpCircle,
  Upload,
  Download,
  Search,
  Package,
  History,
  AlertTriangle,
  Building2,
} from "lucide-react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

export function StockManagement() {
  const { toast } = useToast();
  const {
    items,
    isLoading,
    createItem,
    updateItem,
    deleteItem,
    bulkCreateItems,
  } = useStockItems();
  const { movements, createMovement, deleteMovement } = useStockMovements();
  const { cabinets } = useCabinets();

  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isMovementDialogOpen, setIsMovementDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [movementType, setMovementType] = useState<"in" | "out">("in");

  // Inline edit state
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingType, setEditingType] = useState<"in" | "out">("in");
  const [inlineQuantity, setInlineQuantity] = useState(1);
  const [inlineNote, setInlineNote] = useState("");
  const [inlineCabinetId, setInlineCabinetId] = useState<number | null>(null);

  const [itemForm, setItemForm] = useState({
    name: "",
    quantity: 0,
    unit: "buc",
    category: "",
  });

  const [movementForm, setMovementForm] = useState({
    item_id: "",
    quantity: 1,
    notes: "",
    cabinet_id: null as number | null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get unique categories
  const categories = [...new Set(items.map((i) => i.category).filter(Boolean))];

  // Filtered items
  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when search/filter changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value);
    setCurrentPage(1);
  };

  // Low stock items (quantity < 5)
  const lowStockItems = items.filter((i) => i.quantity < 5);

  const handleOpenItemDialog = (item?: StockItem) => {
    if (item) {
      setSelectedItem(item);
      setItemForm({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        category: item.category || "",
      });
    } else {
      setSelectedItem(null);
      setItemForm({ name: "", quantity: 0, unit: "buc", category: "" });
    }
    setIsItemDialogOpen(true);
  };

  const handleSaveItem = async () => {
    const payload: StockItemInsert = {
      name: itemForm.name,
      quantity: itemForm.quantity,
      unit: itemForm.unit,
      category: itemForm.category || null,
    };

    if (selectedItem) {
      await updateItem.mutateAsync({ id: selectedItem.id, ...payload });
    } else {
      await createItem.mutateAsync(payload);
    }
    setIsItemDialogOpen(false);
  };

  const handleDeleteItem = async () => {
    if (itemToDelete) {
      await deleteItem.mutateAsync(itemToDelete);
      setIsDeleteDialogOpen(false);
      setItemToDelete(null);
    }
  };

  const handleOpenMovementDialog = (type: "in" | "out", item?: StockItem) => {
    setMovementType(type);
    setMovementForm({
      item_id: item?.id || "",
      quantity: 1,
      notes: "",
      cabinet_id: null,
    });
    setIsMovementDialogOpen(true);
  };

  const handleSaveMovement = async () => {
    const item = items.find((i) => i.id === movementForm.item_id);
    if (!item) return;

    // For "out" movements, cabinet is required
    if (movementType === "out" && !movementForm.cabinet_id) {
      toast({
        title: "Selectează cabinetul",
        description: "Pentru ieșiri din stoc, trebuie să selectezi cabinetul destinatar.",
        variant: "destructive",
      });
      return;
    }

    const payload: StockMovementInsert = {
      item_id: movementForm.item_id,
      item_name: item.name,
      quantity: movementForm.quantity,
      type: movementType,
      notes: movementForm.notes || null,
      cabinet_id: movementType === "out" ? movementForm.cabinet_id : null,
    };

    await createMovement.mutateAsync(payload);
    setIsMovementDialogOpen(false);
  };

  // Open inline edit mode
  const handleStartInlineEdit = (item: StockItem, type: "in" | "out") => {
    setEditingItemId(item.id);
    setEditingType(type);
    setInlineQuantity(1);
    setInlineNote("");
    setInlineCabinetId(null);
  };

  // Cancel inline edit
  const handleCancelInlineEdit = () => {
    setEditingItemId(null);
    setInlineQuantity(1);
    setInlineNote("");
    setInlineCabinetId(null);
  };

  // Confirm inline edit with explicit type
  const handleConfirmInlineEdit = async (item: StockItem, type: "in" | "out") => {
    // For "out" movements, cabinet is required
    if (type === "out" && !inlineCabinetId) {
      toast({
        title: "Selectează cabinetul",
        description: "Pentru ieșiri din stoc, trebuie să selectezi cabinetul destinatar.",
        variant: "destructive",
      });
      return;
    }

    const payload: StockMovementInsert = {
      item_id: item.id,
      item_name: item.name,
      quantity: inlineQuantity,
      type: type,
      notes: inlineNote || null,
      cabinet_id: type === "out" ? inlineCabinetId : null,
    };
    await createMovement.mutateAsync(payload);
    handleCancelInlineEdit();
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Array<Record<string, unknown>>;

        const itemsToImport: StockItemInsert[] = jsonData.map((row) => {
          // Support multiple column name formats
          const name = (row.name || row.Name || row.nume || row.Nume || "") as string;
          const quantity = Number(row.quantity || row.Quantity || row.cantitate || row.Cantitate) || 0;
          // Support "U.M.", "unit", "unitate" variations
          const unit = (row.unit || row.Unit || row.unitate || row.Unitate || row["U.M."] || row["u.m."] || "buc") as string;
          const category = (row.category || row.Category || row.categorie || row.Categorie || null) as string | null;
          
          return {
            name: name.trim(),
            quantity,
            unit: unit.trim(),
            category: category?.trim() || null,
          };
        }).filter((item) => item.name);

        if (itemsToImport.length === 0) {
          toast({
            title: "Fișier gol sau format invalid",
            description: "Asigură-te că fișierul conține coloanele: Nume, Cantitate, U.M./Unitate, Categorie",
            variant: "destructive",
          });
          return;
        }

        await bulkCreateItems.mutateAsync(itemsToImport);
      } catch (error) {
        toast({
          title: "Eroare la importul fișierului",
          description: "Verifică formatul fișierului",
          variant: "destructive",
        });
      }
    };
    reader.readAsBinaryString(file);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleExportCSV = () => {
    const exportData = items.map((item) => ({
      nume: item.name,
      cantitate: item.quantity,
      unitate: item.unit,
      categorie: item.category || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Stoc");
    XLSX.writeFile(workbook, `stoc_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Articole</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stoc Redus</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {lowStockItems.length}
            </div>
            <p className="text-xs text-muted-foreground">articole sub 5 unități</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mișcări Astăzi</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                movements.filter(
                  (m) =>
                    format(new Date(m.created_at), "yyyy-MM-dd") ===
                    format(new Date(), "yyyy-MM-dd")
                ).length
              }
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="items" className="w-full">
        <TabsList>
          <TabsTrigger value="items">Articole Stoc</TabsTrigger>
          <TabsTrigger value="movements">Istoric Mișcări</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="space-y-4">
          {/* Actions Bar */}
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2 items-center">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Caută articole..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-8 w-[200px]"
                />
              </div>
              <Select value={categoryFilter} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Categorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat!}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportCSV}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-1" />
                Export
              </Button>
              <Button size="sm" onClick={() => handleOpenItemDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                Articol Nou
              </Button>
            </div>
          </div>

          {/* Items Grid with Quick Actions */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nu există articole
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedItems.map((item) => {
                const isEditing = editingItemId === item.id;
                
                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border bg-card transition-colors ${isEditing ? "ring-2 ring-primary/20" : "hover:bg-muted/30"}`}
                  >
                    {/* Normal view */}
                    {!isEditing ? (
                      <div className="flex items-center gap-4 p-3">
                        {/* Item info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-sm truncate" title={item.name}>
                              {item.name}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-50 hover:opacity-100"
                              onClick={() => handleOpenItemDialog(item)}
                              title="Editează"
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                          </div>
                          {item.category && (
                            <span className="text-xs text-muted-foreground">{item.category}</span>
                          )}
                        </div>

                        {/* Quantity with low stock warning */}
                        <div className="flex items-center gap-1.5">
                          {item.quantity < 5 && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                          <span className={`text-sm font-medium ${item.quantity < 5 ? "text-amber-600" : ""}`}>
                            {item.quantity}
                          </span>
                          {item.quantity < 5 && (
                            <span className="text-xs text-amber-600">Scăzut</span>
                          )}
                        </div>

                        {/* Action buttons - circular, subtle */}
                        <div className="flex items-center gap-1.5">
                          <button
                            className="h-8 w-8 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                            onClick={() => handleStartInlineEdit(item, "in")}
                            disabled={createMovement.isPending}
                            title="Adaugă"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            className="h-8 w-8 rounded-full bg-red-400 hover:bg-red-500 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                            onClick={() => handleStartInlineEdit(item, "out")}
                            disabled={createMovement.isPending || item.quantity < 1}
                            title="Scade"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <button
                            className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors text-muted-foreground hover:text-destructive"
                            onClick={() => {
                              setItemToDelete(item.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            title="Șterge"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Expanded inline edit view */
                      <div className="p-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-medium text-sm">{item.name}</span>
                          
                          <Input
                            type="number"
                            min={1}
                            max={editingType === "out" ? item.quantity : undefined}
                            value={inlineQuantity}
                            onChange={(e) => setInlineQuantity(Math.max(1, Number(e.target.value)))}
                            className="w-16 h-8 text-center"
                          />
                          
                          <Input
                            placeholder="Notă"
                            value={inlineNote}
                            onChange={(e) => setInlineNote(e.target.value)}
                            className="w-32 h-8"
                          />

                          {/* Cabinet selector for "out" movements */}
                          <Select
                            value={inlineCabinetId?.toString() || ""}
                            onValueChange={(value) => setInlineCabinetId(value ? Number(value) : null)}
                          >
                            <SelectTrigger className="w-[140px] h-8">
                              <Building2 className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                              <SelectValue placeholder="Cabinet" />
                            </SelectTrigger>
                            <SelectContent>
                              {cabinets.map((cabinet) => (
                                <SelectItem key={cabinet.id} value={cabinet.id.toString()}>
                                  {cabinet.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <div className="flex items-center gap-2 ml-auto">
                            <Button
                              size="sm"
                              className="bg-green-500 hover:bg-green-600 text-white h-8 px-3"
                              onClick={() => handleConfirmInlineEdit(item, "in")}
                              disabled={createMovement.isPending}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1" />
                              +{inlineQuantity}
                            </Button>
                            <Button
                              size="sm"
                              className="bg-red-500 hover:bg-red-600 text-white h-8 px-3"
                              onClick={() => handleConfirmInlineEdit(item, "out")}
                              disabled={createMovement.isPending || inlineQuantity > item.quantity || !inlineCabinetId}
                              title={!inlineCabinetId ? "Selectează un cabinet pentru ieșire" : undefined}
                            >
                              <Minus className="h-3.5 w-3.5 mr-1" />
                              -{inlineQuantity}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-muted-foreground"
                              onClick={handleCancelInlineEdit}
                            >
                              Anulează
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Afișare {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredItems.length)} din {filteredItems.length} articole
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="min-w-[36px]"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Următor
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenMovementDialog("in")}
            >
              <ArrowDownCircle className="h-4 w-4 mr-1 text-green-600" />
              Intrare
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleOpenMovementDialog("out")}
            >
              <ArrowUpCircle className="h-4 w-4 mr-1 text-orange-600" />
              Ieșire
            </Button>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Articol</TableHead>
                  <TableHead>Tip</TableHead>
                  <TableHead>Cabinet</TableHead>
                  <TableHead className="text-right">Cantitate</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead className="text-right">Acțiuni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movements.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Nu există mișcări înregistrate
                    </TableCell>
                  </TableRow>
                ) : (
                  movements.map((movement) => {
                    const cabinet = cabinets.find(c => c.id === movement.cabinet_id);
                    return (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {format(new Date(movement.created_at), "dd MMM yyyy HH:mm", {
                            locale: ro,
                          })}
                        </TableCell>
                        <TableCell className="font-medium">
                          {movement.item_name}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={movement.type === "in" ? "default" : "secondary"}
                            className={
                              movement.type === "in"
                                ? "bg-green-100 text-green-800"
                                : "bg-orange-100 text-orange-800"
                            }
                          >
                            {movement.type === "in" ? "Intrare" : "Ieșire"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {cabinet ? (
                            <span className="text-sm">{cabinet.name}</span>
                          ) : movement.type === "out" ? (
                            <span className="text-muted-foreground text-xs">-</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">
                          {movement.quantity}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {movement.notes}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMovement.mutate(movement.id)}
                            title="Anulează mișcare"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Item Dialog */}
      <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedItem ? "Editează Articol" : "Articol Nou"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nume</Label>
              <Input
                id="name"
                value={itemForm.name}
                onChange={(e) =>
                  setItemForm({ ...itemForm, name: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="quantity">Cantitate</Label>
                <Input
                  id="quantity"
                  type="number"
                  min={0}
                  value={itemForm.quantity}
                  onChange={(e) =>
                    setItemForm({
                      ...itemForm,
                      quantity: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unit">Unitate</Label>
                <Input
                  id="unit"
                  value={itemForm.unit}
                  onChange={(e) =>
                    setItemForm({ ...itemForm, unit: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Categorie</Label>
              <Input
                id="category"
                value={itemForm.category}
                onChange={(e) =>
                  setItemForm({ ...itemForm, category: e.target.value })
                }
                placeholder="ex: Consumabile, Instrumente..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsItemDialogOpen(false)}
            >
              Anulează
            </Button>
            <Button onClick={handleSaveItem} disabled={!itemForm.name}>
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Movement Dialog */}
      <Dialog open={isMovementDialogOpen} onOpenChange={setIsMovementDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {movementType === "in" ? "Intrare Stoc" : "Ieșire Stoc"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="item">Articol</Label>
              <Select
                value={movementForm.item_id}
                onValueChange={(value) =>
                  setMovementForm({ ...movementForm, item_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează articol" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name} ({item.quantity} {item.unit})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="qty">Cantitate</Label>
              <Input
                id="qty"
                type="number"
                min={1}
                value={movementForm.quantity}
                onChange={(e) =>
                  setMovementForm({
                    ...movementForm,
                    quantity: Number(e.target.value),
                  })
                }
              />
            </div>
            {movementType === "out" && (
              <div className="grid gap-2">
                <Label htmlFor="cabinet">Cabinet destinatar *</Label>
                <Select
                  value={movementForm.cabinet_id?.toString() || ""}
                  onValueChange={(value) =>
                    setMovementForm({ ...movementForm, cabinet_id: value ? Number(value) : null })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează cabinetul" />
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
            )}
            <div className="grid gap-2">
              <Label htmlFor="notes">Note</Label>
              <Textarea
                id="notes"
                value={movementForm.notes}
                onChange={(e) =>
                  setMovementForm({ ...movementForm, notes: e.target.value })
                }
                placeholder="Motiv, furnizor, pacient..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsMovementDialogOpen(false)}
            >
              Anulează
            </Button>
            <Button
              onClick={handleSaveMovement}
              disabled={!movementForm.item_id || movementForm.quantity < 1 || (movementType === "out" && !movementForm.cabinet_id)}
            >
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge articolul?</AlertDialogTitle>
            <AlertDialogDescription>
              Această acțiune va șterge articolul și toate mișcările asociate.
              Acțiunea nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
