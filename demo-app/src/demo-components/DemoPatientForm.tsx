import React, { useState } from "react";
import { cn } from "../lib/utils";

interface DemoPatientFormProps {
  onSubmit: (data: {
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
  }) => void;
  onCancel: () => void;
}

export function DemoPatientForm({ onSubmit, onCancel }: DemoPatientFormProps) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    birth_date: "",
    gender: "M",
    cnp: "",
    address: "",
    allergies: "",
    medical_notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      allergies: form.allergies ? form.allergies.split(",").map((a) => a.trim()) : [],
    });
  };

  const inputClass = "w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring";
  const labelClass = "block text-sm font-medium text-foreground mb-1";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Prenume *</label>
          <input
            required
            className={inputClass}
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            placeholder="Ion"
          />
        </div>
        <div>
          <label className={labelClass}>Nume *</label>
          <input
            required
            className={inputClass}
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            placeholder="Popescu"
          />
        </div>
        <div>
          <label className={labelClass}>Telefon *</label>
          <input
            required
            className={inputClass}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="0722 000 000"
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@exemplu.ro"
          />
        </div>
        <div>
          <label className={labelClass}>Data Nașterii</label>
          <input
            type="date"
            className={inputClass}
            value={form.birth_date}
            onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
          />
        </div>
        <div>
          <label className={labelClass}>Gen</label>
          <select
            className={inputClass}
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          >
            <option value="M">Masculin</option>
            <option value="F">Feminin</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>CNP</label>
          <input
            className={inputClass}
            value={form.cnp}
            onChange={(e) => setForm({ ...form, cnp: e.target.value })}
            placeholder="1234567890123"
          />
        </div>
        <div>
          <label className={labelClass}>Adresă</label>
          <input
            className={inputClass}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Str. Exemplu 1, Oraș"
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Alergii (separate prin virgulă)</label>
        <input
          className={inputClass}
          value={form.allergies}
          onChange={(e) => setForm({ ...form, allergies: e.target.value })}
          placeholder="Penicilină, Lidocaină"
        />
      </div>

      <div>
        <label className={labelClass}>Note Medicale</label>
        <textarea
          className={cn(inputClass, "min-h-[80px]")}
          value={form.medical_notes}
          onChange={(e) => setForm({ ...form, medical_notes: e.target.value })}
          placeholder="Note medicale relevante..."
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 rounded-lg border border-input text-sm hover:bg-accent transition-colors"
        >
          Anulare
        </button>
        <button
          type="submit"
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:opacity-90 transition-opacity"
        >
          Salvare (Demo)
        </button>
      </div>
    </form>
  );
}
