import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDemoAuth } from "@/demo/contexts/DemoAuthContext";
import {
  LayoutDashboard, Users, Settings, LogOut, Moon, Sun, ChevronLeft, ChevronRight, Stethoscope,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DemoSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
}

const NAV_ITEMS = [
  { path: "/demo", label: "Panou Principal", icon: LayoutDashboard },
  { path: "/demo/patients", label: "Pacienți", icon: Users },
  { path: "/demo/admin", label: "Administrare", icon: Settings },
];

export function DemoSidebar({ isOpen, onToggle, darkMode, onToggleDark }: DemoSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useDemoAuth();

  return (
    <aside
      className={cn(
        "fixed left-0 top-8 h-[calc(100vh-2rem)] bg-sidebar border-r border-sidebar-border z-40 flex flex-col transition-all duration-300",
        isOpen ? "w-64" : "w-16"
      )}
    >
      <div className="p-4 border-b border-sidebar-border flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Stethoscope className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {isOpen && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-sidebar-foreground truncate">PerfectSmileGlim</h1>
            <p className="text-xs text-muted-foreground">DEMO</p>
          </div>
        )}
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {isOpen && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-2 border-t border-sidebar-border space-y-1">
        <button
          onClick={onToggleDark}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {darkMode ? <Sun className="h-5 w-5 flex-shrink-0" /> : <Moon className="h-5 w-5 flex-shrink-0" />}
          {isOpen && <span>{darkMode ? "Mod Luminos" : "Mod Întunecat"}</span>}
        </button>
        <button
          onClick={() => { signOut(); navigate("/demo/auth"); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {isOpen && <span>Deconectare</span>}
        </button>
      </div>

      <button
        onClick={onToggle}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
      >
        {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>
    </aside>
  );
}
