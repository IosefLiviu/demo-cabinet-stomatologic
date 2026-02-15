import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDemoAuth } from "../demo-contexts/DemoAuthContext";
import { Stethoscope, AlertTriangle } from "lucide-react";

export function DemoAuth() {
  const [username, setUsername] = useState("demo");
  const [password, setPassword] = useState("demo123");
  const { signIn, isAuthenticated } = useDemoAuth();
  const navigate = useNavigate();

  if (isAuthenticated) {
    navigate("/");
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signIn(username, password);
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Demo warning */}
        <div className="mb-6 p-4 bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">Versiune Demo</p>
            <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
              Aceasta este o versiune demonstrativă. Toate datele sunt fictive și se resetează la reîncărcare.
              Nu se folosesc credențiale reale sau baze de date de producție.
            </p>
          </div>
        </div>

        {/* Login card */}
        <div className="bg-card rounded-xl border shadow-lg p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4">
              <Stethoscope className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-card-foreground">PerfectSmileGlim</h1>
            <p className="text-sm text-muted-foreground mt-1">DEMO - Management Cabinet Stomatologic</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Utilizator</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Utilizator demo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Parolă</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Parolă demo"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Conectare Demo
            </button>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-4">
            Apăsați "Conectare Demo" cu orice credențiale - autentificarea este simulată
          </p>
        </div>
      </div>
    </div>
  );
}
