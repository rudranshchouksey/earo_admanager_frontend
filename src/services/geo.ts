import { request } from "./api";
import type { Country } from "./targeting";


export interface GeoData {
  locale: string;
  city: string;
  region: string;
  country: string;
  country_code: string;
  language: string;
  currency: string;
  currencySymbol: string;
  ip:string;
}

/** Map geo response to a country name from the targeting countries list. */
export function resolveCountryFromGeo(
  countries: Country[],
  geo?: Pick<GeoData, "country" | "country_code"> | null,
): string | null {
  if (!geo || countries.length === 0) return null;

  const code = geo.country_code?.trim().toUpperCase();
  if (code) {
    const byCode = countries.find((c) => c.code?.toUpperCase() === code);
    if (byCode) return byCode.name;
  }

  const name = geo.country?.trim();
  if (!name || name === "your country") return null;

  const byName = countries.find((c) => c.name.toLowerCase() === name.toLowerCase());
  return byName?.name ?? name;
}

export const getGeoData = () => request<GeoData>('/api/v1/campaigns/geo');