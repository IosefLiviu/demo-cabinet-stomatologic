import { useState, useEffect } from 'react';
import { CreditCard, Banknote, AlertCircle, Split } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'card' | 'cash' | 'unpaid' | 'partial_card' | 'partial_cash';

export interface PaymentData {
  method: PaymentMethod;
  paidAmount?: number;
  totalAmount?: number;
}

interface CompleteAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (paymentData: PaymentData) => void;
  patientName?: string;
  totalPrice?: number;
  payableAmount?: number;
  isLoading?: boolean;
}

const paymentOptions: { value: PaymentMethod; label: string; icon: React.ReactNode; color: string; isPartial?: boolean }[] = [
  {
    value: 'card',
    label: 'Card',
    icon: <CreditCard className="h-6 w-6" />,
    color: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  {
    value: 'cash',
    label: 'Cash',
    icon: <Banknote className="h-6 w-6" />,
    color: 'bg-green-500 hover:bg-green-600 text-white',
  },
  {
    value: 'partial_card',
    label: 'Parțial Card',
    icon: <Split className="h-6 w-6" />,
    color: 'bg-cyan-500 hover:bg-cyan-600 text-white',
    isPartial: true,
  },
  {
    value: 'partial_cash',
    label: 'Parțial Cash',
    icon: <Split className="h-6 w-6" />,
    color: 'bg-teal-500 hover:bg-teal-600 text-white',
    isPartial: true,
  },
  {
    value: 'unpaid',
    label: 'Neachitat',
    icon: <AlertCircle className="h-6 w-6" />,
    color: 'bg-orange-500 hover:bg-orange-600 text-white',
  },
];

export function CompleteAppointmentDialog({
  open,
  onOpenChange,
  onConfirm,
  patientName,
  totalPrice = 0,
  payableAmount,
  isLoading,
}: CompleteAppointmentDialogProps) {
  // Use payableAmount if provided, otherwise use totalPrice
  const amountToPay = payableAmount !== undefined ? payableAmount : totalPrice;
  const hasCasDiscount = payableAmount !== undefined && payableAmount < totalPrice;
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [paidAmount, setPaidAmount] = useState<string>('');
  const [showPartialInput, setShowPartialInput] = useState(false);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedMethod(null);
      setPaidAmount('');
      setShowPartialInput(false);
    }
  }, [open]);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    const option = paymentOptions.find(o => o.value === method);
    if (option?.isPartial) {
      setShowPartialInput(true);
      setPaidAmount('');
    } else {
      setShowPartialInput(false);
      setPaidAmount('');
    }
  };

  const handleConfirm = () => {
    if (selectedMethod) {
      const isPartial = selectedMethod.startsWith('partial_');
      const paymentData: PaymentData = {
        method: selectedMethod,
        totalAmount: totalPrice,
      };
      
      if (isPartial && paidAmount) {
        paymentData.paidAmount = parseFloat(paidAmount);
      } else if (!isPartial && selectedMethod !== 'unpaid') {
        // Use amountToPay (which is payableAmount if CAS applied, otherwise totalPrice)
        paymentData.paidAmount = amountToPay;
      } else {
        paymentData.paidAmount = 0;
      }
      
      onConfirm(paymentData);
      setSelectedMethod(null);
      setPaidAmount('');
      setShowPartialInput(false);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedMethod(null);
      setPaidAmount('');
      setShowPartialInput(false);
    }
    onOpenChange(open);
  };

  const isPartialValid = () => {
    if (!showPartialInput) return true;
    const amount = parseFloat(paidAmount);
    return !isNaN(amount) && amount > 0 && amount < amountToPay;
  };

  const remainingAmount = showPartialInput && paidAmount 
    ? amountToPay - parseFloat(paidAmount || '0')
    : 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Finalizare programare</DialogTitle>
          <DialogDescription>
            {patientName ? (
              <>Finalizați programarea pentru <span className="font-medium text-foreground">{patientName}</span>.</>
            ) : (
              'Finalizați această programare.'
            )}
            {amountToPay > 0 && (
              <div className="mt-2 space-y-1">
                {hasCasDiscount && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Preț total:</span>
                    <span className="line-through text-muted-foreground">{totalPrice.toLocaleString()} RON</span>
                    <span className="text-green-600 font-medium">(-{(totalPrice - amountToPay).toLocaleString()} CAS)</span>
                  </div>
                )}
                <span className="block text-lg font-semibold text-foreground">
                  De plată: {amountToPay.toLocaleString()} RON
                </span>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Payment method grid */}
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {paymentOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleMethodSelect(option.value)}
                disabled={isLoading}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center",
                  selectedMethod === option.value
                    ? `${option.color} border-transparent shadow-lg scale-105`
                    : "bg-muted/50 border-border hover:border-primary/50 hover:bg-muted"
                )}
              >
                <div className={cn(
                  selectedMethod === option.value ? "text-current" : "text-muted-foreground"
                )}>
                  {option.icon}
                </div>
                <span className={cn(
                  "text-xs font-medium leading-tight",
                  selectedMethod === option.value ? "text-current" : "text-foreground"
                )}>
                  {option.label}
                </span>
              </button>
            ))}
          </div>

          {/* Partial payment input */}
          {showPartialInput && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
              <div className="space-y-2">
                <Label htmlFor="paidAmount">Suma achitată (RON)</Label>
                <Input
                  id="paidAmount"
                  type="number"
                  placeholder="Introduceți suma achitată"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                    min={0}
                    max={amountToPay - 1}
                  step={0.01}
                  className="text-lg"
                />
              </div>
              
              {paidAmount && parseFloat(paidAmount) > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Rest de plată:</span>
                  <span className={cn(
                    "font-semibold",
                    remainingAmount > 0 ? "text-orange-600" : "text-green-600"
                  )}>
                    {remainingAmount.toLocaleString()} RON
                  </span>
                </div>
              )}
              
              {paidAmount && parseFloat(paidAmount) >= amountToPay && (
                <p className="text-sm text-destructive">
                  Suma achitată trebuie să fie mai mică decât suma de plată. Pentru plată integrală, selectați Card sau Cash.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isLoading}
          >
            Anulează
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedMethod || isLoading || !isPartialValid()}
          >
            {isLoading ? 'Se procesează...' : 'Confirmă'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
