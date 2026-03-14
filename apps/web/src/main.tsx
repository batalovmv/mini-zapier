import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import 'reactflow/dist/style.css';

import App from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import { LocaleProvider } from './locale/LocaleProvider';
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element "#root" was not found.');
}

createRoot(container).render(
  <StrictMode>
    <LocaleProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '18px',
            border: '1px solid rgba(15, 23, 42, 0.12)',
            background: '#fffdf9',
            color: '#172033',
            boxShadow: '0 18px 40px rgba(15, 23, 42, 0.12)',
          },
          success: {
            iconTheme: {
              primary: '#059669',
              secondary: '#ecfdf5',
            },
          },
          error: {
            iconTheme: {
              primary: '#e11d48',
              secondary: '#fff1f2',
            },
          },
        }}
      />
    </LocaleProvider>
  </StrictMode>,
);
