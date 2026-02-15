import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { DemoAuthProvider, useDemoAuth } from "@/demo/contexts/DemoAuthContext";
import { DemoDataProvider } from "@/demo/contexts/DemoDataContext";
import { DemoDashboard } from "@/demo/pages/DemoDashboard";
import { DemoPatients } from "@/demo/pages/DemoPatients";
import { DemoAuth } from "@/demo/pages/DemoAuth";
import { DemoAdmin } from "@/demo/pages/DemoAdmin";
import { DemoHeader } from "@/demo/components/DemoHeader";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

function DemoProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useDemoAuth();
  if (!isAuthenticated) return <Navigate to="/demo/auth" replace />;
  return <>{children}</>;
}

function DemoMainView() {
  const [activeTab, setActiveTab] = useState('calendar');
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return activeTab !== 'calendar';
  });

  useEffect(() => {
    setSidebarOpen(activeTab !== 'calendar');
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DemoHeader />
      <SidebarProvider
        open={sidebarOpen}
        onOpenChange={setSidebarOpen}
        style={{ '--sidebar-top': '3.5rem' } as React.CSSProperties}
        className="!min-h-0 flex-1 sm:[--sidebar-top:4rem]"
      >
        <div className="flex w-full">
          <AppSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isAdmin={true}
            isReception={false}
            unreadCount={3}
            pendingRemindersCount={5}
          />
          <main className="flex-1 min-w-0 w-full">
            <DemoDashboard activeTab={activeTab} onTabChange={setActiveTab} />
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}

export function DemoApp() {
  return (
    <DemoAuthProvider>
      <DemoDataProvider>
        <Routes>
          <Route path="/auth" element={<DemoAuth />} />
          <Route
            path="/"
            element={
              <DemoProtectedRoute>
                <DemoMainView />
              </DemoProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <DemoProtectedRoute>
                <DemoMainView />
              </DemoProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/demo" replace />} />
        </Routes>
      </DemoDataProvider>
    </DemoAuthProvider>
  );
}
