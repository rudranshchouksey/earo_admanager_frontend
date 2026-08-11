import { useEffect, useMemo, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronDown, MapPin, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { City, Country } from '@/services/targeting';
import { Flag } from '@/components/ui/flag';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

type WithinTargetType = 'cities' | 'latlong' | 'postal';

const TARGET_TYPE_OPTIONS: { value: WithinTargetType; label: string }[] = [
  { value: 'cities', label: 'Cities' },
  { value: 'latlong', label: 'Lat/Long' },
  { value: 'postal', label: 'Postal codes' },
];

const postalCodePlaceholder = `One code per line
90210
90211
Comma separated
90210, 90211
`;


export interface LocationData {
  country: string;
  countryCode: string;
  businessLocations: { name: string; address: string }[];
  additionalCountries?: { code: string; name: string }[];
  selectedCountries?: string[];
  selectedCities?: City[];
  selectedBusinessIds?: string[];
  targetLatLong?: { latitude: number; longitude: number; radius: number, country: string }[];
  targetPostal?: { code: string; country: string }[];
  targetingType?: 'cities' | 'latlong' | 'postal';
  /** Per-country free-text values for lat/long and postal modes. */
  withinCountryValues?: Record<
    string,
    { type: WithinTargetType; value: string }
  >;
}

interface Props {
  countries: Country[];
  cities: City[];
  data: LocationData;
  onCountryChange: (codes: string[]) => void;
  onCityChange: (ids: string[], country: string) => void;
  onTargetLatLongChange: (country: string, latitude: number, longitude: number, radius: number) => void;
  onTargetPostalChange: (country: string, postal: string) => void;
  isLoading?: boolean;
  countryRef: React.RefObject<HTMLDivElement>;
  disabled: boolean;
  postalCodeCountries: Country[];
  existingTargetTypes: Record<string, WithinTargetType>;
}

export default function CampaignInventoryStep({
  countries,
  cities,
  data,
  onCountryChange,
  onCityChange,
  onTargetLatLongChange,
  onTargetPostalChange,
  isLoading,
  countryRef,
  disabled,
  postalCodeCountries,
  existingTargetTypes = {}
}: Props) {
  const { isPro } = useSessionFlags();

  const selectedCountries =
    data.selectedCountries || (data.countryCode ? [data.countryCode] : []);
  const selectedCities = data.selectedCities || [];

  const [expandedByCountry, setExpandedByCountry] = useState<Record<string, boolean>>({});
  /** User overrides while editing; derived DB state comes from `derivedTargetTypes`. */
  const [targetTypeByCountry, setTargetTypeByCountry] = useState<
    Record<string, WithinTargetType>
  >({});
  const [valueByCountry, setValueByCountry] = useState<Record<string, string>>(
    () => {
      const initial: Record<string, string> = {};
      Object.entries(data.withinCountryValues || {}).forEach(([code, entry]) => {
        initial[code] = entry.value;
      });
      return initial;
    },
  );

  /** Prefer prop from parent (load path); also re-derive from inventory data as a safety net. */
  const derivedTargetTypes = useMemo(() => {
    const records: Record<string, WithinTargetType> = {
      ...existingTargetTypes,
    };

    data.targetPostal?.forEach((item) => {
      if (item?.country && String(item.code ?? '').trim()) {
        records[item.country] = 'postal';
      }
    });

    data.targetLatLong?.forEach((item) => {
      if (!item?.country) return;
      const lat = item.latitude as number | string | undefined | null;
      const lng = item.longitude as number | string | undefined | null;
      const hasCoords =
        (lat !== '' && lat != null) || (lng !== '' && lng != null);
      if (hasCoords) {
        records[item.country] = 'latlong';
      }
    });

    data.selectedCities?.forEach((city) => {
      if (city?.country) {
        records[city.country] = 'cities';
      }
    });

    return records;
  }, [
    existingTargetTypes,
    data.targetPostal,
    data.targetLatLong,
    data.selectedCities,
  ]);

  // When campaign data loads (async), apply derived types without wiping user overrides.
  useEffect(() => {
    if (Object.keys(derivedTargetTypes).length === 0) return;
    setTargetTypeByCountry((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [code, type] of Object.entries(derivedTargetTypes)) {
        // Only seed missing keys so a mid-edit type switch is not overwritten.
        if (!next[code]) {
          next[code] = type;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [derivedTargetTypes]);


  const postalCodeCountrySet = useMemo(
    () => new Set(postalCodeCountries.map((c) => c.code)),
    [postalCodeCountries],
  );

  const countryDropdownItems = useMemo(
    () =>
      countries.map((country) => ({
        id: country.code,
        label: country.name,
        code: country.code,
        searchText: country.code,
      })),
    [countries],
  );

  const citiesByCountry = useMemo(() => {
    const map: Record<string, City[]> = {};
    for (const city of cities) {
      if (!map[city.country]) map[city.country] = [];
      map[city.country].push(city);
    }
    return map;
  }, [cities]);

  const cityDropdownItemsByCountry = useMemo(() => {
    const map: Record<string, { id: string; label: string; searchText: string }[]> = {};
    for (const [code, countryCities] of Object.entries(citiesByCountry)) {
      map[code] = countryCities.map((city) => ({
        id: city.id,
        label: city.name,
        searchText: city.name,
      }));
    }
    return map;
  }, [citiesByCountry]);

  const handleCountrySelect = (codes: string[]) => {
    if (!isPro && codes.length > 1) {
      onCountryChange([codes[codes.length - 1]]);
      return;
    }
    onCountryChange(codes);
  };

  const removeCountry = (code: string) => {
    if (disabled) return;
    onCountryChange(selectedCountries.filter((c) => c !== code));
  };

  const setExpanded = (code: string, open: boolean) => {
    setExpandedByCountry((prev) => ({ ...prev, [code]: open }));
  };

  const getTargetType = (code: string): WithinTargetType =>
    targetTypeByCountry[code] ||
    derivedTargetTypes[code] ||
    data.withinCountryValues?.[code]?.type ||
    'cities';

  const setTargetType = (code: string, type: WithinTargetType) => {
    setTargetTypeByCountry((prev) => ({ ...prev, [code]: type }));
  };

  const getInputValue = (code: string) =>
    valueByCountry[code] ?? data.withinCountryValues?.[code]?.value ?? '';

  const setInputValue = (code: string, value: string) => {
    setValueByCountry((prev) => ({ ...prev, [code]: value }));
  };

  const handleCitiesForCountry = (countryCode: string, cityIds: string[]) => {
    const otherCityIds = selectedCities
      .filter((c) => c.country !== countryCode)
      .map((c) => c.id);
    onCityChange([...otherCityIds, ...cityIds], countryCode);
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

  const removeCity = (cityId: string, country: string) => {
    onCityChange(selectedCities.filter(city => city.id !== cityId && city.country === country).map(city => city.id), country);
  };

  return (
    <div className="space-y-4" ref={countryRef}>
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>
            {isPro ? 'Countries' : 'Country'} <sup>*</sup>
          </span>
        </Label>

        {selectedCountries.length > 0 && (
          <div className="w-full space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              {selectedCountries.map((country) => {
                const countryData = countries.find((c) => c.code === country);
                return (
                  <span
                    className="inline-flex items-center gap-1.5 bg-[#E6F4EA] border border-[#C8E6C9] text-foreground text-xs font-medium pl-2 pr-1 h-10 rounded-lg"
                    key={country}
                  >
                    <Flag country={countryData?.name} code={countryData?.code} />
                    <span className="text-foreground text-xs font-medium">
                      {countryData?.name}
                    </span>
                    {!disabled && (
                      <button
                        type="button"
                        aria-label={`Remove ${countryData?.name ?? country}`}
                        className="rounded p-0.5 hover:bg-black/5"
                        onClick={() => removeCountry(country)}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        <SearchableDropdown
          items={countryDropdownItems}
          selectedIds={selectedCountries}
          onSelectionChange={handleCountrySelect}
          selectionMode={isPro ? 'multi' : 'single'}
          placeholder="Select country..."
          searchPlaceholder="Search countries..."
          emptyMessage="No countries found"
          disabled={disabled}
          renderItem={(item) => (
            <span className="inline-flex items-center gap-2 truncate">
              <Flag country={item.label} code={item.code as string} />
              <span className="truncate">{item.label}</span>
            </span>
          )}
        />
      </div>

      {selectedCountries.length > 0 && (
        <div className="w-full space-y-2">
          <Label className="flex items-center gap-2">
            Target within country
            <span className="text-xs text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>

          <div className="flex flex-col gap-2">
            {selectedCountries.map((country) => {
              const countryData = countries.find((c) => c.code === country);
              const isOpen = Boolean(expandedByCountry[country]);
              const targetType = getTargetType(country);
              const postalAvailable =
                postalCodeCountrySet.has(country) ||
                countryData?.postalCodeAvailable;

              const latLong = data.targetLatLong?.filter(p => p.country === country) || [];
              const postalCodes = data.targetPostal?.filter(p => p.country === country) || [];

              const selectedCityIds = selectedCities
                .filter((c) => c.country === country)
                .map((c) => c.id);

              return (
                <Collapsible
                  key={country}
                  open={isOpen}
                  onOpenChange={(open) => setExpanded(country, open)}
                  className="w-full rounded-lg border border-border bg-background"
                >
                  <CollapsibleTrigger
                    disabled={disabled}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-medium transition-colors hover:bg-muted/50',
                      disabled && 'cursor-not-allowed opacity-60',
                    )}
                  >
                    <span className="inline-flex min-w-0 items-center gap-2">
                      <Flag
                        country={countryData?.name ?? ''}
                        code={countryData?.code ?? country}
                      />
                      <span className="truncate">{countryData?.name ?? country}</span>
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
                        isOpen && 'rotate-180',
                      )}
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent className="border-t border-border">
                    <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-start">
                      <div className="w-full space-y-1.5 sm:w-[180px] sm:shrink-0">
                        <Label className="text-xs text-muted-foreground">Type</Label>
                        <Select
                          value={targetType}
                          onValueChange={(val) =>
                            setTargetType(country, val as WithinTargetType)
                          }
                          disabled={disabled}
                        >
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {TARGET_TYPE_OPTIONS.map((opt) => (
                              <SelectItem
                                key={opt.value}
                                value={opt.value}
                                disabled={
                                  opt.value === 'postal' && !postalAvailable
                                }
                              >
                                {opt.label}
                                {opt.value === 'postal' && !postalAvailable
                                  ? ' (unavailable)'
                                  : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Label className="text-xs text-muted-foreground">
                          {targetType === 'cities'
                            ? 'Cities'
                            : targetType === 'latlong'
                              ? 'Coordinates'
                              : 'Postal code'}
                        </Label>

                        {targetType === 'cities' ? (
                          <SearchableDropdown
                            items={cityDropdownItemsByCountry[country] || []}
                            selectedIds={selectedCityIds}
                            onSelectionChange={(ids) =>
                              handleCitiesForCountry(country, ids)
                            }
                            selectionMode="multi"
                            placeholder="Select cities..."
                            searchPlaceholder="Search cities..."
                            emptyMessage="No cities available"
                            disabled={disabled}
                            maxVisibleItems={80}
                          />
                        ) : targetType === 'latlong' ? (

                          <div className='flex flex-row items-center gap-2'>
                            <div className='flex flex-col gap-2'>
                              <Input
                                type="number"
                                step="any"
                                value={latLong[0]?.latitude ?? ''}
                                onChange={(e) =>
                                  onTargetLatLongChange(country, Number(e.target.value), latLong[0]?.longitude ?? 0, latLong[0]?.radius ?? 0)
                                }
                                disabled={disabled}
                                placeholder="e.g. 25.2048"
                              />
                              <Label className='text-xs text-muted-foreground'>Latitude</Label>
                            </div>
                            <div className='flex flex-col gap-2'>
                              <Input
                                type="number"
                                step="any"
                                value={latLong[0]?.longitude ?? ''}
                                onChange={(e) =>
                                  onTargetLatLongChange(country, latLong[0]?.latitude ?? 0, Number(e.target.value), latLong[0]?.radius ?? 0)
                                }
                                disabled={disabled}
                                placeholder="e.g. 55.2708"
                              />
                              <Label className='text-xs text-muted-foreground'>Longitude</Label>
                            </div>
                            <div className='flex flex-col gap-2'>
                              <Input
                                type="number"
                                step="any"
                                value={latLong[0]?.radius ?? ''}
                                onChange={(e) =>
                                  onTargetLatLongChange(country, latLong[0]?.latitude ?? 0, latLong[0]?.longitude ?? 0, Number(e.target.value))
                                }
                                disabled={disabled}
                                placeholder="100"
                              />
                              <Label className='text-xs text-muted-foreground'>Radius(km)</Label>
                            </div>
                          </div>

                        ) : (
                          <div className='flex flex-col gap-2'>
                            <Textarea
                              value={postalCodes[0]?.code ?? ''}
                              onChange={(e) =>
                                onTargetPostalChange(country, e.target.value)
                              }
                              disabled={disabled}
                              placeholder={postalCodePlaceholder}
                              rows={12}
                            />
                            <Label className='text-xs text-muted-foreground'>Postal codes(comma separated, lines)</Label>
                          </div>
                        )}
                      </div>                      
                    </div>
                    {
                      targetType === 'cities' && (
                        <div className='flex flex-col gap-2 p-3 pl-4'>
                          <Label className='text-xs text-muted-foreground'>Cities</Label>
                          <div className='flex flex-wrap items-center gap-2'>
                            
                            {selectedCities.filter(city => city.country === country).map(city => 
                              <span className='border rounded-lg px-2 py-1 cursor-pointer transition-all flex items-center gap-1.5 border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA] text-xs text-foreground font-medium' key={city.id}>{city.name} <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => removeCity(city.id, country)} /></span>
                            )}
                          </div>
                        </div>
                      )
                    }
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
