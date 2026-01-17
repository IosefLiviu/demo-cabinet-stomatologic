import { useState } from 'react';
import { CreditCard, Banknote, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type PaymentMethod = 'card' | 'cash' | 'unpaid';

interface CompleteAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (paymentMethod: PaymentMethod) => void;
  patientName?: string;
  isLoading?: boolean;
}

const paymentOptions: { value: PaymentMethod; label: string; icon: React.ReactNode; color: string }[] = [
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
  isLoading,
}: CompleteAppointmentDialogProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);

  const handleConfirm = () => {
    if (selectedMethod) {
      onConfirm(selectedMethod);
      setSelectedMethod(null);
    }
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setSelectedMethod(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizare programare</DialogTitle>
          <DialogDescription>
            {patientName ? (
              <>Finalizați programarea pentru <span className="font-medium text-foreground">{patientName}</span>. Selectați metoda de plată:</>
            ) : (
              'Selectați metoda de plată pentru această programare:'
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-4">
          {paymentOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedMethod(option.value)}
              disabled={isLoading}
              className={cn(
                "flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all",
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
                "text-sm font-medium",
                selectedMethod === option.value ? "text-current" : "text-foreground"
              )}>
                {option.label}
              </span>
            </button>
          ))}
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
            disabled={!selectedMethod || isLoading}
          >
            {isLoading ? 'Se procesează...' : 'Confirmă'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
