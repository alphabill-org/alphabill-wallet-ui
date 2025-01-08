import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./css/app.scss";
import App from "./App";
import VaultProvider from "./hooks/vault";

const root = createRoot(document.getElementById("root") as HTMLElement);
const queryClient = new QueryClient();

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <VaultProvider>
          <App />
        </VaultProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
