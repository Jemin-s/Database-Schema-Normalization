import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { SchemaProvider } from "./contexts/SchemaProvider.tsx";
import { DependencyProvider } from "./contexts/DependencyProvider.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <SchemaProvider>
      <DependencyProvider>
        <App />
      </DependencyProvider>
    </SchemaProvider>
  </StrictMode>
);
