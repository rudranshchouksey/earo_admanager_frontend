import en from './en.json';
import ar from './ar.json';

export type LocaleCode = 'en' | 'ar';

export const SUPPORTED_LOCALES: LocaleCode[] = ['en', 'ar'];

const translations: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  ar: ar as Record<string, string>,
};

// RTL languages
const RTL_LANGUAGES = ['ar', 'he', 'fa', 'ur', 'yi'];

export function isRTL(languageCode: string): boolean {
  return RTL_LANGUAGES.includes(languageCode.toLowerCase().split('-')[0]);
}

export function getDirection(languageCode: string): 'ltr' | 'rtl' {
  return isRTL(languageCode) ? 'rtl' : 'ltr';
}

export const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  ar: 'العربية',
  he: 'עברית',
  fa: 'فارسی',
  ur: 'اردو',
};

export const COUNTRY_LANGUAGE_MAP: Record<string, string> = {
  US: 'en',
  GB: 'en',
  AU: 'en',
  CA: 'en',
  IN: 'en',
  SG: 'en',
  SA: 'ar',
  AE: 'ar',
  EG: 'ar',
  QA: 'ar',
  KW: 'ar',
  BH: 'ar',
  OM: 'ar',
  JO: 'ar',
  LB: 'ar',
  IL: 'he',
  IR: 'fa',
  PK: 'ur',
};

export function getLanguageForCountry(countryCode: string): string {
  return COUNTRY_LANGUAGE_MAP[countryCode?.toUpperCase()] || 'en';
}

/**
 * Get translations for a locale.
 * Falls back to English if locale is not supported.
 */
export function getTranslations(locale: string): Record<string, string> {
  const code = (locale.split('-')[0] || 'en') as LocaleCode;
  return translations[code] ?? (en as Record<string, string>);
}

/**
 * Check if a locale has static translations (no API fetch needed).
 */
export function hasLocaleFile(locale: string): boolean {
  const code = locale.split('-')[0] || 'en';
  return code in translations;
}

export { en, ar };
