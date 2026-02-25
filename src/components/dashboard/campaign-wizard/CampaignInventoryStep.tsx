import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, X, Plus, Search } from 'lucide-react';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { useTranslation } from '@/contexts/TranslationContext';

// Country flag emoji helper
const countryFlag = (code: string) => {
  const base = 0x1F1E6;
  return String.fromCodePoint(
    base + code.charCodeAt(0) - 65,
    base + code.charCodeAt(1) - 65,
  );
};

const COUNTRIES = [
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'QA', name: 'Qatar' },
  { code: 'BH', name: 'Bahrain' },
  { code: 'OM', name: 'Oman' },
  { code: 'JO', name: 'Jordan' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'MA', name: 'Morocco' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'TR', name: 'Turkey' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'KE', name: 'Kenya' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
];

export interface LocationData {
  country: string;
  countryCode: string;
  mode: 'city' | 'business';
  city: string;
  cities: string[];
  businessLocations: string[];
  additionalCountries?: { code: string; name: string }[];
}

interface Props {
  data: LocationData;
  onChange: (data: LocationData) => void;
  isLoading?: boolean;
}

export default function CampaignInventoryStep({ data, onChange, isLoading }: Props) {
  const { t } = useTranslation();
  const { isPro } = useSessionFlags();
  const [showCountrySelect, setShowCountrySelect] = useState(false);
  const [newAddress, setNewAddress] = useState('');
  const [newCity, setNewCity] = useState('');
  const [addingCountry, setAddingCountry] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const additionalCountries = data.additionalCountries || [];

  const addCity = () => {
    const trimmed = newCity.trim();
    if (!trimmed) return;
    onChange({ ...data, cities: [...(data.cities || []), trimmed] });
    setNewCity('');
  };

  const removeCity = (index: number) => {
    onChange({ ...data, cities: (data.cities || []).filter((_, i) => i !== index) });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  const handleCountryChange = (code: string) => {
    const country = COUNTRIES.find(c => c.code === code);
    if (country) {
      onChange({ ...data, country: country.name, countryCode: code });
      setShowCountrySelect(false);
    }
  };

  const addAdditionalCountry = (code: string) => {
    const country = COUNTRIES.find(c => c.code === code);
    if (country && !additionalCountries.some(c => c.code === code) && code !== data.countryCode) {
      onChange({ ...data, additionalCountries: [...additionalCountries, { code: country.code, name: country.name }] });
    }
    setAddingCountry(false);
  };

  const removeAdditionalCountry = (code: string) => {
    onChange({ ...data, additionalCountries: additionalCountries.filter(c => c.code !== code) });
  };

  const addBusinessLocation = () => {
    const trimmed = newAddress.trim();
    if (!trimmed) return;
    onChange({ ...data, businessLocations: [...data.businessLocations, trimmed] });
    setNewAddress('');
  };

  const removeBusinessLocation = (index: number) => {
    onChange({ ...data, businessLocations: data.businessLocations.filter((_, i) => i !== index) });
  };

  // All selected country codes for filtering
  const usedCodes = [data.countryCode, ...additionalCountries.map(c => c.code)];

  return (
    <div className="space-y-4">
      {/* Location selection */}
      {isPro ? (
        /* Pro mode: chip row with inline search */
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">{t('wizard.inventory.locations')}</Label>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {/* Primary country chip */}
            {data.countryCode && (
              <span className="inline-flex items-center gap-1.5 bg-primary/10 text-primary text-sm font-medium px-3 py-1.5 rounded-full border border-primary/20">
                {countryFlag(data.countryCode)} {data.country}
                <button type="button" onClick={() => onChange({ ...data, country: '', countryCode: '' })} className="text-primary/60 hover:text-primary">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            {/* Additional country chips */}
            {additionalCountries.map(c => (
              <span key={c.code} className="inline-flex items-center gap-1.5 bg-muted text-sm px-3 py-1.5 rounded-full">
                {countryFlag(c.code)} {c.name}
                <button type="button" onClick={() => removeAdditionalCountry(c.code)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {/* Inline search input */}
            <div className="relative" ref={searchRef}>
              <div className="flex items-center gap-1 border border-border rounded-full px-3 py-1.5 bg-background">
                <Search className="h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('wizard.inventory.add_country')}
                  value={countrySearch}
                  onChange={(e) => { setCountrySearch(e.target.value); setShowSearchDropdown(true); }}
                  onFocus={() => setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 150)}
                  className="bg-transparent text-sm outline-none placeholder:text-muted-foreground w-28"
                />
              </div>
              {showSearchDropdown && (
                (() => {
                  const filtered = COUNTRIES.filter(
                    c => !usedCodes.includes(c.code) &&
                    (countrySearch === '' || c.name.toLowerCase().includes(countrySearch.toLowerCase()))
                  );
                  return filtered.length > 0 ? (
                    <div className="absolute top-full left-0 mt-1 w-56 max-h-48 overflow-y-auto bg-popover border border-border rounded-lg shadow-lg z-50">
                      {filtered.map(c => (
                        <button
                          key={c.code}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            if (!data.countryCode) {
                              // No primary country set — promote this one
                              onChange({ ...data, country: c.name, countryCode: c.code });
                            } else {
                              addAdditionalCountry(c.code);
                            }
                            setCountrySearch('');
                            setShowSearchDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2"
                        >
                          {countryFlag(c.code)} {c.name}
                        </button>
                      ))}
                    </div>
                  ) : null;
                })()
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Express mode: always show dropdown */
        <div>
          <Label className="text-xs text-muted-foreground uppercase tracking-wide">{t('wizard.inventory.primary_country')}</Label>
          <Select value={data.countryCode} onValueChange={handleCountryChange}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={t('wizard.inventory.select_country')} />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map(c => (
                <SelectItem key={c.code} value={c.code}>
                  {countryFlag(c.code)} {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Mode tabs */}
      <div>
        <div className="flex gap-1 bg-muted p-1 rounded-lg">
          <button
            type="button"
            onClick={() => onChange({ ...data, mode: 'city' })}
            className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${
              data.mode === 'city'
                ? 'bg-background text-foreground shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MapPin className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
            {t('wizard.inventory.target_city')}
          </button>
          <button
            type="button"
            onClick={() => onChange({ ...data, mode: 'business' })}
            className={`flex-1 text-sm py-1.5 px-3 rounded-md transition-colors ${
              data.mode === 'business'
                ? 'bg-background text-foreground shadow-sm font-medium'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MapPin className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
            {t('wizard.inventory.business_locations')}
          </button>
        </div>
      </div>

      {/* City mode */}
      {data.mode === 'city' && (
        <div className="space-y-2">
          <Label>{t('wizard.inventory.city')}</Label>
          <div className="flex gap-2">
            <Input
              placeholder={t('wizard.inventory.city_placeholder')}
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCity(); } }}
            />
            <Button type="button" size="sm" variant="outline" onClick={addCity} className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {(data.cities || []).length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {(data.cities || []).map((city, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-muted text-sm px-2.5 py-1 rounded-full">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  {city}
                  <button type="button" onClick={() => removeCity(i)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Business locations mode */}
      {data.mode === 'business' && (
        <div className="space-y-2">
          <Label>{t('wizard.inventory.business_address')}</Label>
          <div className="flex gap-2">
            <Input
              placeholder={t('wizard.inventory.business_placeholder')}
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBusinessLocation(); } }}
            />
            <Button type="button" size="sm" variant="outline" onClick={addBusinessLocation} className="shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {data.businessLocations.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {data.businessLocations.map((loc, i) => (
                <span key={i} className="inline-flex items-center gap-1 bg-muted text-sm px-2.5 py-1 rounded-full">
                  {loc}
                  <button type="button" onClick={() => removeBusinessLocation(i)} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
