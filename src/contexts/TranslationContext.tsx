import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { api } from '@/services/api';
import { useDirection } from './DirectionContext';
import { getTranslations, hasLocaleFile } from '@/locale';
import { en } from '@/locale';

interface TranslationContextValue {
  t: (key: string, variables?: Record<string, string>) => string;
  isLoading: boolean;
  language: string;
}

const TranslationContext = createContext<TranslationContextValue | null>(null);

/** @deprecated Use locale/en.json. Kept for backwards compatibility. */
export const DEFAULT_STRINGS = en;

interface TranslationProviderProps {
  children: ReactNode;
}

export function TranslationProvider({ children }: TranslationProviderProps) {
  const { language } = useDirection();
  const [translations, setTranslations] = useState<Record<string, string>>(() => getTranslations(language));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadTranslations = async () => {
      // Use static locale file when available
      if (hasLocaleFile(language)) {
        setTranslations(getTranslations(language));
        return;
      }

      // Fall back to API for unsupported locales
      setIsLoading(true);
      try {
        const { data, error } = await api.invokeTranslate({
          texts: Object.values(en),
          targetLanguage: language,
        });

        if (error) throw error;

        const translatedStrings: Record<string, string> = {};
        Object.keys(en).forEach((key) => {
          const original = en[key];
          translatedStrings[key] = data?.translations?.[original] ?? original;
        });

        setTranslations(translatedStrings);
      } catch (error) {
        console.error('Failed to fetch translations:', error);
        setTranslations(en);
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);
 
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
     <TranslationContext.Provider value={{ t, isLoading, language }}>
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