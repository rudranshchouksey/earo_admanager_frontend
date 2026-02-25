import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { isRTL, getDirection } from '@/locale';

const LANGUAGE_STORAGE_KEY = 'user-language-preference';

interface DirectionContextValue {
  direction: 'ltr' | 'rtl';
  language: string;
  isRTL: boolean;
  /** Sets language AND persists the choice to localStorage */
  setLanguage: (lang: string) => void;
  /** Whether the user has explicitly chosen a language (saved in localStorage) */
  hasUserPreference: boolean;
  /** Sets language from geo-detection WITHOUT persisting (won't override user choice) */
  setLanguageFromGeo: (lang: string) => void;
}

const DirectionContext = createContext<DirectionContextValue>({
  direction: 'ltr',
  language: 'en',
  isRTL: false,
  setLanguage: () => {},
  hasUserPreference: false,
  setLanguageFromGeo: () => {},
});

interface DirectionProviderProps {
  children: ReactNode;
  initialLanguage?: string;
}

export function DirectionProvider({ children, initialLanguage = 'en' }: DirectionProviderProps) {
  // Check localStorage for a saved user preference
  const savedLang = typeof window !== 'undefined'
    ? localStorage.getItem(LANGUAGE_STORAGE_KEY)
    : null;

  const startLang = savedLang || initialLanguage;
  const [language, setLanguageState] = useState(startLang);
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(() => getDirection(startLang));
  const [hasUserPreference, setHasUserPreference] = useState(!!savedLang);

  // User-facing setter: persists choice to localStorage
  const setLanguage = useCallback((lang: string) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    setHasUserPreference(true);
    setLanguageState(lang);
  }, []);

  // Geo-detection setter: only applies if no saved user preference
  const setLanguageFromGeo = useCallback((lang: string) => {
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!saved) {
      setLanguageState(lang);
    }
  }, []);

  useEffect(() => {
    const dir = getDirection(language);
    setDirection(dir);
    
    // Apply to HTML element for global RTL support
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    
    // Add RTL class for Tailwind utilities
    if (dir === 'rtl') {
      document.documentElement.classList.add('rtl');
    } else {
      document.documentElement.classList.remove('rtl');
    }
  }, [language]);

  return (
    <DirectionContext.Provider value={{
      direction,
      language,
      isRTL: isRTL(language),
      setLanguage,
      hasUserPreference,
      setLanguageFromGeo,
    }}>
      {children}
    </DirectionContext.Provider>
  );
}

export const useDirection = () => useContext(DirectionContext);
