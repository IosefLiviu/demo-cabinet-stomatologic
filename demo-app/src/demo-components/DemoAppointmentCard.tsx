import React from "react";
import { DemoAppointment } from "../demo-data/appointments";
import { Clock, User, Stethoscope, CheckCircle, XCircle, Calendar } from "lucide-react";
import { cn } from "../lib/utils";

interface Props {
  appointment: DemoAppointment;
  onStatusChange?: (id: string, status: DemoAppointment["status"]) => void;
}

const STATUS_CONFIG = {
  scheduled: { label: "Programat", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200", dot: "bg-blue-500" },
  confirmed: { label: "Confirmat", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", dot: "bg-green-500" },
  completed: { label: "Finalizat", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200", dot: "bg-gray-500" },
  cancelled: { label: "Anulat", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200", dot: "bg-red-500" },
};

const CABINET_COLORS: Record<number, string> = {
  1: "border-l-cabinet-1",
  2: "border-l-cabinet-2",
  3: "border-l-cabinet-3",
};

export function DemoAppointmentCard({ appointment, onStatusChange }: Props) {
  const status = STATUS_CONFIG[appointment.status];

  return (
    <div
      className={cn(
        "bg-card rounded-lg border p-4 border-l-4 hover:shadow-md transition-shadow",
        CABINET_COLORS[appointment.cabinet_id] || "border-l-primary"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold text-card-foreground truncate">{appointment.patient_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{appointment.start_time} - {appointment.end_time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Stethoscope className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{appointment.doctor_name}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{appointment.cabinet_name}</span>
          </div>
          {appointment.treatment_names.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {appointment.treatment_names.map((t) => (
                <span key={t} className="inline-block px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs">
                  {t}
                </span>
              ))}
            </div>
          )}
          {appointment.notes && (
            <p className="mt-1.5 text-xs text-muted-foreground italic">{appointment.notes}</p>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <span className={cn("inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium", status.color)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", status.dot)} />
            {status.label}
          </span>
          <span className="text-sm font-semibold text-card-foreground">{appointment.total_price} RON</span>
          {appointment.is_paid && (
            <span className="text-xs text-success flex items-center gap-1">
              <CheckCircle className="h-3 w-3" /> Plătit
            </span>
          )}

          {onStatusChange && appointment.status !== "completed" && appointment.status !== "cancelled" && (
            <div className="flex gap-1 mt-1">
              <button
                onClick={() => onStatusChange(appointment.id, "completed")}
                className="p-1.5 rounded bg-success/10 text-success hover:bg-success/20 transition-colors"
                title="Finalizează"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
              <button
                onClick={() => onStatusChange(appointment.id, "cancelled")}
                className="p-1.5 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                title="Anulează"
              >
                <XCircle className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
