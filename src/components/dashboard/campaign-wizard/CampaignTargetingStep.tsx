import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Users, User, Smartphone, Monitor, Speaker, Tv, CalendarDays, Check, Mic, Music, Radio, Search, X, Bookmark, LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { useTranslation } from '@/contexts/TranslationContext';

const ageRanges = ['18-24', '25-34', '35-44', '45-54', '55-65', '65+'];

const deviceOptions = [
  { value: 'Mobile', icon: Smartphone },
  { value: 'Desktop', icon: Monitor },
  { value: 'Smart Speaker', icon: Speaker },
  { value: 'Connected TV', icon: Tv },
] as const;

const inventoryOptions = [
  { type: 'Podcast', icon: Mic, descKey: 'wizard.targeting.podcast_desc' },
  { type: 'Streaming', icon: Music, descKey: 'wizard.targeting.streaming_desc' },
  { type: 'Radio', icon: Radio, descKey: 'wizard.targeting.radio_desc' },
] as const;

const adPositionOptions = ['Pre-roll', 'Mid-roll', 'Post-roll'] as const;

const podcastTopics = ['News & Politics', 'True Crime', 'Comedy', 'Business', 'Technology', 'Health & Wellness', 'Sports', 'Education', 'Entertainment', 'Society & Culture'];

type InventoryMode = 'categories' | 'topics';

// Extended mock shows with more data for grid display
const MOCK_SHOWS = [
  { id: '1', name: 'The Daily', inventoryType: 'Podcast', topic: 'News & Politics', audience: '2.1M', country: 'US', description: 'Daily news deep dives from The New York Times' },
  { id: '2', name: 'Crime Junkie', inventoryType: 'Podcast', topic: 'True Crime', audience: '1.8M', country: 'US', description: 'Weekly true crime stories with host Ashley Flowers' },
  { id: '3', name: 'SmartLess', inventoryType: 'Podcast', topic: 'Comedy', audience: '1.2M', country: 'US', description: 'Celebrity interviews with Bateman, Arnett and Hayes' },
  { id: '4', name: 'How I Built This', inventoryType: 'Podcast', topic: 'Business', audience: '950K', country: 'US', description: 'Stories behind successful companies and movements' },
  { id: '5', name: 'Lex Fridman Podcast', inventoryType: 'Podcast', topic: 'Technology', audience: '3.5M', country: 'US', description: 'Conversations about AI, science, and philosophy' },
  { id: '6', name: 'Huberman Lab', inventoryType: 'Podcast', topic: 'Health & Wellness', audience: '4.2M', country: 'US', description: 'Neuroscience tools for everyday life' },
  { id: '7', name: 'New Heights', inventoryType: 'Podcast', topic: 'Sports', audience: '2.8M', country: 'US', description: 'Football and culture with the Kelce brothers' },
  { id: '8', name: 'Anghami Sessions', inventoryType: 'Streaming', topic: 'Music', audience: '850K', country: 'AE', description: 'Live music sessions from Arab artists on Anghami' },
  { id: '9', name: 'Arab Radio Live', inventoryType: 'Radio', topic: 'Entertainment', audience: '1.5M', country: 'AE', description: 'Top-rated Arabic radio entertainment show' },
  { id: '10', name: 'Finyal Media', inventoryType: 'Podcast', topic: 'Society & Culture', audience: '400K', country: 'AE', description: 'Arabic storytelling and documentary podcasts' },
  { id: '11', name: 'Spotify Hits', inventoryType: 'Streaming', topic: 'Music', audience: '12M', country: 'GB', description: 'Top chart hits playlist on Spotify UK' },
  { id: '12', name: 'BBC Radio 1', inventoryType: 'Radio', topic: 'Music', audience: '8M', country: 'GB', description: 'UK\'s biggest youth radio station' },
  { id: '13', name: 'Desert Drive FM', inventoryType: 'Radio', topic: 'Entertainment', audience: '600K', country: 'SA', description: 'Saudi Arabia\'s favourite drive-time show' },
  { id: '14', name: 'TED Radio Hour', inventoryType: 'Podcast', topic: 'Education', audience: '1.1M', country: 'US', description: 'TED Talks turned into compelling radio stories' },
  { id: '15', name: 'Stuff You Should Know', inventoryType: 'Podcast', topic: 'Education', audience: '1.6M', country: 'US', description: 'Exploring how everything works since 2008' },
];

