import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { NAuthProvider } from 'nauth-react';
import { Toaster } from 'sonner';

import { App } from '@/App';
import { AppErrorBoundary } from '@/components/ui/AppErrorBoundary';
import { ProductsProvider } from '@/Contexts/ProductsContext';
import { StoresProvider } from '@/Contexts/StoresContext';
import { buildNAuthConfig } from '@/Services/AuthService';

import '@/styles/theme.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Elemento raiz #root não encontrado em index.html');
}

createRoot(rootEl).render(
  <StrictMode>
    <AppErrorBoundary>
      <NAuthProvider config={buildNAuthConfig()}>
        <StoresProvider>
          <ProductsProvider>
            <App />
          </ProductsProvider>
        </StoresProvider>
      </NAuthProvider>
      <Toaster position="top-right" richColors closeButton />
    </AppErrorBoundary>
  </StrictMode>,
);
