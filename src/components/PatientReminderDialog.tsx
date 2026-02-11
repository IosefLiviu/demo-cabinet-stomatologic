import { useState, useEffect } from 'react';
import { format, addMonths } from 'date-fns';
import { ro } from 'date-fns/locale';
import { CalendarIcon, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { usePatientReminders, PatientReminder } from '@/hooks/usePatientReminders';
import { useDoctors } from '@/hooks/useDoctors';

const RECALL_TYPES = [
  { id: 'control', label: 'Control' },
  { id: 'profilaxie', label: 'Profilaxie' },
  { id: 'control_aparat', label: 'Control aparat' },
];

const MONTHS_OPTIONS = [1, 2, 3, 4, 5, 6, 9, 12, 18, 24];

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
  const [recallTypes, setRecallTypes] = useState<string[]>([]);
  const [doctorId, setDoctorId] = useState<string>('');
  const [monthsAhead, setMonthsAhead] = useState<string>('');
  const { createReminder, updateReminder } = usePatientReminders();
  const { doctors } = useDoctors();

  const activeDoctors = doctors.filter((d) => d.is_active);

  useEffect(() => {
    if (existingReminder) {
      setDate(new Date(existingReminder.reminder_date));
      setNote(existingReminder.note || '');
      setRecallTypes(existingReminder.recall_type || []);
      setDoctorId(existingReminder.doctor_id || '');
      setMonthsAhead('');
    } else {
      setDate(undefined);
      setNote('');
      setRecallTypes([]);
      setDoctorId('');
      setMonthsAhead('');
    }
  }, [existingReminder, open]);

  const handleToggleRecallType = (typeId: string) => {
    setRecallTypes((prev) =>
      prev.includes(typeId) ? prev.filter((t) => t !== typeId) : [...prev, typeId]
    );
  };

  const handleMonthsChange = (value: string) => {
    setMonthsAhead(value);
    const months = parseInt(value);
    if (!isNaN(months)) {
      setDate(addMonths(new Date(), months));
    }
  };

  const handleSubmit = () => {
    if (!date) return;

    const reminderDate = format(date, 'yyyy-MM-dd');

    if (existingReminder) {
      updateReminder.mutate({
        id: existingReminder.id,
        reminder_date: reminderDate,
        note: note || undefined,
        recall_type: recallTypes,
        doctor_id: doctorId || null,
      });
    } else {
      createReminder.mutate({
        patient_id: patientId,
        reminder_date: reminderDate,
        note: note || undefined,
        recall_type: recallTypes,
        doctor_id: doctorId || undefined,
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
            {existingReminder ? 'Editează Reminder' : 'Creare Reminder'}
          </DialogTitle>
          <DialogDescription>
            Pacient: <strong>{patientName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Recall Type */}
          <div className="space-y-2">
            <Label>Recall</Label>
            <div className="flex flex-wrap gap-4">
              {RECALL_TYPES.map((type) => (
                <div key={type.id} className="flex items-center gap-2">
                  <Checkbox
                    id={`recall-${type.id}`}
                    checked={recallTypes.includes(type.id)}
                    onCheckedChange={() => handleToggleRecallType(type.id)}
                  />
                  <label
                    htmlFor={`recall-${type.id}`}
                    className="text-sm cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <Textarea
              placeholder="Notă (opțional)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
            />
          </div>

          {/* Doctor */}
          <div className="space-y-2">
            <Label>La cine?</Label>
            <Select value={doctorId} onValueChange={setDoctorId}>
              <SelectTrigger>
                <SelectValue placeholder="Selectează doctorul" />
              </SelectTrigger>
              <SelectContent>
                {activeDoctors.map((doc) => (
                  <SelectItem key={doc.id} value={doc.id}>
                    {doc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + peste X luni */}
          <div className="space-y-2">
            <Label>Dată</Label>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, 'dd.MM.yyyy', { locale: ro }) : <span>Selectează data</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(d) => {
                      setDate(d);
                      setMonthsAhead('');
                    }}
                    initialFocus
                    className="pointer-events-auto"
                    locale={ro}
                  />
                </PopoverContent>
              </Popover>

              <span className="text-sm text-muted-foreground whitespace-nowrap">peste</span>
              <Select value={monthsAhead} onValueChange={handleMonthsChange}>
                <SelectTrigger className="w-20">
                  <SelectValue placeholder="-" />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS_OPTIONS.map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">luni</span>
            </div>
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