const MOCK_SAVED_AUDIENCES = [
  { id: 'sa1', name: 'Website Visitors (30d)', type: 'retarget', size: '12,400' },
  { id: 'sa2', name: 'Cart Abandoners', type: 'retarget', size: '3,200' },
  { id: 'sa3', name: 'UAE Tech Enthusiasts 25-44', type: 'saved', size: '85,000' },
  { id: 'sa4', name: 'GCC Female 18-34', type: 'saved', size: '120,000' },
];

interface TargetingData {
  gender: string;
  ageRanges: string[];
  deviceTypes: string[];
  inventoryTypes: string[];
  podcastTopics: string[];
  adPositions?: string[];
  selectedShows?: string[];
  savedAudiences?: string[];
}

interface Props {
  data: TargetingData;
  onChange: (data: TargetingData) => void;
  multiCountry?: boolean;
}

export default function CampaignTargetingStep({ data, onChange, multiCountry = false }: Props) {
  const { t } = useTranslation();
  const { isPro } = useSessionFlags();

  const genderOptions = [
    { value: 'all', label: t('wizard.targeting.all'), icon: Users },
    { value: 'male', label: t('wizard.targeting.male'), icon: User },
    { value: 'female', label: t('wizard.targeting.female'), icon: User },
  ] as const;
  const [inventoryMode, setInventoryMode] = useState<InventoryMode>('categories');
  const [showSearch, setShowSearch] = useState('');
  const [topicFilter, setTopicFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  const adPositions = data.adPositions || ['Pre-roll', 'Mid-roll', 'Post-roll'];
  const selectedShows = data.selectedShows || [];
  const savedAudiences = data.savedAudiences || [];

  const toggleAge = (age: string) => {
    const next = data.ageRanges.includes(age)
      ? data.ageRanges.filter((a) => a !== age)
      : [...data.ageRanges, age];
    onChange({ ...data, ageRanges: next });
  };

  const toggleDevice = (device: string) => {
    const next = data.deviceTypes.includes(device)
      ? data.deviceTypes.filter((d) => d !== device)
      : [...data.deviceTypes, device];
    onChange({ ...data, deviceTypes: next });
  };

  const toggleInventory = (type: string) => {
    const next = data.inventoryTypes.includes(type)
      ? data.inventoryTypes.filter((t) => t !== type)
      : [...data.inventoryTypes, type];
    onChange({ ...data, inventoryTypes: next });
  };

  const toggleTopic = (topic: string) => {
    const next = data.podcastTopics.includes(topic)
      ? data.podcastTopics.filter((t) => t !== topic)
      : [...data.podcastTopics, topic];
    onChange({ ...data, podcastTopics: next });
  };

  const toggleAdPosition = (pos: string) => {
    const next = adPositions.includes(pos)
      ? adPositions.filter(p => p !== pos)
      : [...adPositions, pos];
    onChange({ ...data, adPositions: next });
  };

  const toggleShow = (showId: string) => {
    const next = selectedShows.includes(showId)
      ? selectedShows.filter(s => s !== showId)
      : [...selectedShows, showId];
    onChange({ ...data, selectedShows: next });
  };

  const toggleSavedAudience = (audienceId: string) => {
    const next = savedAudiences.includes(audienceId)
      ? savedAudiences.filter(a => a !== audienceId)
      : [...savedAudiences, audienceId];
    onChange({ ...data, savedAudiences: next });
  };

  // Filter shows for grid
  const filteredShows = MOCK_SHOWS.filter(s => {
    const matchesSearch = !showSearch ||
      s.name.toLowerCase().includes(showSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(showSearch.toLowerCase());
    const matchesTopic = !topicFilter || s.topic === topicFilter;
    const matchesType = !typeFilter || s.inventoryType === typeFilter;
    return matchesSearch && matchesTopic && matchesType;
  });

  // Unique topics & types for filter dropdowns
  const allTopics = [...new Set(MOCK_SHOWS.map(s => s.topic))].sort();
  const allTypes = [...new Set(MOCK_SHOWS.map(s => s.inventoryType))].sort();

  return (
    <div className="space-y-6">
      {/* Inventory Type — Mode Switcher (Pro only) */}
      {isPro && (
        <div className="space-y-3">
          <Label>{t('wizard.targeting.inventory_type')}</Label>
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setInventoryMode('categories')}
              className={cn(
                'flex-1 text-sm py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5',
                inventoryMode === 'categories'
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              {t('wizard.targeting.content_categories')}
            </button>
            <button
              type="button"
              onClick={() => setInventoryMode('topics')}
              className={cn(
                'flex-1 text-sm py-1.5 px-3 rounded-md transition-colors flex items-center justify-center gap-1.5',
                inventoryMode === 'topics'
                  ? 'bg-background text-foreground shadow-sm font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <List className="h-3.5 w-3.5" />
              {t('wizard.targeting.topics_shows')}
            </button>
          </div>
        </div>
      )}

      {/* Mode: Content Categories (Pro only) */}
      {isPro && inventoryMode === 'categories' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {inventoryOptions.map(({ type, icon: Icon, descKey }) => {
              const selected = data.inventoryTypes.includes(type);
              return (
                <div
                  key={type}
                  onClick={() => toggleInventory(type)}
                  className={cn(
                    'border rounded-lg p-3 cursor-pointer transition-all relative',
                    selected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  {selected && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <Icon className={cn('h-5 w-5 mb-1', selected ? 'text-primary' : 'text-muted-foreground')} />
                  <p className="text-sm font-medium">{t(`wizard.targeting.${type.toLowerCase()}`)}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t(descKey)}</p>
                </div>
              );
            })}
          </div>

          {data.inventoryTypes.includes('Podcast') && (
            <div className="space-y-3">
              <Label>{t('wizard.targeting.podcast_topics')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {podcastTopics.map((topic) => (
                  <label key={topic} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={data.podcastTopics.includes(topic)}
                      onCheckedChange={() => toggleTopic(topic)}
                    />
                    <span className="text-sm">{topic}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Express mode: show topics directly */}
      {!isPro && (
        <div className="space-y-3">
          <Label>{t('wizard.targeting.topics')}</Label>
          <div className="grid grid-cols-2 gap-2">
            {podcastTopics.map((topic) => (
              <label key={topic} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={data.podcastTopics.includes(topic)}
                  onCheckedChange={() => toggleTopic(topic)}
                />
                <span className="text-sm">{topic}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Mode: Topics & Shows — searchable grid */}
      {inventoryMode === 'topics' && (
        <div className="space-y-3">
          {/* Selected shows chips */}
          {selectedShows.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedShows.map(id => {
                const show = MOCK_SHOWS.find(s => s.id === id);
                if (!show) return null;
                return (
                  <span key={id} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full">
                    {show.name}
                    <button type="button" onClick={() => toggleShow(id)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('wizard.targeting.search_placeholder')}
                value={showSearch}
                onChange={e => setShowSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t('wizard.targeting.all_types')}</option>
              {allTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select
              value={topicFilter}
              onChange={e => setTopicFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">{t('wizard.targeting.all_topics')}</option>
              {allTopics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Grid table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="w-10 px-3 py-2.5"></th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('wizard.targeting.name')}</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('wizard.targeting.type')}</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('wizard.targeting.topic')}</th>
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('wizard.targeting.audience')}</th>
                    {multiCountry && (
                      <th className="text-left px-3 py-2.5 font-medium text-muted-foreground">{t('wizard.targeting.country')}</th>
                    )}
                    <th className="text-left px-3 py-2.5 font-medium text-muted-foreground hidden md:table-cell">{t('wizard.targeting.description')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredShows.length === 0 ? (
                    <tr>
                      <td colSpan={multiCountry ? 7 : 6} className="px-3 py-6 text-center text-muted-foreground">
                        {t('wizard.targeting.no_shows')}
                      </td>
                    </tr>
                  ) : (
                    filteredShows.map(show => {
                      const selected = selectedShows.includes(show.id);
                      return (
                        <tr
                          key={show.id}
                          onClick={() => toggleShow(show.id)}
                          className={cn(
                            'cursor-pointer transition-colors hover:bg-accent/50',
                            selected && 'bg-primary/5'
                          )}
                        >
                          <td className="px-3 py-2.5">
                            <Checkbox checked={selected} tabIndex={-1} />
                          </td>
                          <td className="px-3 py-2.5 font-medium text-foreground whitespace-nowrap">{show.name}</td>
                          <td className="px-3 py-2.5">
                            <span className={cn(
                              'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                              show.inventoryType === 'Podcast' && 'bg-violet-100 text-violet-700',
                              show.inventoryType === 'Streaming' && 'bg-blue-100 text-blue-700',
                              show.inventoryType === 'Radio' && 'bg-amber-100 text-amber-700',
                            )}>
                              {show.inventoryType}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{show.topic}</td>
                          <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{show.audience}</td>
                          {multiCountry && (
                            <td className="px-3 py-2.5 text-muted-foreground whitespace-nowrap">{show.country}</td>
                          )}
                          <td className="px-3 py-2.5 text-muted-foreground hidden md:table-cell max-w-[200px] truncate">{show.description}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{t('wizard.targeting.shows_selected', { count: String(filteredShows.length), selected: String(selectedShows.length) })}</p>
        </div>
      )}

      {/* Ad Position — Pro only */}
      {isPro && (
        <div className="space-y-3">
          <Label>{t('wizard.targeting.ad_position')}</Label>
          <div className="flex flex-wrap gap-2">
            {adPositionOptions.map(pos => {
              const selected = adPositions.includes(pos);
              return (
                <button
                  key={pos}
                  type="button"
                  onClick={() => toggleAdPosition(pos)}
                  className={cn(
                    'px-4 py-2 rounded-lg border text-sm font-medium transition-colors',
                    selected
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  )}
                >
                  {selected && <Check className="h-3 w-3 inline mr-1.5 -mt-0.5" />}
                  {pos}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Gender */}
      {(
        <div className="space-y-3">
          <Label>{t('wizard.targeting.gender')}</Label>
          <div className="grid grid-cols-3 gap-3">
            {genderOptions.map(({ value, label, icon: Icon }) => {
              const selected = data.gender === value;
              return (
                <div
                  key={value}
                  onClick={() => onChange({ ...data, gender: value })}
                  className={cn(
                    'border rounded-lg p-3 cursor-pointer transition-all flex flex-col items-center text-center relative',
                    selected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  {selected && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <Icon className={cn('h-5 w-5 mb-1', selected ? 'text-primary' : 'text-muted-foreground')} />
                  <p className="text-sm font-medium">{label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Age Range */}
      {(
        <div className="space-y-3">
          <Label>{t('wizard.targeting.age_range')}</Label>
          <div className="flex flex-wrap gap-2">
            {ageRanges.map((age) => {
              const selected = data.ageRanges.includes(age);
              return (
                <div
                  key={age}
                  onClick={() => toggleAge(age)}
                  className={cn(
                    'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
                    selected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  {selected && (
                    <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-primary-foreground" />
                    </div>
                  )}
                  <CalendarDays className={cn('h-4 w-4', selected ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-sm font-medium">{age}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Device Types — Pro only */}
      {isPro && (
        <div className="space-y-3">
          <Label>{t('wizard.targeting.device_types')}</Label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {deviceOptions.map(({ value, icon: Icon }) => {
              const selected = data.deviceTypes.includes(value);
              return (
                <div
                  key={value}
                  onClick={() => toggleDevice(value)}
                  className={cn(
                    'border rounded-lg p-3 cursor-pointer transition-all flex flex-col items-center text-center relative',
                    selected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  {selected && (
                    <div className="absolute top-2 right-2 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                  <Icon className={cn('h-5 w-5 mb-1', selected ? 'text-primary' : 'text-muted-foreground')} />
                  <p className="text-sm font-medium">{value}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Saved & Re-targeting Audiences — Pro only */}
      {isPro && (
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            {t('wizard.targeting.saved_audiences')}
          </Label>
          <div className="space-y-2">
            {MOCK_SAVED_AUDIENCES.map(audience => {
              const selected = savedAudiences.includes(audience.id);
              return (
                <button
                  key={audience.id}
                  type="button"
                  onClick={() => toggleSavedAudience(audience.id)}
                  className={cn(
                    'w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors',
                    selected
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox checked={selected} tabIndex={-1} />
                    <div>
                      <p className="text-sm font-medium">{audience.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {audience.type === 'retarget' ? `🔄 ${t('wizard.targeting.retargeting')}` : `📁 ${t('wizard.targeting.saved')}`} · {t('wizard.targeting.users', { count: audience.size })}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
