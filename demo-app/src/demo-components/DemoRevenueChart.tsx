import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const MONTHLY_DATA = [
  { month: "Ian", venituri: 28500 },
  { month: "Feb", venituri: 32100 },
  { month: "Mar", venituri: 29800 },
  { month: "Apr", venituri: 35200 },
  { month: "Mai", venituri: 31600 },
  { month: "Iun", venituri: 38900 },
  { month: "Iul", venituri: 34200 },
  { month: "Aug", venituri: 26800 },
  { month: "Sep", venituri: 37500 },
  { month: "Oct", venituri: 41200 },
  { month: "Nov", venituri: 39100 },
  { month: "Dec", venituri: 43500 },
];

const TREATMENT_DISTRIBUTION = [
  { name: "Consultații", value: 25, color: "#7a4a2a" },
  { name: "Profilaxie", value: 20, color: "#0284c7" },
  { name: "Odontoterapie", value: 18, color: "#10B981" },
  { name: "Protetică", value: 15, color: "#F59E0B" },
  { name: "Endodonție", value: 12, color: "#EC4899" },
  { name: "Chirurgie", value: 10, color: "#EF4444" },
];

export function DemoRevenueChart() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Venituri Lunare (Demo)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={MONTHLY_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(40, 20%, 85%)" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString()} RON`, "Venituri"]}
              contentStyle={{
                backgroundColor: "hsl(40, 33%, 98%)",
                border: "1px solid hsl(40, 20%, 85%)",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="venituri" fill="hsl(23, 44%, 35%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <h3 className="text-lg font-semibold text-card-foreground mb-4">Distribuție Tratamente (Demo)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={TREATMENT_DISTRIBUTION}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
            >
              {TREATMENT_DISTRIBUTION.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value}%`, "Procent"]} />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => <span className="text-xs">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
