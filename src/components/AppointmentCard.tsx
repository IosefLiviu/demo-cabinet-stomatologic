import { Phone, Clock, FileText, Trash2, Edit } from 'lucide-react';
import { Appointment, CABINETS } from '@/types/appointment';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  showCabinet?: boolean;
}

const cabinetBgColors: Record<number, string> = {
  1: 'bg-cabinet-1/10 border-cabinet-1/30 hover:bg-cabinet-1/15',
  2: 'bg-cabinet-2/10 border-cabinet-2/30 hover:bg-cabinet-2/15',
  3: 'bg-cabinet-3/10 border-cabinet-3/30 hover:bg-cabinet-3/15',
  4: 'bg-cabinet-4/10 border-cabinet-4/30 hover:bg-cabinet-4/15',
  5: 'bg-cabinet-5/10 border-cabinet-5/30 hover:bg-cabinet-5/15',
};

const cabinetTextColors: Record<number, string> = {
  1: 'text-cabinet-1',
  2: 'text-cabinet-2',
  3: 'text-cabinet-3',
  4: 'text-cabinet-4',
  5: 'text-cabinet-5',
};

export function AppointmentCard({
  appointment,
  onEdit,
  onDelete,
  showCabinet = true,
}: AppointmentCardProps) {
  const cabinet = CABINETS.find((c) => c.id === appointment.cabinetId);

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all",
        cabinetBgColors[appointment.cabinetId]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-xs font-semibold", cabinetTextColors[appointment.cabinetId])}>
              {appointment.time}
            </span>
            <span className="text-xs text-muted-foreground">• {appointment.duration} min</span>
          </div>
          <h4 className="font-semibold text-foreground truncate">
            {appointment.patientName}
          </h4>
          <p className="text-sm text-muted-foreground">{appointment.treatment}</p>
          {showCabinet && cabinet && (
            <p className="text-xs text-muted-foreground mt-1">
              {cabinet.name} - {cabinet.doctor}
            </p>
          )}
          <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span>{appointment.patientPhone}</span>
          </div>
          {appointment.notes && (
            <div className="flex items-start gap-1 mt-1 text-xs text-muted-foreground">
              <FileText className="h-3 w-3 mt-0.5" />
              <span className="line-clamp-2">{appointment.notes}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => onEdit(appointment)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ștergeți programarea?</AlertDialogTitle>
                <AlertDialogDescription>
                  Această acțiune nu poate fi anulată. Programarea pentru {appointment.patientName} 
                  la ora {appointment.time} va fi ștearsă definitiv.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Anulează</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(appointment.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Șterge
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
