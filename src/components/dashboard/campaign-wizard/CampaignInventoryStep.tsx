import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { MapPin, Building2 } from 'lucide-react';
// import { useD evFlags } from '@/contexts/DevFlagsContext';
import { SearchableList } from '@/components/ui/searchable-list';
import type { Column, FilterDef } from '@/components/ui/searchable-list';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { City, Country, targetingApi } from '@/services/targeting';
import { MyTooltip } from '@/components/ui/MyTooltip';

// Mock countries
const MOCK_COUNTRIES = [
  { id: 'AE', name: 'United Arab Emirates', code: 'AE', region: 'Middle East', audience: '6.5M' },
  { id: 'SA', name: 'Saudi Arabia', code: 'SA', region: 'Middle East', audience: '12.4M' },
  { id: 'KW', name: 'Kuwait', code: 'KW', region: 'Middle East', audience: '2.1M' },
  { id: 'QA', name: 'Qatar', code: 'QA', region: 'Middle East', audience: '1.8M' },
  { id: 'BH', name: 'Bahrain', code: 'BH', region: 'Middle East', audience: '900K' },
  { id: 'OM', name: 'Oman', code: 'OM', region: 'Middle East', audience: '2.3M' },
  { id: 'EG', name: 'Egypt', code: 'EG', region: 'Middle East', audience: '8.2M' },
  { id: 'JO', name: 'Jordan', code: 'JO', region: 'Middle East', audience: '1.5M' },
  { id: 'LB', name: 'Lebanon', code: 'LB', region: 'Middle East', audience: '1.1M' },
  { id: 'US', name: 'United States', code: 'US', region: 'North America', audience: '45M' },
  { id: 'GB', name: 'United Kingdom', code: 'GB', region: 'Europe', audience: '18M' },
  { id: 'DE', name: 'Germany', code: 'DE', region: 'Europe', audience: '12M' },
  { id: 'FR', name: 'France', code: 'FR', region: 'Europe', audience: '10M' },
  { id: 'IN', name: 'India', code: 'IN', region: 'Asia', audience: '22M' },
  { id: 'AU', name: 'Australia', code: 'AU', region: 'Oceania', audience: '8M' },
  { id: 'CA', name: 'Canada', code: 'CA', region: 'North America', audience: '11M' },
  { id: 'BR', name: 'Brazil', code: 'BR', region: 'South America', audience: '15M' },
  { id: 'NG', name: 'Nigeria', code: 'NG', region: 'Africa', audience: '5M' },
  { id: 'ZA', name: 'South Africa', code: 'ZA', region: 'Africa', audience: '4.5M' },
  { id: 'JP', name: 'Japan', code: 'JP', region: 'Asia', audience: '14M' },
];

// Mock cities keyed by country
export const MOCK_CITIES_DATA: Record<string, { id: string; name: string; country: string; region: string; audience: string }[]> = {
  AE: [
    { id: 'AE-ALL', name: 'All UAE Cities', country: 'AE', region: 'UAE', audience: '6.2M' },
    { id: 'AE-DXB', name: 'Dubai', country: 'AE', region: 'UAE', audience: '2.8M' },
    { id: 'AE-AUH', name: 'Abu Dhabi', country: 'AE', region: 'UAE', audience: '1.6M' },
    { id: 'AE-SHJ', name: 'Sharjah', country: 'AE', region: 'UAE', audience: '1.1M' },
    { id: 'AE-AAN', name: 'Al Ain', country: 'AE', region: 'UAE', audience: '680K' },
    { id: 'AE-AJM', name: 'Ajman', country: 'AE', region: 'UAE', audience: '420K' },
  ],
  SA: [
    { id: 'SA-ALL', name: 'All KSA Cities', country: 'SA', region: 'KSA', audience: '11.8M' },
    { id: 'SA-RUH', name: 'Riyadh', country: 'SA', region: 'KSA', audience: '7.6M' },
    { id: 'SA-JED', name: 'Jeddah', country: 'SA', region: 'KSA', audience: '4.6M' },
    { id: 'SA-DMM', name: 'Dammam', country: 'SA', region: 'KSA', audience: '1.2M' },
  ],
  KW: [
    { id: 'KW-ALL', name: 'All Kuwait Cities', country: 'KW', region: 'Kuwait', audience: '2.0M' },
    { id: 'KW-KWI', name: 'Kuwait City', country: 'KW', region: 'Kuwait', audience: '1.4M' },
  ],
  QA: [
    { id: 'QA-ALL', name: 'All Qatar Cities', country: 'QA', region: 'Qatar', audience: '1.7M' },
    { id: 'QA-DOH', name: 'Doha', country: 'QA', region: 'Qatar', audience: '1.5M' },
  ],
  US: [
    { id: 'US-NYC', name: 'New York', country: 'US', region: 'US', audience: '8.3M' },
    { id: 'US-LA', name: 'Los Angeles', country: 'US', region: 'US', audience: '3.9M' },
    { id: 'US-CHI', name: 'Chicago', country: 'US', region: 'US', audience: '2.7M' },
    { id: 'US-HOU', name: 'Houston', country: 'US', region: 'US', audience: '2.3M' },
    { id: 'US-MIA', name: 'Miami', country: 'US', region: 'US', audience: '450K' },
    { id: 'US-SF', name: 'San Francisco', country: 'US', region: 'US', audience: '870K' },
  ],
  GB: [
    { id: 'GB-LON', name: 'London', country: 'GB', region: 'UK', audience: '9M' },
    { id: 'GB-MAN', name: 'Manchester', country: 'GB', region: 'UK', audience: '550K' },
    { id: 'GB-BIR', name: 'Birmingham', country: 'GB', region: 'UK', audience: '1.1M' },
  ],
  EG: [
    { id: 'EG-CAI', name: 'Cairo', country: 'EG', region: 'Egypt', audience: '10M' },
    { id: 'EG-ALX', name: 'Alexandria', country: 'EG', region: 'Egypt', audience: '5.2M' },
  ],
};

