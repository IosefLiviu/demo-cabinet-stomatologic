export interface Appointment {
  id: string;
  cabinetId: number;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  duration: number; // in minutes
  treatment: string;
  notes?: string;
  doctorId?: string;
  doctorName?: string;
  doctorColor?: string;
  status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
}

export interface Cabinet {
  id: number;
  name: string;
  doctor: string;
}

export const CABINETS: Cabinet[] = [
  { id: 1, name: "Cabinet 1", doctor: "Dr. Maria Popescu" },
  { id: 2, name: "Cabinet 2", doctor: "Dr. Andrei Ionescu" },
  { id: 3, name: "Cabinet 3", doctor: "Dr. Elena Dumitrescu" },
  { id: 4, name: "Cabinet 4", doctor: "Dr. Alexandru Popa" },
  { id: 5, name: "Cabinet 5", doctor: "Dr. Cristina Moldovan" },
];

export const TIME_SLOTS = [
  "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30",
  "17:00", "17:30", "18:00"
];

export const TREATMENTS = [
  "Consultație",
  "Detartraj",
  "Obturație",
  "Extracție",
  "Tratament de canal",
  "Albire dentară",
  "Implant dentar",
  "Coroană dentară",
  "Igienizare",
  "Radiografie",
  "Control periodic",
];
