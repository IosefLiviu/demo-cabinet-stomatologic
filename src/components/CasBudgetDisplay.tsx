import { useState } from 'react';
import { Wallet, Edit2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useCasBudget } from '@/hooks/useCasBudget';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

export function CasBudgetDisplay() {
  const { remainingBudget, initialBudget, usedBudget, setMonthlyBudget, loading } = useCasBudget();
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: ro });
  
  const handleSave = async () => {
    const amount = parseFloat(editValue);
    if (!isNaN(amount) && amount >= 0) {
      await setMonthlyBudget(amount);
      setIsEditing(false);
      setEditValue('');
    }
  };

  const handleStartEdit = () => {
    setEditValue(initialBudget.toString());
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue('');
  };

  const percentageUsed = initialBudget > 0 ? (usedBudget / initialBudget) * 100 : 0;
  const isLow = percentageUsed > 80;
  const isDepleted = remainingBudget <= 0 && initialBudget > 0;

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50 animate-pulse">
        <div className="h-4 w-20 bg-muted rounded" />
      </div>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "gap-2 font-medium",
            isDepleted && "text-destructive",
            isLow && !isDepleted && "text-orange-600",
            !isLow && !isDepleted && "text-green-600"
          )}
        >
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">Buget CAS:</span>
          <span>{remainingBudget.toFixed(2)} lei</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Buget CAS - {currentMonth}</h4>
            {!isEditing && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleStartEdit}>
                <Edit2 className="h-3 w-3" />
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Buget lunar"
                className="h-8"
                autoFocus
              />
              <Button size="icon" className="h-8 w-8" onClick={handleSave}>
                <Check className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Buget inițial:</span>
                <span className="font-medium">{initialBudget.toFixed(2)} lei</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Utilizat:</span>
                <span className="font-medium text-orange-600">-{usedBudget.toFixed(2)} lei</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between text-sm font-semibold">
                <span>Disponibil:</span>
                <span className={cn(
                  isDepleted && "text-destructive",
                  isLow && !isDepleted && "text-orange-600",
                  !isLow && !isDepleted && "text-green-600"
                )}>
                  {remainingBudget.toFixed(2)} lei
                </span>
              </div>
              
              {initialBudget > 0 && (
                <div className="pt-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all",
                        isDepleted && "bg-destructive",
                        isLow && !isDepleted && "bg-orange-500",
                        !isLow && !isDepleted && "bg-green-500"
                      )}
                      style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {percentageUsed.toFixed(1)}% utilizat
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
