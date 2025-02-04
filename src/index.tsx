import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './css/app.scss';
import { App } from './App';
import { AlphabillProvider } from './hooks/providers/AlphabillProvider';
import { AuthenticationProvider } from './hooks/providers/AuthenticationProvider';
import { NetworkProvider } from './hooks/providers/NetworkProvider';
import { UnitsProvider } from './hooks/providers/UnitsProvider';
import { VaultProvider } from './hooks/providers/VaultProvider';

const root = createRoot(document.getElementById('root') as HTMLElement);
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
  </StrictMode>,
);
