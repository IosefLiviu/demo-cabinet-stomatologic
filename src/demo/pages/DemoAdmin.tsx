import React, { useState } from "react";
import { useDemoData } from "@/demo/contexts/DemoDataContext";
import { useDemoAuth } from "@/demo/contexts/DemoAuthContext";
import { Users, Stethoscope, ClipboardList, Shield, Clock, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminTab = "doctors" | "treatments" | "users" | "settings";

export function DemoAdmin() {
  const { doctors, treatments } = useDemoData();
  const { user } = useDemoAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>("doctors");

  const tabs: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: "doctors", label: "Doctori", icon: Stethoscope },
    { id: "treatments", label: "Tratamente", icon: ClipboardList },
    { id: "users", label: "Utilizatori", icon: Users },
    { id: "settings", label: "Setări", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Administrare</h2>
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Shield className="h-4 w-4" /><span>Conectat ca: {user?.display_name} (Admin Demo)</span></div>
      </div>

      <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">Panoul de administrare funcționează în mod vizualizare. Modificările nu sunt persistente în versiunea demo.</p>
      </div>

      <div className="flex gap-1 bg-muted p-1 rounded-lg w-fit">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors", activeTab === tab.id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            <tab.icon className="h-4 w-4" />{tab.label}
          </button>
        ))}
      </div>

      {activeTab === "doctors" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {doctors.map((doc) => (
            <div key={doc.id} className="bg-card rounded-lg border p-5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: doc.color }}>
                  {doc.name.split(" ").slice(1).map((n) => n[0]).join("")}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-card-foreground">{doc.name}</p>
                  <p className="text-sm text-muted-foreground">{doc.specialization}</p>
                  <p className="text-xs text-muted-foreground mt-1">{doc.phone}</p>
                  <p className="text-xs text-muted-foreground">{doc.email}</p>
                  <span className={cn("inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium", doc.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                    {doc.is_active ? "Activ" : "Inactiv"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "treatments" && (
        <div className="bg-card rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium text-muted-foreground">Tratament</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Categorie</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Preț (RON)</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Durată (min)</th>
              </tr></thead>
              <tbody>
                {treatments.map((t) => (
                  <tr key={t.id} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium text-card-foreground">{t.name}</td>
                    <td className="p-3"><span className="px-2 py-0.5 bg-accent text-accent-foreground rounded text-xs">{t.category}</span></td>
                    <td className="p-3 text-right text-card-foreground">{t.price.toLocaleString()}</td>
                    <td className="p-3 text-right text-muted-foreground flex items-center justify-end gap-1"><Clock className="h-3 w-3" />{t.duration_minutes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="bg-card rounded-lg border p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">UD</div>
              <div className="flex-1"><p className="font-semibold text-card-foreground">Utilizator Demo</p><p className="text-sm text-muted-foreground">demo@perfectsmileglim.demo</p></div>
              <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">Admin</span>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border">
              <div className="w-10 h-10 rounded-full bg-cabinet-2 flex items-center justify-center text-white font-bold text-sm">MP</div>
              <div className="flex-1"><p className="font-semibold text-card-foreground">Dr. Maria Popescu</p><p className="text-sm text-muted-foreground">maria.popescu@demo.ro</p></div>
              <span className="px-2 py-1 bg-cabinet-2/10 text-cabinet-2 rounded-full text-xs font-medium">Doctor</span>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 border">
              <div className="w-10 h-10 rounded-full bg-cabinet-3 flex items-center justify-center text-white font-bold text-sm">AI</div>
              <div className="flex-1"><p className="font-semibold text-card-foreground">Dr. Andrei Ionescu</p><p className="text-sm text-muted-foreground">andrei.ionescu@demo.ro</p></div>
              <span className="px-2 py-1 bg-cabinet-3/10 text-cabinet-3 rounded-full text-xs font-medium">Doctor</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="bg-card rounded-lg border p-6 space-y-6">
          <div>
            <h4 className="text-md font-semibold text-card-foreground mb-3">Informații Cabinet (Demo)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs text-muted-foreground mb-1">Denumire</label><p className="text-sm font-medium text-card-foreground">PERFECT SMILE GLIM SRL</p></div>
              <div><label className="block text-xs text-muted-foreground mb-1">Adresă</label><p className="text-sm font-medium text-card-foreground">Strada București 68-70, Măgurele, România</p></div>
              <div><label className="block text-xs text-muted-foreground mb-1">Telefon</label><p className="text-sm font-medium text-card-foreground">0721 702 820</p></div>
              <div><label className="block text-xs text-muted-foreground mb-1">Email</label><p className="text-sm font-medium text-card-foreground">office@perfectsmileglim.ro</p></div>
              <div><label className="block text-xs text-muted-foreground mb-1">CUI</label><p className="text-sm font-medium text-card-foreground">48655560</p></div>
              <div><label className="block text-xs text-muted-foreground mb-1">Nr. Înregistrare</label><p className="text-sm font-medium text-card-foreground">J23/5347/2023</p></div>
            </div>
          </div>
          <div className="p-3 bg-accent/30 rounded-lg"><p className="text-xs text-muted-foreground">Setările sunt doar pentru vizualizare în versiunea demo. Modificările nu sunt salvate.</p></div>
        </div>
      )}
    </div>
  );
}
