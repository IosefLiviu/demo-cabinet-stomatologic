import React, { useState } from "react";
import { useDemoData } from "../demo-contexts/DemoDataContext";
import { DemoDentalChart } from "../demo-components/DemoDentalChart";
import { DemoPatientForm } from "../demo-components/DemoPatientForm";
import {
  Search,
  UserPlus,
  X,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
  FileText,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { cn } from "../lib/utils";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { DemoPatient } from "../demo-data/patients";

export function DemoPatients() {
  const { patients, appointments, addPatient } = useDemoData();
  const [search, setSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<DemoPatient | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"info" | "dental" | "history">("info");

  const filtered = patients.filter(
    (p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase()) ||
      p.phone.includes(search) ||
      p.cnp.includes(search)
  );

  const patientAppointments = selectedPatient
    ? appointments.filter((a) => a.patient_id === selectedPatient.id).sort((a, b) => b.date.localeCompare(a.date))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Pacienți</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setSelectedPatient(null);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity"
        >
          <UserPlus className="h-4 w-4" />
          Pacient Nou (Demo)
        </button>
      </div>

      <div className="flex gap-6">
        {/* Patient List */}
        <div className={cn("space-y-4", selectedPatient || showForm ? "w-1/3" : "w-full")}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Caută pacient (nume, telefon, CNP)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <p className="text-sm text-muted-foreground">{filtered.length} pacienți</p>

          <div className="space-y-2 max-h-[calc(100vh-280px)] overflow-y-auto">
            {filtered.map((patient) => (
              <button
                key={patient.id}
                onClick={() => {
                  setSelectedPatient(patient);
                  setShowForm(false);
                  setActiveTab("info");
                }}
                className={cn(
                  "w-full text-left p-4 rounded-lg border transition-colors",
                  selectedPatient?.id === patient.id
                    ? "bg-accent border-primary"
                    : "bg-card hover:bg-accent/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-card-foreground">
                      {patient.last_name} {patient.first_name}
                    </p>
                    <p className="text-sm text-muted-foreground">{patient.phone}</p>
                    {patient.allergies.length > 0 && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 text-destructive" />
                        <span className="text-xs text-destructive">{patient.allergies.join(", ")}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Patient Detail / Form */}
        {(selectedPatient || showForm) && (
          <div className="flex-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {showForm
                  ? "Pacient Nou (Demo)"
                  : `${selectedPatient!.last_name} ${selectedPatient!.first_name}`}
              </h3>
              <button
                onClick={() => {
                  setSelectedPatient(null);
                  setShowForm(false);
                }}
                className="p-2 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {showForm ? (
              <div className="bg-card rounded-lg border p-6">
                <DemoPatientForm
                  onSubmit={(data) => {
                    addPatient(data);
                    setShowForm(false);
                  }}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            ) : (
              selectedPatient && (
                <>
                  {/* Tabs */}
                  <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
                    {(["info", "dental", "history"] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                          activeTab === tab
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {tab === "info" ? "Informații" : tab === "dental" ? "Diagrama Dentară" : "Istoric"}
                      </button>
                    ))}
                  </div>

                  {activeTab === "info" && (
                    <div className="bg-card rounded-lg border p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Telefon</p>
                            <p className="text-sm font-medium text-card-foreground">{selectedPatient.phone}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium text-card-foreground">{selectedPatient.email || "-"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Data Nașterii</p>
                            <p className="text-sm font-medium text-card-foreground">{selectedPatient.birth_date}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Adresă</p>
                            <p className="text-sm font-medium text-card-foreground">{selectedPatient.address || "-"}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">CNP</p>
                          <p className="text-sm font-medium text-card-foreground">{selectedPatient.cnp || "-"}</p>
                        </div>
                      </div>

                      {selectedPatient.allergies.length > 0 && (
                        <div className="p-3 bg-destructive/10 rounded-lg">
                          <p className="text-sm font-semibold text-destructive flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> Alergii
                          </p>
                          <p className="text-sm text-destructive mt-1">{selectedPatient.allergies.join(", ")}</p>
                        </div>
                      )}

                      {selectedPatient.medical_notes && (
                        <div className="p-3 bg-accent/30 rounded-lg">
                          <p className="text-sm font-semibold text-accent-foreground">Note Medicale</p>
                          <p className="text-sm text-muted-foreground mt-1">{selectedPatient.medical_notes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === "dental" && (
                    <DemoDentalChart
                      patientName={`${selectedPatient.last_name} ${selectedPatient.first_name}`}
                    />
                  )}

                  {activeTab === "history" && (
                    <div className="bg-card rounded-lg border p-6">
                      <h4 className="text-md font-semibold text-card-foreground mb-4">Istoric Programări</h4>
                      {patientAppointments.length > 0 ? (
                        <div className="space-y-3">
                          {patientAppointments.map((apt) => (
                            <div key={apt.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border">
                              <div>
                                <p className="text-sm font-medium text-card-foreground">
                                  {format(new Date(apt.date), "d MMMM yyyy", { locale: ro })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {apt.start_time} - {apt.end_time} | {apt.doctor_name}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {apt.treatment_names.join(", ")}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-card-foreground">{apt.total_price} RON</p>
                                <p className="text-xs text-muted-foreground capitalize">{apt.status}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Nu există programări pentru acest pacient
                        </p>
                      )}
                    </div>
                  )}
                </>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
