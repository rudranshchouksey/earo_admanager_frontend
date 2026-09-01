import { useState, useEffect } from 'react';
import { getGeoData, type GeoData } from '@/services/geo';
import { logger } from "@/lib/logger";

const defaultGeoData: GeoData = {
  locale: 'en-US',
  city: 'your city',
  region: 'your region',
  country: 'your country',
  country_code: 'US',
  language: 'en',
  currency: 'USD',
  currencySymbol: '$',
  ip: '127.0.0.1',
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
          logger.captureException(err, { context: 'Geo detection error:' });
          setGeoData(defaultGeoData);
          return;
        }
        setGeoData(data as GeoData);
      } catch (err) {
        logger.captureException(err, { context: 'Failed to detect location:' });
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
