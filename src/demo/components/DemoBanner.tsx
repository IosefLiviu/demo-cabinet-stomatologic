import React from "react";
import { AlertTriangle } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="demo-banner text-white text-center py-2 px-4 text-sm font-bold flex items-center justify-center gap-2 sticky top-0 z-50">
      <AlertTriangle className="h-4 w-4" />
      <span>VERSIUNE DEMO - Datele sunt fictive și se resetează la reîncărcare</span>
      <AlertTriangle className="h-4 w-4" />
    </div>
  );
}
