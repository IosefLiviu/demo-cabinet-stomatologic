import React, { useState } from "react";
import { format, addDays, subDays } from "date-fns";
import { ro } from "date-fns/locale";
import { useDemoData } from "../demo-contexts/DemoDataContext";
import { DemoStatsCards } from "../demo-components/DemoStatsCards";
import { DemoAppointmentCard } from "../demo-components/DemoAppointmentCard";
import { DemoRevenueChart } from "../demo-components/DemoRevenueChart";
import { ChevronLeft, ChevronRight, CalendarDays, BarChart3, Package, Filter } from "lucide-react";
import { cn } from "../lib/utils";

type TabId = "calendar" | "reports" | "stock";

export function DemoDashboard() {
  const { appointments, updateAppointmentStatus, stock, doctors } = useDemoData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabId>("calendar");
  const [filterDoctor, setFilterDoctor] = useState<string>("all");

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const dayAppointments = appointments
    .filter((a) => a.date === dateStr)
    .filter((a) => filterDoctor === "all" || a.doctor_id === filterDoctor)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
    { id: "calendar", label: "Calendar", icon: CalendarDays },
    { id: "reports", label: "Rapoarte", icon: BarChart3 },
    { id: "stock", label: "Stoc", icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Panou Principal</h2>
        <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
          Date Demo
        </span>
      </div>

      <DemoStatsCards />

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "calendar" && (
        <div className="space-y-4">
          {/* Date navigation */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                className="p-2 rounded-lg border hover:bg-accent transition-colors"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="text-center min-w-[200px]">
                <p className="text-lg font-semibold text-foreground">
                  {format(selectedDate, "EEEE", { locale: ro })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {format(selectedDate, "d MMMM yyyy", { locale: ro })}
                </p>
              </div>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="p-2 rounded-lg border hover:bg-accent transition-colors"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1.5 rounded-lg border text-sm hover:bg-accent transition-colors"
              >
                Azi
              </button>
            </div>

            {/* Doctor filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={filterDoctor}
                onChange={(e) => setFilterDoctor(e.target.value)}
                className="px-3 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="all">Toți doctorii</option>
                {doctors.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Appointments list */}
          {dayAppointments.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {dayAppointments.map((apt) => (
                <DemoAppointmentCard
                  key={apt.id}
                  appointment={apt}
                  onStatusChange={updateAppointmentStatus}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-lg border p-12 text-center">
              <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium text-card-foreground">
                Nu sunt programări pentru această zi
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Selectați o altă dată sau adăugați o programare nouă
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === "reports" && <DemoRevenueChart />}

      {activeTab === "stock" && (
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-card-foreground">Stoc Materiale (Demo)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Produs</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Categorie</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Cantitate</th>
                  <th className="text-left p-3 font-medium text-muted-foreground">Unitate</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Preț/Unit</th>
                  <th className="text-center p-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {stock.map((item) => {
                  const isLow = item.quantity <= item.min_quantity;
                  return (
                    <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-medium text-card-foreground">{item.name}</td>
                      <td className="p-3 text-muted-foreground">{item.category}</td>
                      <td className={cn("p-3 text-right font-medium", isLow ? "text-destructive" : "text-card-foreground")}>
                        {item.quantity}
                      </td>
                      <td className="p-3 text-muted-foreground">{item.unit}</td>
                      <td className="p-3 text-right text-card-foreground">{item.price_per_unit} RON</td>
                      <td className="p-3 text-center">
                        {isLow ? (
                          <span className="px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-medium">
                            Stoc Scăzut
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
