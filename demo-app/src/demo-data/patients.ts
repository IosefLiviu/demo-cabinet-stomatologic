export interface DemoPatient {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  birth_date: string;
  gender: string;
  cnp: string;
  address: string;
  allergies: string[];
  medical_notes: string;
  created_at: string;
}

export const DEMO_PATIENTS: DemoPatient[] = [
  {
    id: "pat-1",
    first_name: "Ion",
    last_name: "Gheorghescu",
    phone: "0722 111 001",
    email: "ion.gheorghescu@demo.ro",
    birth_date: "1985-03-15",
    gender: "M",
    cnp: "1850315000001",
    address: "Str. Florilor 12, București",
    allergies: ["Penicilină"],
    medical_notes: "Pacient cu hipertensiune arterială controlată.",
    created_at: "2024-01-10T10:00:00Z",
  },
  {
    id: "pat-2",
    first_name: "Ana",
    last_name: "Marinescu",
    phone: "0722 111 002",
    email: "ana.marinescu@demo.ro",
    birth_date: "1990-07-22",
    gender: "F",
    cnp: "2900722000002",
    address: "Bd. Unirii 45, Măgurele",
    allergies: [],
    medical_notes: "",
    created_at: "2024-02-05T14:30:00Z",
  },
  {
    id: "pat-3",
    first_name: "Mihai",
    last_name: "Popa",
    phone: "0722 111 003",
    email: "mihai.popa@demo.ro",
    birth_date: "1978-11-08",
    gender: "M",
    cnp: "1781108000003",
    address: "Str. Libertății 7, Măgurele",
    allergies: ["Lidocaină", "Ibuprofen"],
    medical_notes: "Diabet tip 2. Necesită precauție la proceduri chirurgicale.",
    created_at: "2024-03-12T09:15:00Z",
  },
  {
    id: "pat-4",
    first_name: "Elena",
    last_name: "Vasilescu",
    phone: "0722 111 004",
    email: "elena.vasilescu@demo.ro",
    birth_date: "1995-01-30",
    gender: "F",
    cnp: "2950130000004",
    address: "Str. Primăverii 20, București",
    allergies: [],
    medical_notes: "Sarcină - trimestrul 2. Consultare cu medicul obstetrician înainte de proceduri.",
    created_at: "2024-04-01T11:45:00Z",
  },
  {
    id: "pat-5",
    first_name: "Alexandru",
    last_name: "Stancu",
    phone: "0722 111 005",
    email: "alex.stancu@demo.ro",
    birth_date: "1968-09-17",
    gender: "M",
    cnp: "1680917000005",
    address: "Str. Aviatorilor 3, Măgurele",
    allergies: [],
    medical_notes: "Proteze dentare parțiale. Control periodic la 3 luni.",
    created_at: "2024-04-15T08:00:00Z",
  },
  {
    id: "pat-6",
    first_name: "Cristina",
    last_name: "Radu",
    phone: "0722 111 006",
    email: "cristina.radu@demo.ro",
    birth_date: "2000-05-12",
    gender: "F",
    cnp: "5000512000006",
    address: "Str. Trandafirilor 8, București",
    allergies: [],
    medical_notes: "",
    created_at: "2024-05-20T16:00:00Z",
  },
  {
    id: "pat-7",
    first_name: "Vasile",
    last_name: "Dobre",
    phone: "0722 111 007",
    email: "vasile.dobre@demo.ro",
    birth_date: "1972-12-03",
    gender: "M",
    cnp: "1721203000007",
    address: "Bd. Republicii 55, Măgurele",
    allergies: ["Latex"],
    medical_notes: "Purtător de stimulator cardiac.",
    created_at: "2024-06-01T13:20:00Z",
  },
  {
    id: "pat-8",
    first_name: "Maria",
    last_name: "Tudor",
    phone: "0722 111 008",
    email: "maria.tudor@demo.ro",
    birth_date: "1988-04-25",
    gender: "F",
    cnp: "2880425000008",
    address: "Str. Mihai Viteazu 19, București",
    allergies: [],
    medical_notes: "Tratament ortodontic în curs.",
    created_at: "2024-06-15T10:10:00Z",
  },
];
