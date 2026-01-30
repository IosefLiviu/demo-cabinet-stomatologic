import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EditPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (paidAmount: number) => void;
  patientName?: string;
  totalPrice: number;
  currentPaidAmount: number;
  isLoading?: boolean;
}

export function EditPaymentDialog({
  open,
  onOpenChange,
  onConfirm,
  patientName,
  totalPrice,
  currentPaidAmount,
  isLoading,
}: EditPaymentDialogProps) {
  const [paidAmount, setPaidAmount] = useState<string>('');

  useEffect(() => {
    if (open) {
      setPaidAmount(currentPaidAmount.toString());
    }
  }, [open, currentPaidAmount]);

  const handleConfirm = () => {
    const amount = parseFloat(paidAmount) || 0;
    onConfirm(amount);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setPaidAmount('');
    }
    onOpenChange(open);
  };

  const remainingAmount = totalPrice - (parseFloat(paidAmount) || 0);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editare sumă achitată</DialogTitle>
          <DialogDescription>
            {patientName ? (
              <>Modificați suma achitată pentru <span className="font-medium text-foreground">{patientName}</span>.</>
            ) : (
              'Modificați suma achitată pentru această programare.'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Preț total:</span>
            <span className="font-semibold">{totalPrice.toLocaleString()} RON</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paidAmount">Sumă achitată (RON)</Label>
            <Input
              id="paidAmount"
              type="number"
              placeholder="Introduceți suma achitată"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              min={0}
              max={totalPrice}
              step={0.01}
              className="text-lg"
            />
          </div>

          {parseFloat(paidAmount) >= 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rest de plată:</span>
              <span className={remainingAmount > 0 ? "font-semibold text-orange-600" : "font-semibold text-green-600"}>
                {remainingAmount.toLocaleString()} RON
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isLoading}
          >
            Anulează
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Se salvează...' : 'Salvează'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
