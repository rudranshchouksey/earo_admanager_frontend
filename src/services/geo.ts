import { request } from "./api";


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
export const getGeoData = () => request<GeoData>('/api/v1/campaigns/geo');