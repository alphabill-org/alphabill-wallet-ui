import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import './css/app.scss';
import { App } from './App';
import { AlphabillProvider } from './hooks/providers/AlphabillProvider';
import { AuthenticationProvider } from './hooks/providers/AuthenticationProvider';
import { NetworkProvider } from './hooks/providers/NetworkProvider';
import { VaultProvider } from './hooks/providers/VaultProvider';

const root = createRoot(document.getElementById('root') as HTMLElement);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 86400,
    },
  },
});

// TODO: Reduce the amount of iterations in hooks

root.render(
  <StrictMode>
    <HashRouter>
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <VaultProvider>
            <AuthenticationProvider>
              <AlphabillProvider>
                <App />
              </AlphabillProvider>
            </AuthenticationProvider>
          </VaultProvider>
        </NetworkProvider>
      </QueryClientProvider>
    </HashRouter>
  </StrictMode>,
);
