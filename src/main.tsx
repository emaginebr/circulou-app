import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';
import { NAuthProvider } from 'nauth-react';
import { Toaster } from 'sonner';

import i18n from '@/i18n';
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
      <I18nextProvider i18n={i18n}>
        <NAuthProvider config={buildNAuthConfig()}>
          <StoresProvider>
            <ProductsProvider>
              <App />
            </ProductsProvider>
          </StoresProvider>
        </NAuthProvider>
        <Toaster position="top-right" richColors closeButton />
      </I18nextProvider>
    </AppErrorBoundary>
  </StrictMode>,
);
