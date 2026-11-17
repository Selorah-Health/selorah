import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';
import { registerServiceWorker } from './lib/pwa/register';
import { initTheme } from './lib/theme';

const CHUNK_RELOAD_KEY = 'selorah:chunk-reload-at';

// A deployment can remove an old chunk while a tab is still open. Reload
// silently instead of letting the router show a generic error screen.
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  try {
    const last = Number(window.sessionStorage.getItem(CHUNK_RELOAD_KEY) || 0);
    if (Date.now() - last < 10000) return;
    window.sessionStorage.setItem(CHUNK_RELOAD_KEY, String(Date.now()));
  } catch {
    // Session storage can be blocked in private mode.
  }
  window.location.reload();
});

registerServiceWorker();
initTheme();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);

const splashWindow = window as Window & { __selorahHideSplash?: () => void };
window.setTimeout(() => splashWindow.__selorahHideSplash?.(), 300);
