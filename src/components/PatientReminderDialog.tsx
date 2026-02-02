import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';
import { CalendarIcon, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { usePatientReminders, PatientReminder } from '@/hooks/usePatientReminders';

interface PatientReminderDialogProps {
  open: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
  existingReminder?: PatientReminder | null;
}

export function PatientReminderDialog({
  open,
  onClose,
  patientId,
  patientName,
  existingReminder,
}: PatientReminderDialogProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [note, setNote] = useState('');
  const { createReminder, updateReminder } = usePatientReminders();

  useEffect(() => {
    if (existingReminder) {
      setDate(new Date(existingReminder.reminder_date));
      setNote(existingReminder.note || '');
    } else {
      setDate(undefined);
      setNote('');
    }
  }, [existingReminder, open]);

  const handleSubmit = () => {
    if (!date) return;

    const reminderDate = format(date, 'yyyy-MM-dd');

    if (existingReminder) {
      updateReminder.mutate({
        id: existingReminder.id,
        reminder_date: reminderDate,
        note: note || undefined,
      });
    } else {
      createReminder.mutate({
        patient_id: patientId,
        reminder_date: reminderDate,
        note: note || undefined,
      });
    }

    onClose();
  };

  const isSubmitting = createReminder.isPending || updateReminder.isPending;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-500" />
            {existingReminder ? 'Editează Reminder' : 'Setează Reminder Rechemare'}
          </DialogTitle>
          <DialogDescription>
            Pacient: <strong>{patientName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Data rechemare *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP', { locale: ro }) : <span>Selectează data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                  locale={ro}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Notă (opțional)</Label>
            <Textarea
              placeholder="Ex: Control la 6 luni, Continuare tratament..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Anulează
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!date || isSubmitting}
            className="gap-2"
          >
            <Bell className="h-4 w-4" />
            {isSubmitting ? 'Se salvează...' : existingReminder ? 'Actualizează' : 'Salvează'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
