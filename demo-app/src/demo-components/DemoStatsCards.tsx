import React from "react";
import { Users, CalendarCheck, Clock, Banknote } from "lucide-react";
import { useDemoData } from "../demo-contexts/DemoDataContext";
import { format } from "date-fns";

export function DemoStatsCards() {
  const { patients, appointments } = useDemoData();
  const today = format(new Date(), "yyyy-MM-dd");

  const todayAppts = appointments.filter((a) => a.date === today);
  const completedToday = todayAppts.filter((a) => a.status === "completed").length;
  const scheduledToday = todayAppts.filter((a) => a.status === "scheduled" || a.status === "confirmed").length;
  const revenueToday = todayAppts
    .filter((a) => a.is_paid)
    .reduce((sum, a) => sum + a.total_price, 0);

  const stats = [
    {
      label: "Total Pacienți",
      value: patients.length,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950",
    },
    {
      label: "Programări Azi",
      value: todayAppts.length,
      icon: CalendarCheck,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-950",
    },
    {
      label: "În Așteptare",
      value: scheduledToday,
      icon: Clock,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-950",
    },
    {
      label: "Încasări Azi",
      value: `${revenueToday} RON`,
      icon: Banknote,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-card rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-2xl font-bold text-card-foreground mt-1">{stat.value}</p>
            </div>
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-6 w-6 ${stat.color}`} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
