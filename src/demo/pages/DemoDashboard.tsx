import React, { useState } from "react";
import { format } from "date-fns";
import { ro } from "date-fns/locale";
import { Plus, Calendar, Clock, Search, CalendarClock } from "lucide-react";
import { useDemoData } from "@/demo/contexts/DemoDataContext";
import { DemoTimeSlotGrid } from "@/demo/components/DemoTimeSlotGrid";
import { DemoStatsCards } from "@/demo/components/DemoStatsCards";
import { DemoRevenueChart } from "@/demo/components/DemoRevenueChart";
import { DemoPatients } from "@/demo/pages/DemoPatients";
import { DemoAdmin } from "@/demo/pages/DemoAdmin";
import { DateNavigator } from "@/components/DateNavigator";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Stethoscope } from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_CABINETS = [
  { id: 1, name: "Cabinet 1" },
  { id: 2, name: "Cabinet 2" },
  { id: 3, name: "Cabinet 3" },
];

const cabinetBgColors: Record<number, string> = {
  1: 'bg-cabinet-1',
  2: 'bg-cabinet-2',
  3: 'bg-cabinet-3',
};

interface DemoDashboardProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function DemoDashboard({ activeTab, onTabChange }: DemoDashboardProps) {
  const { appointments, doctors } = useDemoData();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCabinet, setSelectedCabinet] = useState<number | null>(null);
  const [filterDoctor, setFilterDoctor] = useState<string | null>(null);

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayAppointments = appointments.filter(a => a.date === dateStr);

  const totalDuration = todayAppointments.reduce((sum, a) => {
    const [sh, sm] = a.start_time.split(':').map(Number);
    const [eh, em] = a.end_time.split(':').map(Number);
    return sum + ((eh * 60 + em) - (sh * 60 + sm));
  }, 0);
  const hours = Math.floor(totalDuration / 60);
  const minutes = totalDuration % 60;

  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return (
          <div className="mt-2">
            <DemoTimeSlotGrid
              selectedDate={selectedDate}
              selectedCabinet={selectedCabinet}
              filterDoctor={filterDoctor}
            />
          </div>
        );
      case 'patients':
        return <DemoPatients />;
      case 'reports':
        return (
          <div className="space-y-4">
            <DemoStatsCards />
            <DemoRevenueChart />
          </div>
        );
      case 'expenses':
        return <DemoPlaceholder title="Cheltuieli Lunare" description="Gestionare cheltuieli și facturi pe luni" />;
      case 'treatment-plan':
        return <DemoPlaceholder title="Plan Tratament" description="Planuri de tratament personalizate per pacient" />;
      case 'printabile':
        return <DemoPlaceholder title="Printabile" description="Rețete, trimiteri, certificate medicale" />;
      case 'stock':
        return <DemoStockView />;
      case 'schedule':
        return <DemoPlaceholder title="Program Medici" description="Calendar săptămânal și lunar cu turele medicilor" />;
      case 'laborator':
        return <DemoPlaceholder title="Laborator" description="Evidența probelor și lucrărilor de laborator" />;
      case 'whatsapp':
        return <DemoPlaceholder title="WhatsApp Inbox" description="Mesaje primite și trimise către pacienți" />;
      case 'reminders':
        return <DemoPlaceholder title="Rechemări" description="Pacienți care necesită reamintire pentru vizite periodice" />;
      default:
        return null;
    }
  };

  return (
    <>
      {/* Calendar controls - only shown on calendar tab */}
      {activeTab === 'calendar' && (
        <div className="sticky top-14 sm:top-16 z-30 bg-background py-2 border-b border-border px-1 sm:px-2 lg:px-4 space-y-2 md:space-y-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SidebarTrigger />
            <DateNavigator selectedDate={selectedDate} onDateChange={setSelectedDate} />

            {/* Doctor filter */}
            <Select
              value={filterDoctor || "all"}
              onValueChange={(v) => setFilterDoctor(v === "all" ? null : v)}
            >
              <SelectTrigger className="w-[140px] sm:w-[180px] gap-2">
                <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Toți doctorii" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="all">Toți doctorii</SelectItem>
                {doctors.map(d => (
                  <SelectItem key={d.id} value={d.id}>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Cabinet tabs */}
            <div className="hidden md:flex md:items-center md:gap-2">
              <div className="border-l border-border h-6 mx-1" />
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  onClick={() => setSelectedCabinet(null)}
                  className={cn(
                    "px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap",
                    selectedCabinet === null
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  )}
                >
                  Toate
                </button>
                {DEMO_CABINETS.map(cab => (
                  <button
                    key={cab.id}
                    onClick={() => setSelectedCabinet(cab.id)}
                    className={cn(
                      "px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap",
                      selectedCabinet === cab.id
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    <span className={cn("w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shrink-0", cabinetBgColors[cab.id])} />
                    <span className="hidden sm:inline">{cab.name}</span>
                    <span className="sm:hidden">C{cab.id}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Summary + new appointment */}
            <div className="flex gap-2 ml-auto items-center">
              <div className="hidden lg:flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-2 sm:px-3 py-1.5 shadow-sm">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-bold text-foreground">{todayAppointments.length}</span>
                  <span className="text-xs text-muted-foreground">Programări</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-card border border-border px-2 sm:px-3 py-1.5 shadow-sm">
                  <Clock className="h-4 w-4 text-green-500 shrink-0" />
                  <span className="text-sm font-bold text-foreground">
                    {hours > 0 ? `${hours}h` : ''}{minutes > 0 ? `${minutes}m` : hours === 0 ? '0m' : ''}
                  </span>
                </div>
              </div>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Programare nouă</span>
                <span className="sm:hidden">Nou</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-1 sm:px-2 lg:px-4 py-2 sm:py-4">
        {activeTab !== 'calendar' && <SidebarTrigger className="mb-2" />}
        {renderContent()}
      </div>
    </>
  );
}

function DemoPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-card rounded-xl border border-border p-12 text-center">
      <CalendarClock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-xs font-medium">
        Secțiune Demo — disponibilă în aplicația completă
      </div>
    </div>
  );
}

function DemoStockView() {
  const { stock } = useDemoData();
  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-card-foreground">Stoc Materiale</h3>
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
            {stock.map(item => {
              const isLow = item.quantity <= item.min_quantity;
              return (
                <tr key={item.id} className="border-b hover:bg-muted/30 transition-colors">
                  <td className="p-3 font-medium text-card-foreground">{item.name}</td>
                  <td className="p-3 text-muted-foreground">{item.category}</td>
                  <td className={cn("p-3 text-right font-medium", isLow ? "text-destructive" : "text-card-foreground")}>{item.quantity}</td>
                  <td className="p-3 text-muted-foreground">{item.unit}</td>
                  <td className="p-3 text-right text-card-foreground">{item.price_per_unit} RON</td>
                  <td className="p-3 text-center">
                    {isLow ? (
                      <span className="px-2 py-1 bg-destructive/10 text-destructive rounded-full text-xs font-medium">Stoc Scăzut</span>
                    ) : (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
