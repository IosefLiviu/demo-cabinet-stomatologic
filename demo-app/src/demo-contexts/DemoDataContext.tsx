import React, { createContext, useContext, useState, ReactNode } from "react";
import { DEMO_PATIENTS, DemoPatient } from "../demo-data/patients";
import { DEMO_DOCTORS, DemoDoctor } from "../demo-data/doctors";
import { DEMO_TREATMENTS, DemoTreatment } from "../demo-data/treatments";
import { generateDemoAppointments, DemoAppointment } from "../demo-data/appointments";
import { DEMO_STOCK, DemoStockItem } from "../demo-data/stock";

interface DemoDataContextType {
  patients: DemoPatient[];
  doctors: DemoDoctor[];
  treatments: DemoTreatment[];
  appointments: DemoAppointment[];
  stock: DemoStockItem[];
  addAppointment: (apt: Omit<DemoAppointment, "id">) => void;
  updateAppointmentStatus: (id: string, status: DemoAppointment["status"]) => void;
  addPatient: (patient: Omit<DemoPatient, "id" | "created_at">) => void;
}

const DemoDataContext = createContext<DemoDataContextType | null>(null);

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [patients, setPatients] = useState<DemoPatient[]>(DEMO_PATIENTS);
  const [doctors] = useState<DemoDoctor[]>(DEMO_DOCTORS);
  const [treatments] = useState<DemoTreatment[]>(DEMO_TREATMENTS);
  const [appointments, setAppointments] = useState<DemoAppointment[]>(generateDemoAppointments());
  const [stock] = useState<DemoStockItem[]>(DEMO_STOCK);

  const addAppointment = (apt: Omit<DemoAppointment, "id">) => {
    const newApt: DemoAppointment = {
      ...apt,
      id: `apt-demo-${Date.now()}`,
    };
    setAppointments((prev) => [...prev, newApt]);
  };

  const updateAppointmentStatus = (id: string, status: DemoAppointment["status"]) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
  };

  const addPatient = (patient: Omit<DemoPatient, "id" | "created_at">) => {
    const newPatient: DemoPatient = {
      ...patient,
      id: `pat-demo-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setPatients((prev) => [...prev, newPatient]);
  };

  return (
    <DemoDataContext.Provider
      value={{
        patients,
        doctors,
        treatments,
        appointments,
        stock,
        addAppointment,
        updateAppointmentStatus,
        addPatient,
      }}
    >
      {children}
    </DemoDataContext.Provider>
  );
}

export function useDemoData() {
  const ctx = useContext(DemoDataContext);
  if (!ctx) throw new Error("useDemoData must be used within DemoDataProvider");
  return ctx;
}
