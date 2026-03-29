import { request } from "./api";


export interface GeoData {
  city: string;
  country: string;
  countryCode: string;
  language: string;
  currency: {
    code: string;
    symbol: string;
  };
}
export const getGeoData = () => request<GeoData>('/api/v1/geo');