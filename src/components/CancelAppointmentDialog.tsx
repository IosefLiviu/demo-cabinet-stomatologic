import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CancelAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  patientName?: string;
}

const PREDEFINED_REASONS = [
  'Pacient nu a venit',
  'Pacient a anulat telefonic',
  'Pacient a reprogramat',
  'Urgență medicală a pacientului',
  'Probleme tehnice în cabinet',
  'Medic indisponibil',
  'Altul',
];

export function CancelAppointmentDialog({
  open,
  onOpenChange,
  onConfirm,
  patientName,
}: CancelAppointmentDialogProps) {
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const finalReason = selectedReason === 'Altul' 
      ? customReason || 'Altul' 
      : selectedReason || 'Fără motiv specificat';
    
    onConfirm(finalReason);
    // Reset form
    setSelectedReason('');
    setCustomReason('');
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Anulare Programare
          </DialogTitle>
          <DialogDescription>
            {patientName 
              ? `Ești sigur că vrei să anulezi programarea pentru ${patientName}?`
              : 'Ești sigur că vrei să anulezi această programare?'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Motivul anulării</Label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Selectează motivul anulării" />
              </SelectTrigger>
              <SelectContent>
                {PREDEFINED_REASONS.map((reason) => (
                  <SelectItem key={reason} value={reason}>
                    {reason}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedReason === 'Altul' && (
            <div className="space-y-2">
              <Label htmlFor="customReason">Descriere motiv</Label>
              <Textarea
                id="customReason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Introdu motivul anulării..."
                rows={3}
              />
            </div>
          )}

          {selectedReason && selectedReason !== 'Altul' && (
            <div className="space-y-2">
              <Label htmlFor="details">Detalii suplimentare (opțional)</Label>
              <Textarea
                id="details"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Adaugă detalii suplimentare..."
                rows={2}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose}>
            Renunță
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={!selectedReason}
          >
            Confirmă Anularea
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
