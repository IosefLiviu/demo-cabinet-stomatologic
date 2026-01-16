import { useState } from 'react';
import { format } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CABINETS, TIME_SLOTS, TREATMENTS, Appointment } from '@/types/appointment';

interface AppointmentFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (appointment: Omit<Appointment, 'id'>) => void;
  selectedDate: Date;
  selectedTime?: string;
  selectedCabinet?: number;
  editingAppointment?: Appointment;
}

export function AppointmentForm({
  open,
  onClose,
  onSubmit,
  selectedDate,
  selectedTime,
  selectedCabinet,
  editingAppointment,
}: AppointmentFormProps) {
  const [formData, setFormData] = useState({
    patientName: editingAppointment?.patientName || '',
    patientPhone: editingAppointment?.patientPhone || '',
    cabinetId: editingAppointment?.cabinetId || selectedCabinet || 1,
    time: editingAppointment?.time || selectedTime || TIME_SLOTS[0],
    duration: editingAppointment?.duration || 30,
    treatment: editingAppointment?.treatment || TREATMENTS[0],
    notes: editingAppointment?.notes || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      date: format(selectedDate, 'yyyy-MM-dd'),
    });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {editingAppointment ? 'Editare programare' : 'Programare nouă'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="patientName">Nume pacient *</Label>
              <Input
                id="patientName"
                value={formData.patientName}
                onChange={(e) =>
                  setFormData({ ...formData, patientName: e.target.value })
                }
                placeholder="Introduceți numele"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientPhone">Telefon *</Label>
              <Input
                id="patientPhone"
                value={formData.patientPhone}
                onChange={(e) =>
                  setFormData({ ...formData, patientPhone: e.target.value })
                }
                placeholder="07xx xxx xxx"
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="cabinet">Cabinet *</Label>
              <Select
                value={String(formData.cabinetId)}
                onValueChange={(value) =>
                  setFormData({ ...formData, cabinetId: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CABINETS.map((cabinet) => (
                    <SelectItem key={cabinet.id} value={String(cabinet.id)}>
                      {cabinet.name} - {cabinet.doctor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Ora *</Label>
              <Select
                value={formData.time}
                onValueChange={(value) =>
                  setFormData({ ...formData, time: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="treatment">Tratament *</Label>
              <Select
                value={formData.treatment}
                onValueChange={(value) =>
                  setFormData({ ...formData, treatment: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TREATMENTS.map((treatment) => (
                    <SelectItem key={treatment} value={treatment}>
                      {treatment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Durată (minute) *</Label>
              <Select
                value={String(formData.duration)}
                onValueChange={(value) =>
                  setFormData({ ...formData, duration: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 min</SelectItem>
                  <SelectItem value="30">30 min</SelectItem>
                  <SelectItem value="45">45 min</SelectItem>
                  <SelectItem value="60">60 min</SelectItem>
                  <SelectItem value="90">90 min</SelectItem>
                  <SelectItem value="120">120 min</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observații</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Note adiționale..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Anulează
            </Button>
            <Button type="submit">
              {editingAppointment ? 'Salvează' : 'Adaugă programare'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
