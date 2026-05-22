import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'fr';

interface Translation {
  [key: string]: {
    [K in Language]: string;
  };
}

const translations: Translation = {};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('selorah_lang');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('selorah_lang', language);
    
    let retryCount = 0;
    const MAX_RETRIES = 10;

    const triggerTranslate = () => {
      const googleCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (googleCombo) {
        // Only trigger if the value is different to avoid loops
        if (googleCombo.value !== language) {
          googleCombo.value = language;
          googleCombo.dispatchEvent(new Event('change'));
        }
      } else if (retryCount < MAX_RETRIES) {
        retryCount++;
        setTimeout(triggerTranslate, 1000);
      }
    };
    
    // Small delay to ensure Google script has initialized
    const timer = setTimeout(triggerTranslate, 1000);
    return () => clearTimeout(timer);
  }, [language]);

  // Fallback for manual t() calls - just return the key or the English version if it exists
  const t = (key: string) => key;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
