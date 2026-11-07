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

// Initialize Google Translate
// const script = document.createElement('script');
// script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
// script.async = true;
// document.body.appendChild(script);

// (window as any).googleTranslateElementInit = () => {
//   new (window as any).google.translate.TranslateElement({
//     pageLanguage: 'en',
//     includedLanguages: 'en,fr',
//     layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
//     autoDisplay: false
//   }, 'google_translate_element');
// };

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    {/* <div id="google_translate_element" style={{ visibility: 'hidden', height: 0, overflow: 'hidden', position: 'absolute' }}></div> */}
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);

const splashWindow = window as Window & { __selorahHideSplash?: () => void };
window.setTimeout(() => splashWindow.__selorahHideSplash?.(), 300);
