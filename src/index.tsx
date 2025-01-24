import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./css/app.scss";
import { App } from "./App";
import { AlphabillProvider } from "./hooks/alphabill";
import { AuthenticationProvider } from "./hooks/authentication";
import { NetworkProvider } from "./hooks/network";
import { VaultProvider } from "./hooks/vault";
import { UnitsProvider } from "./hooks/units";

const root = createRoot(document.getElementById("root") as HTMLElement);
const queryClient = new QueryClient();

root.render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <VaultProvider>
            <AuthenticationProvider>
              <AlphabillProvider>
                <UnitsProvider>
                  <App />
                </UnitsProvider>
              </AlphabillProvider>
            </AuthenticationProvider>
          </VaultProvider>
        </NetworkProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>
);
