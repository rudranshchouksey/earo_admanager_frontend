import { useState, useEffect } from 'react';
import { getGeoData } from '@/services/geo';
import type { GeoData } from '@/types/landing';

const defaultGeoData: GeoData = {
  city: 'your city',
  country: 'your country',
  countryCode: 'US',
  language: 'en',
  currency: {
    code: 'USD',
    symbol: '$',
  },
  listenerCount: '10 million',
  minPrice: '50',
};

export function useGeoLocation() {
  const [geoData, setGeoData] = useState<GeoData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function detectLocation() {
      try {
        const { data, error: err } = await getGeoData();
        if (err) {
          console.error('Geo detection error:', err);
          setGeoData(defaultGeoData);
          return;
        }
        setGeoData(data as GeoData);
      } catch (err) {
        console.error('Failed to detect location:', err);
        setGeoData(defaultGeoData);
        setError('Failed to detect location');
      } finally {
        setIsLoading(false);
      }
    }
    detectLocation();
  }, []);

  return { geoData, isLoading, error };
}
