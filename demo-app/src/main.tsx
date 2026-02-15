import React from "react";
import { createRoot } from "react-dom/client";
import { DemoApp } from "./App";
import "./index.css";

createRoot(document.getElementById("demo-root")!).render(
  <React.StrictMode>
    <DemoApp />
  </React.StrictMode>
);
