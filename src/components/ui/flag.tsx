import React from 'react';
import * as Flags from 'country-flag-icons/react/3x2';
import { getCode } from 'country-list';

export const Flag = ({ country, code, className = '', style = {} }: { country: string, code: string, className?: string, style?: React.CSSProperties }) => {
  if (!country) return null;

  // Convert full name (e.g., "United States", "Japan") to 2-letter ISO code ("US", "JP")
  const countryCode = code || getCode(country);

  if (!countryCode) {
    console.warn(`Flag component: Invalid country name "${country}"`);
    return null;
  }

  // Get the matching SVG component from the flag library
  const FlagComponent = Flags[countryCode];

  if (!FlagComponent) {
    return null;
  }

  return (
    <FlagComponent 
      className={className} 
      style={{ width: '1.5em', height: 'auto', display: 'inline-block', ...style }} 
      title={country}
    />
  );
};