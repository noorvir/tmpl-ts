import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";

import "./index.css";

import { ThemeProvider } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

// @module api
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "./lib/api";
// @end-module

let app = <App />;

// @module api
app = <QueryClientProvider client={queryClient}>{app}</QueryClientProvider>;

// @end-module
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {app}
      <Toaster />
    </ThemeProvider>
  </React.StrictMode>,
);