// Mock business locations
const MOCK_BUSINESSES = [
  { id: 'biz-1', name: 'Mall of the Emirates', address: 'Al Barsha, Dubai, UAE', city: 'Dubai' },
  { id: 'biz-2', name: 'Dubai Mall', address: 'Downtown Dubai, UAE', city: 'Dubai' },
  { id: 'biz-3', name: 'Riyadh Park Mall', address: 'Northern Ring Rd, Riyadh, KSA', city: 'Riyadh' },
  { id: 'biz-4', name: 'Red Sea Mall', address: 'King Abdullah Rd, Jeddah, KSA', city: 'Jeddah' },
  { id: 'biz-5', name: 'Cairo Festival City', address: 'New Cairo, Cairo, Egypt', city: 'Cairo' },
  { id: 'biz-6', name: 'The Avenues', address: 'Al Rai, Kuwait City, Kuwait', city: 'Kuwait City' },
  { id: 'biz-7', name: 'City Centre Mirdif', address: 'Mirdif, Dubai, UAE', city: 'Dubai' },
  { id: 'biz-8', name: 'Villaggio Mall', address: 'Aspire Zone, Doha, Qatar', city: 'Doha' },
  { id: 'biz-9', name: 'Yas Mall', address: 'Yas Island, Abu Dhabi, UAE', city: 'Abu Dhabi' },
  { id: 'biz-10', name: 'Place Vendôme', address: 'Lusail, Doha, Qatar', city: 'Doha' },
];

const countryColumns: Column<Country>[] = [
  { key: 'name', label: 'Country', sortable: true },
];

const countryFilters: FilterDef[] = [
  {
    key: 'region',
    label: 'Region',
    options: [...new Set(MOCK_COUNTRIES.map((c) => c.region))].sort().map((r) => ({ value: r, label: r })),
  },
];


const cityColumns: Column<City>[] = [
  { key: 'name', label: 'City', sortable: true },
  { key: 'country', label: 'Country', sortable: true },
];

type BusinessItem = typeof MOCK_BUSINESSES[0];

const businessColumns: Column<BusinessItem>[] = [
  { key: 'name', label: 'Business', sortable: true },
  { key: 'address', label: 'Address', sortable: true },
  { key: 'city', label: 'City', sortable: true },
];

export interface LocationData {
  country: string;
  countryCode: string;
  businessLocations: { name: string; address: string }[];
  additionalCountries?: { code: string; name: string }[];
  selectedCountries?: string[];
  selectedCities?: City[];
  selectedBusinessIds?: string[];
}

interface Props {
  countries: Country[];
  cities: City[];
  data: LocationData;
  // onChange: (data: LocationData) => void;
  onCountryChange: (codes: string[]) => void;
  onCityChange: (ids: string[]) => void;
  isLoading?: boolean;
  countryRef: React.RefObject<HTMLDivElement>;
}

