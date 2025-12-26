import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

import "./index.css";

import { ThemeProvider } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { TRPCReactProvider } from "./trpc/react";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <TRPCReactProvider>
        <App />
        <Toaster />
      </TRPCReactProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
