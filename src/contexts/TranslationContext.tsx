import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useDirection } from './DirectionContext';
import { getTranslations } from '@/locale';
import { en } from '@/locale';

interface TranslationContextValue {
  t: (key: string, variables?: Record<string, string>) => string;
  language: string;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const { language } = useDirection();
  
  // Initialize state with the translations for the current language
  const [translations, setTranslations] = useState<Record<string, string>>(() => 
    getTranslations(language)
  );

  // Update translations whenever the language changes in DirectionContext
  useEffect(() => {
    setTranslations(getTranslations(language));
  }, [language]);

  /**
   * The core translation function.
   * 1. Looks up the key in the current language.
   * 2. Falls back to English if the key is missing.
   * 3. Replaces {{variable}} placeholders if provided.
   */
  const t = useCallback((key: string, variables?: Record<string, string>): string => {
    let text = translations[key] ?? en[key] ?? key;

    if (variables) {
      Object.entries(variables).forEach(([varKey, value]) => {
        text = text.replace(new RegExp(`{{${varKey}}}`, 'g'), value);
      });
    }

    return text;
  }, [translations]);

  return (
    <TranslationContext.Provider value={{ t, language }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider');
  }
  return context;
}