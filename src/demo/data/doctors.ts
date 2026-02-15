export interface DemoDoctor {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  color: string;
  is_active: boolean;
}

export const DEMO_DOCTORS: DemoDoctor[] = [
  {
    id: "doc-1",
    name: "Dr. Maria Popescu",
    specialization: "Stomatologie Generală",
    phone: "0721 000 001",
    email: "maria.popescu@demo.ro",
    color: "#7a4a2a",
    is_active: true,
  },
  {
    id: "doc-2",
    name: "Dr. Andrei Ionescu",
    specialization: "Ortodonție",
    phone: "0721 000 002",
    email: "andrei.ionescu@demo.ro",
    color: "#0284c7",
    is_active: true,
  },
  {
    id: "doc-3",
    name: "Dr. Elena Dumitrescu",
    specialization: "Endodonție",
    phone: "0721 000 003",
    email: "elena.dumitrescu@demo.ro",
    color: "#7c3aed",
    is_active: true,
  },
];
