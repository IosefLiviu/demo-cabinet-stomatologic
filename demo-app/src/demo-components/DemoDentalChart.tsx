import React, { useState } from "react";
import { cn } from "../lib/utils";

interface ToothStatus {
  number: number;
  status: string;
  color: string;
}

const TOOTH_STATUSES = [
  { name: "Sănătos", color: "#10B981", dbValue: "healthy" },
  { name: "Carie", color: "#EF4444", dbValue: "cavity" },
  { name: "Obturație", color: "#3B82F6", dbValue: "filled" },
  { name: "Coroană", color: "#F59E0B", dbValue: "crown" },
  { name: "Absent", color: "#6B7280", dbValue: "missing" },
  { name: "Implant", color: "#8B5CF6", dbValue: "implant" },
  { name: "Canal", color: "#EC4899", dbValue: "root_canal" },
];

// Sample dental status for demo patient
const SAMPLE_STATUSES: Record<number, { status: string; color: string }> = {
  16: { status: "Coroană", color: "#F59E0B" },
  15: { status: "Obturație", color: "#3B82F6" },
  24: { status: "Carie", color: "#EF4444" },
  26: { status: "Canal", color: "#EC4899" },
  36: { status: "Absent", color: "#6B7280" },
  37: { status: "Implant", color: "#8B5CF6" },
  46: { status: "Obturație", color: "#3B82F6" },
  47: { status: "Carie", color: "#EF4444" },
};

// Upper: 18-11, 21-28   Lower: 48-41, 31-38
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

function ToothBox({
  number,
  status,
  isSelected,
  onClick,
}: {
  number: number;
  status?: { status: string; color: string };
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-10 h-12 rounded-md border-2 flex flex-col items-center justify-center text-xs font-medium transition-all hover:scale-105",
        isSelected ? "ring-2 ring-ring ring-offset-2" : "",
        status?.status === "Absent" ? "opacity-40" : ""
      )}
      style={{
        borderColor: status?.color || "#10B981",
        backgroundColor: status ? `${status.color}15` : "#10B98115",
      }}
    >
      <span className="text-[10px] text-muted-foreground">{number}</span>
      <div
        className="w-5 h-5 rounded-sm mt-0.5"
        style={{ backgroundColor: status?.color || "#10B981" }}
      />
    </button>
  );
}

export function DemoDentalChart({ patientName }: { patientName?: string }) {
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const selectedStatus = selectedTooth ? SAMPLE_STATUSES[selectedTooth] : null;

  return (
    <div className="bg-card rounded-lg border p-6">
      <h3 className="text-lg font-semibold text-card-foreground mb-4">
        Diagrama Dentară {patientName && `- ${patientName}`}
      </h3>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-6">
        {TOOTH_STATUSES.map((s) => (
          <div key={s.dbValue} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: s.color }} />
            <span className="text-xs text-muted-foreground">{s.name}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="space-y-4">
        {/* Upper jaw */}
        <div className="flex justify-center gap-1">
          <div className="flex gap-1">
            {UPPER_RIGHT.map((n) => (
              <ToothBox
                key={n}
                number={n}
                status={SAMPLE_STATUSES[n]}
                isSelected={selectedTooth === n}
                onClick={() => setSelectedTooth(selectedTooth === n ? null : n)}
              />
            ))}
          </div>
          <div className="w-px bg-border mx-1" />
          <div className="flex gap-1">
            {UPPER_LEFT.map((n) => (
              <ToothBox
                key={n}
                number={n}
                status={SAMPLE_STATUSES[n]}
                isSelected={selectedTooth === n}
                onClick={() => setSelectedTooth(selectedTooth === n ? null : n)}
              />
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border mx-8" />

        {/* Lower jaw */}
        <div className="flex justify-center gap-1">
          <div className="flex gap-1">
            {LOWER_RIGHT.map((n) => (
              <ToothBox
                key={n}
                number={n}
                status={SAMPLE_STATUSES[n]}
                isSelected={selectedTooth === n}
                onClick={() => setSelectedTooth(selectedTooth === n ? null : n)}
              />
            ))}
          </div>
          <div className="w-px bg-border mx-1" />
          <div className="flex gap-1">
            {LOWER_LEFT.map((n) => (
              <ToothBox
                key={n}
                number={n}
                status={SAMPLE_STATUSES[n]}
                isSelected={selectedTooth === n}
                onClick={() => setSelectedTooth(selectedTooth === n ? null : n)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Selected tooth detail */}
      {selectedTooth && (
        <div className="mt-4 p-3 bg-accent/30 rounded-lg">
          <p className="text-sm font-medium">
            Dinte {selectedTooth}:{" "}
            <span style={{ color: selectedStatus?.color || "#10B981" }}>
              {selectedStatus?.status || "Sănătos"}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Click pe un alt dinte pentru a vedea detaliile. (Demo - modificările nu sunt salvate)
          </p>
        </div>
      )}
    </div>
  );
}
