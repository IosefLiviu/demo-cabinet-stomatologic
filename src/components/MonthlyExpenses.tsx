import { useState, useEffect, useMemo } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ro } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, X, Wallet, Plus, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMonthlyExpenses, MonthlyExpense } from '@/hooks/useMonthlyExpenses';
import { useExpenseEntries, ExpenseEntry } from '@/hooks/useExpenseEntries';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export const MonthlyExpenses = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { 
    expenses, 
    loading, 
    fetchExpenses, 
    updateExpense, 
    updateExpenseName,
    addExpense,
    deleteExpense,
    togglePaid 
  } = useMonthlyExpenses();
  
  const {
    entries,
    loadingEntries,
    fetchEntries,
    addEntry,
    updateEntry,
    deleteEntry,
    toggleEntryPaid,
    getEntriesTotal,
    clearEntries,
  } = useExpenseEntries();

  const [editingAmounts, setEditingAmounts] = useState<Record<string, string>>({});
  const [editingEntryAmounts, setEditingEntryAmounts] = useState<Record<string, string>>({});
  const [expandedExpenses, setExpandedExpenses] = useState<Set<string>>(new Set());
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<MonthlyExpense | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<ExpenseEntry | null>(null);
  const [isDeleteEntryDialogOpen, setIsDeleteEntryDialogOpen] = useState(false);
  
  // Form states
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('0');
  const [editExpenseName, setEditExpenseName] = useState('');
  const [newEntryDescription, setNewEntryDescription] = useState('');
  const [newEntryAmount, setNewEntryAmount] = useState('0');

  const monthYear = format(selectedMonth, 'yyyy-MM');

  useEffect(() => {
    clearEntries();
    fetchExpenses(monthYear);
  }, [monthYear]);

  const handlePrevMonth = () => {
    setSelectedMonth(subMonths(selectedMonth, 1));
    setExpandedExpenses(new Set());
  };

  const handleNextMonth = () => {
    setSelectedMonth(addMonths(selectedMonth, 1));
    setExpandedExpenses(new Set());
  };

  const handleAmountChange = (id: string, value: string) => {
    setEditingAmounts((prev) => ({ ...prev, [id]: value }));
  };

  const handleAmountBlur = async (expense: MonthlyExpense) => {
    const newValue = editingAmounts[expense.id];
    if (newValue !== undefined) {
      const numValue = parseFloat(newValue) || 0;
      if (numValue !== expense.amount) {
        await updateExpense(expense.id, numValue);
      }
      setEditingAmounts((prev) => {
        const updated = { ...prev };
        delete updated[expense.id];
        return updated;
      });
    }
  };

  const handleEntryAmountChange = (id: string, value: string) => {
    setEditingEntryAmounts((prev) => ({ ...prev, [id]: value }));
  };

  const handleEntryAmountBlur = async (entry: ExpenseEntry) => {
    const newValue = editingEntryAmounts[entry.id];
    if (newValue !== undefined) {
      const numValue = parseFloat(newValue) || 0;
      if (numValue !== entry.amount) {
        await updateEntry(entry.id, entry.expense_id, { amount: numValue });
      }
      setEditingEntryAmounts((prev) => {
        const updated = { ...prev };
        delete updated[entry.id];
        return updated;
      });
    }
  };

  const handleTogglePaid = async (expense: MonthlyExpense) => {
    await togglePaid(expense.id, !expense.is_paid);
  };

  const handleToggleExpand = async (expenseId: string) => {
    const newExpanded = new Set(expandedExpenses);
    if (newExpanded.has(expenseId)) {
      newExpanded.delete(expenseId);
    } else {
      newExpanded.add(expenseId);
      if (!entries[expenseId]) {
        await fetchEntries(expenseId);
      }
    }
    setExpandedExpenses(newExpanded);
  };

  const handleAddExpense = async () => {
    if (!newExpenseName.trim()) return;
    
    const amount = parseFloat(newExpenseAmount) || 0;
    const result = await addExpense(monthYear, newExpenseName.trim(), amount);
    
    if (result) {
      setIsAddDialogOpen(false);
      setNewExpenseName('');
      setNewExpenseAmount('0');
    }
  };

  const handleEditExpense = async () => {
    if (!selectedExpense || !editExpenseName.trim()) return;
    
    await updateExpenseName(selectedExpense.id, editExpenseName.trim());
    setIsEditDialogOpen(false);
    setSelectedExpense(null);
    setEditExpenseName('');
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;
    
    await deleteExpense(selectedExpense.id);
    setIsDeleteDialogOpen(false);
    setSelectedExpense(null);
  };

  const handleAddEntry = async () => {
    if (!selectedExpense) return;
    
    const amount = parseFloat(newEntryAmount) || 0;
    const result = await addEntry(selectedExpense.id, newEntryDescription.trim(), amount);
    
    if (result) {
      setIsAddEntryDialogOpen(false);
      setNewEntryDescription('');
      setNewEntryAmount('0');
    }
  };

  const handleDeleteEntry = async () => {
    if (!selectedEntry) return;
    
    await deleteEntry(selectedEntry.id, selectedEntry.expense_id);
    setIsDeleteEntryDialogOpen(false);
    setSelectedEntry(null);
  };

  const openEditDialog = (expense: MonthlyExpense) => {
    setSelectedExpense(expense);
    setEditExpenseName(expense.expense_name);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (expense: MonthlyExpense) => {
    setSelectedExpense(expense);
    setIsDeleteDialogOpen(true);
  };

  const openAddEntryDialog = (expense: MonthlyExpense) => {
    setSelectedExpense(expense);
    setNewEntryDescription('');
    setNewEntryAmount('0');
    setIsAddEntryDialogOpen(true);
  };

  const openDeleteEntryDialog = (entry: ExpenseEntry) => {
    setSelectedEntry(entry);
    setIsDeleteEntryDialogOpen(true);
  };

  const totals = useMemo(() => {
    const total = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const paid = expenses.reduce((sum, exp) => sum + (exp.is_paid ? (exp.amount || 0) : 0), 0);
    const unpaid = total - paid;
    const paidCount = expenses.filter((exp) => exp.is_paid).length;
    return { total, paid, unpaid, paidCount, totalCount: expenses.length };
  }, [expenses]);

  return (
    <div className="space-y-6">
      {/* Month Navigator */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={handlePrevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-xl font-semibold capitalize">
          {format(selectedMonth, 'MMMM yyyy', { locale: ro })}
        </h2>
        <Button variant="outline" size="icon" onClick={handleNextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Cheltuieli</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totals.total.toLocaleString('ro-RO')} lei</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Plătit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">{totals.paid.toLocaleString('ro-RO')} lei</p>
            <p className="text-xs text-muted-foreground">{totals.paidCount} din {totals.totalCount} plătite</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">De Plătit</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">{totals.unpaid.toLocaleString('ro-RO')} lei</p>
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Cheltuieli Lunare
            </CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Adaugă
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nu există cheltuieli pentru această lună.</p>
              <p className="text-sm">Apasă "Adaugă" pentru a adăuga o cheltuială.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expenses.map((expense) => {
                const expenseEntries = entries[expense.id] || [];
                const entriesTotal = getEntriesTotal(expense.id);
                const isExpanded = expandedExpenses.has(expense.id);
                
                return (
                  <Collapsible
                    key={expense.id}
                    open={isExpanded}
                    onOpenChange={() => handleToggleExpand(expense.id)}
                  >
                    <div
                      className={cn(
                        'rounded-lg border transition-colors',
                        expense.is_paid
                          ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800'
                          : 'bg-card border-border'
                      )}
                    >
                      <div className="flex items-center gap-2 p-3">
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              'text-sm font-medium truncate',
                              expense.is_paid && 'text-green-700 dark:text-green-400'
                            )}
                          >
                            {expense.expense_name}
                          </p>
                          {expenseEntries.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {expenseEntries.length} intrări • Total intrări: {entriesTotal.toLocaleString('ro-RO')} lei
                            </p>
                          )}
                        </div>
                        <Input
                          type="number"
                          value={editingAmounts[expense.id] ?? expense.amount}
                          onChange={(e) => handleAmountChange(expense.id, e.target.value)}
                          onBlur={() => handleAmountBlur(expense)}
                          className="w-24 text-right h-8"
                          min={0}
                        />
                        <Button
                          variant={expense.is_paid ? 'default' : 'outline'}
                          size="icon"
                          className={cn(
                            'h-8 w-8 shrink-0',
                            expense.is_paid && 'bg-green-600 hover:bg-green-700'
                          )}
                          onClick={() => handleTogglePaid(expense)}
                        >
                          {expense.is_paid ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => openAddEntryDialog(expense)}
                          title="Adaugă intrare"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => openEditDialog(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          onClick={() => openDeleteDialog(expense)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <CollapsibleContent>
                        <div className="border-t px-3 py-2 space-y-2">
                          {loadingEntries[expense.id] ? (
                            <div className="flex items-center justify-center py-4">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                            </div>
                          ) : expenseEntries.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nu există intrări adiționale. Apasă + pentru a adăuga.
                            </p>
                          ) : (
                            expenseEntries.map((entry) => (
                              <div
                                key={entry.id}
                                className={cn(
                                  'flex items-center gap-2 p-2 rounded-md bg-muted/50',
                                  entry.is_paid && 'bg-green-100/50 dark:bg-green-900/20'
                                )}
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm truncate">
                                    {entry.description || 'Fără descriere'}
                                  </p>
                                </div>
                                <Input
                                  type="number"
                                  value={editingEntryAmounts[entry.id] ?? entry.amount}
                                  onChange={(e) => handleEntryAmountChange(entry.id, e.target.value)}
                                  onBlur={() => handleEntryAmountBlur(entry)}
                                  className="w-20 text-right h-7 text-sm"
                                  min={0}
                                />
                                <Button
                                  variant={entry.is_paid ? 'default' : 'outline'}
                                  size="icon"
                                  className={cn(
                                    'h-7 w-7 shrink-0',
                                    entry.is_paid && 'bg-green-600 hover:bg-green-700'
                                  )}
                                  onClick={() => toggleEntryPaid(entry.id, entry.expense_id, !entry.is_paid)}
                                >
                                  {entry.is_paid ? (
                                    <Check className="h-3 w-3" />
                                  ) : (
                                    <X className="h-3 w-3" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 shrink-0 text-destructive hover:text-destructive"
                                  onClick={() => openDeleteEntryDialog(entry)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adaugă Cheltuială</DialogTitle>
            <DialogDescription>
              Adaugă o nouă cheltuială pentru {format(selectedMonth, 'MMMM yyyy', { locale: ro })}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="expense-name">Denumire</Label>
              <Input
                id="expense-name"
                value={newExpenseName}
                onChange={(e) => setNewExpenseName(e.target.value)}
                placeholder="Ex: Întreținere"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-amount">Sumă (lei)</Label>
              <Input
                id="expense-amount"
                type="number"
                value={newExpenseAmount}
                onChange={(e) => setNewExpenseAmount(e.target.value)}
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleAddExpense} disabled={!newExpenseName.trim()}>
              Adaugă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Expense Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifică Cheltuiala</DialogTitle>
            <DialogDescription>
              Modifică denumirea cheltuielii.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-expense-name">Denumire</Label>
              <Input
                id="edit-expense-name"
                value={editExpenseName}
                onChange={(e) => setEditExpenseName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleEditExpense} disabled={!editExpenseName.trim()}>
              Salvează
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Expense Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge Cheltuiala</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi cheltuiala "{selectedExpense?.expense_name}"? 
              Această acțiune nu poate fi anulată și va șterge și toate intrările asociate.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteExpense}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Entry Dialog */}
      <Dialog open={isAddEntryDialogOpen} onOpenChange={setIsAddEntryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adaugă Intrare</DialogTitle>
            <DialogDescription>
              Adaugă o intrare nouă pentru "{selectedExpense?.expense_name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="entry-description">Descriere</Label>
              <Input
                id="entry-description"
                value={newEntryDescription}
                onChange={(e) => setNewEntryDescription(e.target.value)}
                placeholder="Ex: Factură ianuarie"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entry-amount">Sumă (lei)</Label>
              <Input
                id="entry-amount"
                type="number"
                value={newEntryAmount}
                onChange={(e) => setNewEntryAmount(e.target.value)}
                min={0}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddEntryDialogOpen(false)}>
              Anulează
            </Button>
            <Button onClick={handleAddEntry}>
              Adaugă
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Entry Confirmation Dialog */}
      <AlertDialog open={isDeleteEntryDialogOpen} onOpenChange={setIsDeleteEntryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge Intrarea</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi această intrare? 
              Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anulează</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteEntry}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
