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
    
    const triggerTranslate = () => {
      const googleCombo = document.querySelector('.goog-te-combo') as HTMLSelectElement;
      if (googleCombo) {
        if (googleCombo.value !== language) {
          googleCombo.value = language;
          googleCombo.dispatchEvent(new Event('change'));
        }
      } else {
        setTimeout(triggerTranslate, 1000);
      }
    };
    
    setTimeout(triggerTranslate, 500);
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
