import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext';

// Initialize Google Translate
const script = document.createElement('script');
script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
script.async = true;
document.body.appendChild(script);

(window as any).googleTranslateElementInit = () => {
  new (window as any).google.translate.TranslateElement({
    pageLanguage: 'en',
    includedLanguages: 'en,fr',
    layout: (window as any).google.translate.TranslateElement.InlineLayout.SIMPLE,
    autoDisplay: false
  }, 'google_translate_element');
};

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <div id="google_translate_element" style={{ visibility: 'hidden', height: 0, overflow: 'hidden', position: 'absolute' }}></div>
    <BrowserRouter>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </BrowserRouter>
  </React.StrictMode>
);