export default function CampaignInventoryStep({ countries, cities, data, onCountryChange, onCityChange, isLoading, countryRef }: Props) {
  const [openListId, setOpenListId] = useState<string | null>(null);

  const handleOpenChange = (listId: string) => (open: boolean) => {
    setOpenListId(open ? listId : null);
  };
  const { isPro } = useSessionFlags();

  const selectedCountries = data.selectedCountries || (data.countryCode ? [data.countryCode] : []);
  const selectedCities = data.selectedCities || [];
  const selectedBusinessIds = data.selectedBusinessIds || [];

  // // Derive available cities from selected countries
  // const availableCities: CityItem[] = selectedCountries.length > 0
  //   ? selectedCountries.flatMap((code) => MOCK_CITIES_DATA[code] || [])
  //   : [];

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // const handleCountryChange = (ids: string[]) => {
  //   if (!isPro) {
  //     const code = ids[0] || '';
  //     const country = countries.find(c => c.code === code);
  //     const validCities = code
  //       ? selectedCities.filter((cityId) => {
  //           const city = Object.values(cities).flat().find((c) => c.id === cityId);
  //           return city && city.country === code;
  //         })
  //       : [];
  //     onChange({
  //       ...data,
  //       country: country?.name || '',
  //       countryCode: code,
  //       selectedCountries: ids,
  //       selectedCities: validCities,
  //     });
  //   } else {
  //     const validCities = ids.length > 0
  //       ? selectedCities.filter((cityId) => {
  //           const city = Object.values(cities).flat().find((c) => c.id === cityId);
  //           return city && ids.includes(city.country);
  //         })
  //       : [];
  //     const primary = countries.find(c => c.code === ids[0]);
  //     onChange({
  //       ...data,
  //       country: primary?.name || '',
  //       countryCode: ids[0] || '',
  //       selectedCountries: ids,
  //       selectedCities: validCities,
  //     });
  //   }

  //   console.log(ids);
  // };

  // const handleBusinessChange = (ids: string[]) => {
  //   const businesses = ids.map(id => {
  //     const biz = MOCK_BUSINESSES.find(b => b.id === id);
  //     return biz ? { name: biz.name, address: biz.address } : null;
  //   }).filter(Boolean) as { name: string; address: string }[];
  //   onChange({ ...data, selectedBusinessIds: ids, businessLocations: businesses });
  // };

  return (
    <div className="space-y-4" ref={countryRef}>
      {/* Country Selection */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>{isPro ? 'Countries' : 'Country'}  <sup>*</sup></span> 
        </Label>
        <SearchableList
          items={countries}
          columns={countryColumns}
          selectionMode={isPro ? 'multi' : 'single'}
          selectedIds={selectedCountries}
          onSelectionChange={onCountryChange}
          selectAllFiltered={isPro}
          idKey="code"
          searchPlaceholder="Search countries..."
          searchableKeys={['name']}
          filters={countryFilters}
          defaultSort={{ key: 'name', dir: 'asc' }}
          pageSize={10}
          variant="table"
          maxHeight="300px"
          emptyMessage="No countries found"
          collapsible
          isOpen={openListId === 'country'}
          onOpenChange={handleOpenChange('country')}
          collapsibleIcon={<MapPin className="h-4 w-4" />}
          collapsibleLabel="Select country..."
        />
      </div>

      {/* City Selection */}
      {selectedCountries.length > 0 && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Cities
            <span className="text-xs text-muted-foreground font-normal">(optional)  </span>
          </Label>
          <SearchableList
            items={cities}
            columns={cityColumns}
            selectionMode="multi"
            selectedIds={selectedCities.map(c => c.id)}
            onSelectionChange={onCityChange}
            selectAllFiltered
            idKey="id"
            searchPlaceholder="Search cities..."
            searchableKeys={['name', 'country']}
            defaultSort={{ key: 'name', dir: 'asc' }}
            pageSize={10}
            variant="table"
            maxHeight="300px"
            emptyMessage="No cities available for selected countries"
            collapsible
            isOpen={openListId === 'city'}
            onOpenChange={handleOpenChange('city')}
            collapsibleIcon={<MapPin className="h-4 w-4" />}
            collapsibleLabel="Select cities..."
          />
        </div>
      )}

      {/* Business Locations — Pro only */}
      {/* {isPro && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Business Locations
            <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </Label>
          <SearchableList
            items={MOCK_BUSINESSES}
            columns={businessColumns}
            selectionMode="multi"
            selectedIds={selectedBusinessIds}
            onSelectionChange={handleBusinessChange}
            selectAllFiltered
            idKey="id"
            searchPlaceholder="Search businesses..."
            searchableKeys={['name', 'address', 'city']}
            defaultSort={{ key: 'name', dir: 'asc' }}
            pageSize={10}
            variant="table"
            maxHeight="300px"
            emptyMessage="No businesses found"
            collapsible
            isOpen={openListId === 'business'}
            onOpenChange={handleOpenChange('business')}
            collapsibleIcon={<Building2 className="h-4 w-4" />}
            collapsibleLabel="Select business locations..."
          />
        </div>
      )} */}
    </div>
  );
}
