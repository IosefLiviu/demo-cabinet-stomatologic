import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { DemoAuthProvider, useDemoAuth } from "./demo-contexts/DemoAuthContext";
import { DemoDataProvider } from "./demo-contexts/DemoDataContext";
import { DemoDashboard } from "./demo-pages/DemoDashboard";
import { DemoPatients } from "./demo-pages/DemoPatients";
import { DemoAuth } from "./demo-pages/DemoAuth";
import { DemoAdmin } from "./demo-pages/DemoAdmin";
import { DemoBanner } from "./demo-components/DemoBanner";
import { DemoSidebar } from "./demo-components/DemoSidebar";

function DemoProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useDemoAuth();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function DemoLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className={darkMode ? "dark" : ""}>
      <div className="min-h-screen bg-background text-foreground">
        <DemoBanner />
        <div className="flex">
          <DemoSidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            darkMode={darkMode}
            onToggleDark={() => setDarkMode(!darkMode)}
          />
          <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-16"}`}>
            <div className="p-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}

export function DemoApp() {
  return (
    <BrowserRouter>
      <DemoAuthProvider>
        <DemoDataProvider>
          <Routes>
            <Route path="/auth" element={<DemoAuth />} />
            <Route
              path="/"
              element={
                <DemoProtectedRoute>
                  <DemoLayout>
                    <DemoDashboard />
                  </DemoLayout>
                </DemoProtectedRoute>
              }
            />
            <Route
              path="/patients"
              element={
                <DemoProtectedRoute>
                  <DemoLayout>
                    <DemoPatients />
                  </DemoLayout>
                </DemoProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <DemoProtectedRoute>
                  <DemoLayout>
                    <DemoAdmin />
                  </DemoLayout>
                </DemoProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </DemoDataProvider>
      </DemoAuthProvider>
    </BrowserRouter>
  );
}
