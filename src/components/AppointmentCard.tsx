import { Phone, Clock, FileText, Trash2, Edit, CheckCircle2 } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AppointmentCardProps {
  appointment: Appointment;
  onEdit: (appointment: Appointment) => void;
  onDelete: (id: string) => void;
  onComplete?: (id: string) => void;
  showCabinet?: boolean;
  isCompleted?: boolean;
  canDeleteCompleted?: boolean;
  isAdmin?: boolean;
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
  onComplete,
  showCabinet = true,
  isCompleted = false,
  canDeleteCompleted = false,
  isAdmin = false,
}: AppointmentCardProps) {
  const cabinet = CABINETS.find((c) => c.id === appointment.cabinetId);

  // Use doctor color if available, otherwise fall back to cabinet colors
  const hasDoctorColor = appointment.doctorColor;
  
  const cardStyle = hasDoctorColor 
    ? { 
        backgroundColor: `${appointment.doctorColor}15`, 
        borderColor: `${appointment.doctorColor}40`,
      }
    : undefined;

  const textColorStyle = hasDoctorColor 
    ? { color: appointment.doctorColor }
    : undefined;

  // Style for completed appointments - use green
  const completedStyle = isCompleted ? {
    backgroundColor: 'rgb(240 253 244)', // green-50
    borderColor: 'rgb(134 239 172)', // green-300
  } : undefined;

  // For non-completed: use doctor color if available
  const activeCardStyle = !isCompleted && hasDoctorColor 
    ? { 
        backgroundColor: `${appointment.doctorColor}15`, 
        borderColor: `${appointment.doctorColor}40`,
      }
    : undefined;

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all hover:shadow-md",
        !isCompleted && !hasDoctorColor && cabinetBgColors[appointment.cabinetId],
        isCompleted && "opacity-60 dark:bg-green-950/20 dark:border-green-800"
      )}
      style={isCompleted ? completedStyle : activeCardStyle}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span 
              className={cn("text-base font-bold", !hasDoctorColor && cabinetTextColors[appointment.cabinetId])}
              style={textColorStyle}
            >
              {appointment.time}
            </span>
            <span className="text-base font-medium text-muted-foreground">• {appointment.duration} min</span>
            {appointment.doctorName && (
              <span 
                className="text-base font-semibold px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: `${appointment.doctorColor}20`,
                  color: appointment.doctorColor 
                }}
              >
                {appointment.doctorName}
              </span>
            )}
          </div>
          <h4 className="text-lg font-bold text-foreground truncate">
            {appointment.patientName}
          </h4>
          <p className="text-base font-medium text-muted-foreground">{appointment.treatment}</p>
          {showCabinet && cabinet && (
            <p className="text-base font-medium text-muted-foreground mt-1">
              {cabinet.name}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2 text-base font-medium text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{appointment.patientPhone}</span>
          </div>
          {appointment.notes && (
            <div className="flex items-start gap-1.5 mt-1 text-base font-medium text-muted-foreground">
              <FileText className="h-4 w-4 mt-0.5" />
              <span className="line-clamp-2">{appointment.notes}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          {isCompleted ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="h-10 w-10 flex items-center justify-center text-green-600">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Finalizată</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : onComplete && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-green-600 hover:text-green-700 hover:bg-green-100"
                    onClick={() => onComplete(appointment.id)}
                  >
                    <CheckCircle2 className="h-6 w-6" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Marchează ca finalizată</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => onEdit(appointment)}
          >
            <Edit className="h-6 w-6" />
          </Button>
          {isAdmin && (!isCompleted || canDeleteCompleted) && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:text-destructive">
                  <Trash2 className="h-6 w-6" />
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
          )}
        </div>
      </div>
    </div>
  );
}
