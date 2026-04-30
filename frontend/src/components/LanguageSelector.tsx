import { useLanguage } from '../contexts/LanguageContext';
import { GlobeAltIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'Français' },
];

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/10"
      >
        <GlobeAltIcon className="w-4 h-4 text-white/80" />
        <span className="text-xs font-bold text-white uppercase tracking-widest">
          {language}
        </span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-[60]" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-40 bg-[#101217] border border-white/10 rounded-2xl py-2 shadow-2xl z-[70] animate-in fade-in zoom-in-95 duration-200">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  setLanguage(lang.code as any);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors hover:bg-white/5 ${
                  language === lang.code ? 'text-primary' : 'text-white/60'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
