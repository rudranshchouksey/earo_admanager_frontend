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
  disabled: boolean;
}

export default function CampaignInventoryStep({ countries, cities, data, onCountryChange, onCityChange, isLoading, countryRef, disabled }: Props) {
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
          disabled={disabled}
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
            disabled={disabled}
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
