import { format, addDays, subDays, setHours, setMinutes } from "date-fns";

export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled";

export interface DemoAppointment {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  cabinet_id: number;
  cabinet_name: string;
  date: string;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  treatment_names: string[];
  total_price: number;
  is_paid: boolean;
  notes: string;
}

function makeTime(baseDate: Date, hour: number, minute: number): string {
  return format(setMinutes(setHours(baseDate, hour), minute), "HH:mm");
}

function makeDate(baseDate: Date): string {
  return format(baseDate, "yyyy-MM-dd");
}

export function generateDemoAppointments(): DemoAppointment[] {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);

  return [
    {
      id: "apt-1", patient_id: "pat-1", patient_name: "Ion Gheorghescu",
      doctor_id: "doc-1", doctor_name: "Dr. Maria Popescu",
      cabinet_id: 1, cabinet_name: "Cabinet 1",
      date: makeDate(yesterday), start_time: makeTime(yesterday, 9, 0), end_time: makeTime(yesterday, 9, 30),
      status: "completed", treatment_names: ["Consultație"], total_price: 100, is_paid: true, notes: "Control periodic",
    },
    {
      id: "apt-2", patient_id: "pat-2", patient_name: "Ana Marinescu",
      doctor_id: "doc-1", doctor_name: "Dr. Maria Popescu",
      cabinet_id: 1, cabinet_name: "Cabinet 1",
      date: makeDate(yesterday), start_time: makeTime(yesterday, 10, 0), end_time: makeTime(yesterday, 10, 45),
      status: "completed", treatment_names: ["Detartraj"], total_price: 200, is_paid: true, notes: "",
    },
    {
      id: "apt-3", patient_id: "pat-3", patient_name: "Mihai Popa",
      doctor_id: "doc-2", doctor_name: "Dr. Andrei Ionescu",
      cabinet_id: 2, cabinet_name: "Cabinet 2",
      date: makeDate(yesterday), start_time: makeTime(yesterday, 11, 0), end_time: makeTime(yesterday, 12, 0),
      status: "completed", treatment_names: ["Tratament de Canal"], total_price: 500, is_paid: false, notes: "Ședința 2 din 3",
    },
    {
      id: "apt-4", patient_id: "pat-4", patient_name: "Elena Vasilescu",
      doctor_id: "doc-1", doctor_name: "Dr. Maria Popescu",
      cabinet_id: 1, cabinet_name: "Cabinet 1",
      date: makeDate(today), start_time: makeTime(today, 9, 0), end_time: makeTime(today, 9, 30),
      status: "confirmed", treatment_names: ["Consultație"], total_price: 100, is_paid: false, notes: "Prima vizită",
    },
    {
      id: "apt-5", patient_id: "pat-5", patient_name: "Alexandru Stancu",
      doctor_id: "doc-1", doctor_name: "Dr. Maria Popescu",
      cabinet_id: 1, cabinet_name: "Cabinet 1",
      date: makeDate(today), start_time: makeTime(today, 10, 0), end_time: makeTime(today, 10, 45),
      status: "scheduled", treatment_names: ["Obturație Compozit"], total_price: 250, is_paid: false, notes: "Dinte 36",
    },
    {
      id: "apt-6", patient_id: "pat-6", patient_name: "Cristina Radu",
      doctor_id: "doc-2", doctor_name: "Dr. Andrei Ionescu",
      cabinet_id: 2, cabinet_name: "Cabinet 2",
      date: makeDate(today), start_time: makeTime(today, 9, 30), end_time: makeTime(today, 11, 0),
      status: "confirmed", treatment_names: ["Aparat Dentar Fix"], total_price: 4000, is_paid: false, notes: "Instalare aparat - arcada superioară",
    },
    {
      id: "apt-7", patient_id: "pat-7", patient_name: "Vasile Dobre",
      doctor_id: "doc-3", doctor_name: "Dr. Elena Dumitrescu",
      cabinet_id: 3, cabinet_name: "Cabinet 3",
      date: makeDate(today), start_time: makeTime(today, 11, 0), end_time: makeTime(today, 12, 0),
      status: "scheduled", treatment_names: ["Tratament de Canal"], total_price: 500, is_paid: false, notes: "Molar 46 - pulpită",
    },
    {
      id: "apt-8", patient_id: "pat-8", patient_name: "Maria Tudor",
      doctor_id: "doc-1", doctor_name: "Dr. Maria Popescu",
      cabinet_id: 1, cabinet_name: "Cabinet 1",
      date: makeDate(today), start_time: makeTime(today, 13, 0), end_time: makeTime(today, 14, 30),
      status: "scheduled", treatment_names: ["Albire Dentară"], total_price: 800, is_paid: false, notes: "",
    },
    {
      id: "apt-9", patient_id: "pat-1", patient_name: "Ion Gheorghescu",
      doctor_id: "doc-2", doctor_name: "Dr. Andrei Ionescu",
      cabinet_id: 2, cabinet_name: "Cabinet 2",
      date: makeDate(today), start_time: makeTime(today, 14, 0), end_time: makeTime(today, 14, 45),
      status: "scheduled", treatment_names: ["Detartraj", "Periaj Profesional"], total_price: 350, is_paid: false, notes: "Igienizare completă",
    },
    {
      id: "apt-10", patient_id: "pat-2", patient_name: "Ana Marinescu",
      doctor_id: "doc-1", doctor_name: "Dr. Maria Popescu",
      cabinet_id: 1, cabinet_name: "Cabinet 1",
      date: makeDate(tomorrow), start_time: makeTime(tomorrow, 9, 0), end_time: makeTime(tomorrow, 10, 0),
      status: "scheduled", treatment_names: ["Coroană Zirconiu"], total_price: 1500, is_paid: false, notes: "Amprentă finală",
    },
    {
      id: "apt-11", patient_id: "pat-3", patient_name: "Mihai Popa",
      doctor_id: "doc-3", doctor_name: "Dr. Elena Dumitrescu",
      cabinet_id: 3, cabinet_name: "Cabinet 3",
      date: makeDate(tomorrow), start_time: makeTime(tomorrow, 10, 0), end_time: makeTime(tomorrow, 11, 0),
      status: "scheduled", treatment_names: ["Tratament de Canal"], total_price: 500, is_paid: false, notes: "Ședința 3 din 3 - obturat canal",
    },
    {
      id: "apt-12", patient_id: "pat-5", patient_name: "Alexandru Stancu",
      doctor_id: "doc-1", doctor_name: "Dr. Maria Popescu",
      cabinet_id: 1, cabinet_name: "Cabinet 1",
      date: makeDate(tomorrow), start_time: makeTime(tomorrow, 11, 0), end_time: makeTime(tomorrow, 13, 0),
      status: "scheduled", treatment_names: ["Implant Dentar"], total_price: 3000, is_paid: false, notes: "Implant zona 46",
    },
    {
      id: "apt-13", patient_id: "pat-4", patient_name: "Elena Vasilescu",
      doctor_id: "doc-2", doctor_name: "Dr. Andrei Ionescu",
      cabinet_id: 2, cabinet_name: "Cabinet 2",
      date: makeDate(dayAfter), start_time: makeTime(dayAfter, 9, 0), end_time: makeTime(dayAfter, 9, 45),
      status: "scheduled", treatment_names: ["Obturație Compozit"], total_price: 250, is_paid: false, notes: "",
    },
    {
      id: "apt-14", patient_id: "pat-7", patient_name: "Vasile Dobre",
      doctor_id: "doc-1", doctor_name: "Dr. Maria Popescu",
      cabinet_id: 1, cabinet_name: "Cabinet 1",
      date: makeDate(dayAfter), start_time: makeTime(dayAfter, 10, 0), end_time: makeTime(dayAfter, 11, 30),
      status: "scheduled", treatment_names: ["Fatete Dentare"], total_price: 2000, is_paid: false, notes: "2 fațete - dinții 11, 21",
    },
  ];
}
