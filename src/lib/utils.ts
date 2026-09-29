import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Same as admanager_landing/src/lib/utils.ts: Intl's compact default rounds K-range values
// to whole numbers ("19K") and keeps one decimal at M ("1.6M").
export function formatCompactNumber(value: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale || 'en-US', {
    notation: 'compact',
    compactDisplay: 'short',
  }).format(value);
}
