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
  status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'deleted';
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
  "08:00", "08:15", "08:30", "08:45",
  "09:00", "09:15", "09:30", "09:45",
  "10:00", "10:15", "10:30", "10:45",
  "11:00", "11:15", "11:30", "11:45",
  "12:00", "12:15", "12:30", "12:45",
  "13:00", "13:15", "13:30", "13:45",
  "14:00", "14:15", "14:30", "14:45",
  "15:00", "15:15", "15:30", "15:45",
  "16:00", "16:15", "16:30", "16:45",
  "17:00", "17:15", "17:30", "17:45",
  "18:00", "18:15", "18:30", "18:45",
  "19:00", "19:15", "19:30", "19:45",
  "20:00", "20:15", "20:30", "20:45",
  "21:00"
];

export const SLOT_DURATION_MINUTES = 15;

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
