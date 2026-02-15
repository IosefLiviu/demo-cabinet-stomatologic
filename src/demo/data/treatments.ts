export interface DemoTreatment {
  id: string;
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
}

export const DEMO_TREATMENTS: DemoTreatment[] = [
  { id: "trt-1", name: "Consultație", category: "General", price: 100, duration_minutes: 30 },
  { id: "trt-2", name: "Detartraj", category: "Profilaxie", price: 200, duration_minutes: 45 },
  { id: "trt-3", name: "Obturație Compozit", category: "Odontoterapie", price: 250, duration_minutes: 45 },
  { id: "trt-4", name: "Extracție Simplă", category: "Chirurgie", price: 150, duration_minutes: 30 },
  { id: "trt-5", name: "Tratament de Canal", category: "Endodonție", price: 500, duration_minutes: 60 },
  { id: "trt-6", name: "Coroană Zirconiu", category: "Protetică", price: 1500, duration_minutes: 60 },
  { id: "trt-7", name: "Albire Dentară", category: "Estetică", price: 800, duration_minutes: 90 },
  { id: "trt-8", name: "Implant Dentar", category: "Implantologie", price: 3000, duration_minutes: 120 },
  { id: "trt-9", name: "Aparat Dentar Fix", category: "Ortodonție", price: 4000, duration_minutes: 90 },
  { id: "trt-10", name: "Radiografie Panoramică", category: "Diagnostic", price: 80, duration_minutes: 15 },
  { id: "trt-11", name: "Periaj Profesional", category: "Profilaxie", price: 150, duration_minutes: 30 },
  { id: "trt-12", name: "Fatete Dentare", category: "Estetică", price: 2000, duration_minutes: 60 },
];
