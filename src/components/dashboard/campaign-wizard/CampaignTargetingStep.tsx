import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Mic, Music, Radio, LayoutGrid, List, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
// import { useDevFlags } from '@/contexts/DevFlagsContext';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { SearchableList } from '@/components/ui/searchable-list';
import type { Column, FilterDef } from '@/components/ui/searchable-list';
// import dubaiStarsImg from '@/assets/podcasts/dubai-stars.png';
// import j2HubImg from '@/assets/podcasts/j2-hub.png';
import bitesizeBusinessImg from '@/assets/podcasts/bitesize-business.png';
import { PodcastAudience, StreamingAudience, TargetingSegment } from '@/services/targeting';
// import airDxbImg from '@/assets/podcasts/air-dxb.png';
// import cityLightsImg from '@/assets/podcasts/city-lights.png';
// import dubaiRealEstateImg from '@/assets/podcasts/dubai-real-estate.png';
// import expatsInDubaiImg from '@/assets/podcasts/expats-in-dubai.png';
// import dubaiPodcastImg from '@/assets/podcasts/dubai-podcast.png';
// import portraitImg from '@/assets/podcasts/portrait.png';
// import takingCareBusinessImg from '@/assets/podcasts/taking-care-business.png';
// import lovinDubaiImg from '@/assets/podcasts/lovin-dubai.png';
// import bigBreakfastImg from '@/assets/podcasts/big-breakfast.png';


const inventoryOptions = [
  { type: 'Podcast', description: 'Reach 60M+ listeners across top shows and networks, with 300+ targeting options to match your message with the right audience.' },
  { type: 'Streaming', description: 'Connect with 100M+ listeners on top music, radio, CTV and gaming apps, in English or Arabic with powerful precision targeting.' },
] as const;

const adPositionOptions = ['Pre-roll', 'Mid-roll', 'Post-roll'] as const;

const podcastTopicColumns: Column<{ id: string; name: string }>[] = [
  { key: 'name', label: 'Topic', sortable: true },
];


const podcastAudienceColumns: Column<{ id: string; name: string }>[] = [
  {
    key: 'name',
    label: 'Audience Segment',
    sortable: true,
    render: (_val, item) => (
      <div>
        <div className="font-medium text-foreground">{item.name}</div>
      </div>
    ),
  },
];

const streamingAudienceColumns: Column<StreamingAudience>[] = [
  { key: 'label', label: 'Segment', sortable: true },
  { key: 'category', label: 'Category', sortable: true },

];

const streamingTopicsColumns: Column<{ id: string; name: string }>[] = [
  { key: 'name', label: 'Genre / Content', sortable: true },
];

type InventoryMode = 'categories' | 'topics';

// Extended mock shows
const MOCK_SHOWS = [];

const MOCK_SAVED_AUDIENCES = [];
// Column definitions for SearchableList
const showColumns: Column<typeof MOCK_SHOWS[0]>[] = [
  {
    key: 'image',
    label: '',
    render: (_val, item) => (
      <div className="h-10 w-10 rounded-md overflow-hidden shrink-0 aspect-square">
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
    ),
  },
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'inventoryType',
    label: 'Type',
    sortable: true,
    render: (val) => {
      const v = String(val);
      const colorMap: Record<string, string> = {
        Podcast: 'bg-violet-100 text-violet-700',
        Streaming: 'bg-blue-100 text-blue-700',
        Radio: 'bg-amber-100 text-amber-700',
      };
      return (
        <span className={cn('inline-flex items-center text-xs px-2 py-0.5 rounded-full', colorMap[v] || '')}>
          {v}
        </span>
      );
    },
  },
  { key: 'topic', label: 'Topic', sortable: true },
  {
    key: 'description',
    label: 'Description',
    render: (val) => (
      <span className="text-sm text-muted-foreground line-clamp-2">{String(val)}</span>
    ),
  },
];

const showColumnsWithCountry: Column<typeof MOCK_SHOWS[0]>[] = [
  ...showColumns.slice(0, 4),
  { key: 'country', label: 'Country', sortable: true },
  ...showColumns.slice(4),
];

const showFilters: FilterDef[] = [
  {
    key: 'inventoryType',
    label: 'Type',
    options: [
      { value: 'Podcast', label: 'Podcast' },
      { value: 'Streaming', label: 'Streaming' },
      { value: 'Radio', label: 'Radio' },
    ],
  },
  {
    key: 'topic',
    label: 'Topic',
    options: [...new Set(MOCK_SHOWS.map((s) => s.topic))].sort().map((t) => ({ value: t, label: t })),
  },
];

const audienceColumns: Column<typeof MOCK_SAVED_AUDIENCES[0]>[] = [
  { key: 'name', label: 'Name', sortable: true },
  {
    key: 'type',
    label: 'Type',
    render: (val) => (val === 'retarget' ? 'Retargeting' : 'Saved'),
  },
  {
    key: 'size',
    label: 'Size',
    render: (val) => `~${val} users`,
  },
];

interface DeviceType {
  code: string;
  label: string;
  value: string;
}

const deviceColumns: Column<DeviceType>[] = [
  { key: 'label', label: 'Device Type', sortable: true }
];

interface TargetingData {
  gender: string;
  ageRanges: string[];
  deviceTypes: string[];
  inventoryType: string;
  podcastTopics: string[];
  podcastAudiences?: string[];
  streamingAudiences?: string[];
  streamingTopics?: string[];
  adPositions?: string[];
  selectedShows?: string[];
  savedAudiences?: string[];
}

interface Props {
  data: TargetingData;
  onChange: (data: TargetingData) => void;
  podcastTopics: string[];
  streamingTopics: string[];
  podcastAudiences: PodcastAudience[];
  streamingAudiences: StreamingAudience[];
  targetingSegments: TargetingSegment[];
  deviceTypes: TargetingSegment[];
}

export default function CampaignTargetingStep({ data, onChange, podcastTopics, streamingTopics, podcastAudiences, streamingAudiences, targetingSegments, deviceTypes }: Props) {
  const { isPro } = useSessionFlags();
  const [inventoryMode, setInventoryMode] = useState<InventoryMode>('categories');
  const [openListId, setOpenListId] = useState<string | null>(null);

  const handleOpenChange = (listId: string) => (open: boolean) => {
    setOpenListId(open ? listId : null);
  };
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
    // Mutually exclusive: clicking the already-selected type does nothing
    if (data.inventoryType ===type) return;
    onChange({ ...data, inventoryType: type });
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

  return (
    <div className="space-y-6">
      {/* Inventory Type — Mode Switcher (Pro only) */}
      {isPro && (
        <div className="space-y-3">
          
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
              Content Categories
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
              Interests & Shows
            </button>
          </div>
        </div>
      )}

      {/* Mode: Content Categories (Pro only) */}
      {isPro && inventoryMode === 'categories' && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {inventoryOptions.map(({ type, description }) => {
              const selected = data.inventoryType === type;
              return (
                <div
                  key={type}
                  onClick={() => toggleInventory(type)}
                  className={cn(
                    'border rounded-lg p-4 cursor-pointer transition-all',
                    selected
                      ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                      : 'border-border hover:border-[#C8E6C9]'
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn(
                      'h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0',
                      selected ? 'border-[#C8E6C9] bg-[#E6F4EA]' : 'border-muted-foreground/40'
                    )}>
                      {selected && <div className="h-2.5 w-2.5 rounded-full bg-foreground" />}
                    </div>
                    <span className="text-sm font-semibold">{type}</span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                </div>
              );
            })}
          </div>

          {data.inventoryType === 'Podcast' && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label>Podcast Topics</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">Choose the content genre where your ads will be placed.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <SearchableList
                  selectionMode="multi"
                  items={podcastTopics?.map(topic => ({ id: topic, name: topic })) || []}
                  columns={podcastTopicColumns}
                  selectedIds={data.podcastTopics}
                  onSelectionChange={(ids) => {
                    onChange({ ...data, podcastTopics: ids });
                  }}
                  variant="table"
                  collapsible
                  isOpen={openListId === 'podcast-topics'}
                  onOpenChange={handleOpenChange('podcast-topics')}
                  collapsibleLabel="Search or select segment"
                  searchPlaceholder="Search topics..."
                  emptyMessage="No topics match your search"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label>Podcast Audiences</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">Reach your desired audience directly based that targets podcasts with the content that the audience has a high affinity for.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <SearchableList
                  items={podcastAudiences?.map(audience => ({ id: audience.code, name: audience.name })) || []}
                  columns={podcastAudienceColumns}
                  selectionMode="multi"
                  selectedIds={data.podcastAudiences || []}
                  onSelectionChange={(ids) => onChange({ ...data, podcastAudiences: ids })}
                  selectAllFiltered
                  idKey="id"
                  searchPlaceholder="Search by name"
                  searchableKeys={['name']}
                  filters={null}
                  variant="table"
                  maxHeight="300px"
                  collapsible
                  isOpen={openListId === 'podcast-audiences'}
                  onOpenChange={handleOpenChange('podcast-audiences')}
                  collapsibleLabel="Search or select segments"
                  emptyMessage="No audiences match your search"
                />
              </div>


              <div className="space-y-3 hidden">
                <Label>
                  Saved & Re-targeting Audiences
                </Label>
                <SearchableList
                  items={MOCK_SAVED_AUDIENCES}
                  columns={audienceColumns}
                  selectionMode="multi"
                  selectedIds={savedAudiences}
                  onSelectionChange={(ids) => onChange({ ...data, savedAudiences: ids })}
                  selectAllFiltered
                  idKey="id"
                  searchPlaceholder="Search audiences..."
                  searchableKeys={['name', 'type']}
                  filters={[
                    {
                      key: 'type',
                      label: 'Type',
                      options: [
                        { value: 'retarget', label: 'Retargeting' },
                        { value: 'saved', label: 'Saved' },
                      ],
                    },
                  ]}
                  variant="table"
                  maxHeight="250px"
                  emptyMessage="No saved audiences"
                  collapsible
                  isOpen={openListId === 'saved-audiences-podcast'}
                  onOpenChange={handleOpenChange('saved-audiences-podcast')}
                  collapsibleLabel="Select audiences..."
                />
              </div>
            </>
          )}

          {data.inventoryType === 'Streaming' && (
            <>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label>Streaming Topics</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">Target listeners by the type of content they stream like music genres.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <SearchableList
                  items={streamingTopics?.map(topic => ({ id: topic, name: topic })) || []}
                  columns={streamingTopicsColumns}
                  selectionMode="multi"
                  selectedIds={data.streamingTopics || []}
                  onSelectionChange={(ids) => onChange({ ...data, streamingTopics: ids })}
                  selectAllFiltered
                  idKey="id"
                  searchPlaceholder="Search by genre, mood, or content type..."
                  searchableKeys={['name']}
                  variant="table"
                  maxHeight="300px"
                  collapsible
                  isOpen={openListId === 'streaming-topics'}
                  onOpenChange={handleOpenChange('streaming-topics')}
                  collapsibleLabel="Search or select segments"
                  emptyMessage="No content matches your search"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label>Streaming Audiences</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs text-sm">Target listeners based on their habits and behaviors.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <SearchableList
                  items={streamingAudiences || []}
                  columns={streamingAudienceColumns}
                  selectionMode="multi"
                  selectedIds={data.streamingAudiences || []}
                  onSelectionChange={(ids) => {console.log(ids); onChange({ ...data, streamingAudiences: ids })}}
                  selectAllFiltered
                  idKey="value"
                  searchPlaceholder="Search by category, behavior, or segment..."
                  searchableKeys={['label', 'category']}
                  variant="table"
                  maxHeight="300px"
                  collapsible
                  isOpen={openListId === 'streaming-audiences'}
                  onOpenChange={handleOpenChange('streaming-audiences')}
                  collapsibleLabel="Search or select segments"
                  emptyMessage="No segments match your search"
                />
              </div>

              <div className="space-y-3 hidden">
                <Label>Saved & Re-targeting Audiences</Label>
                <SearchableList
                  items={MOCK_SAVED_AUDIENCES}
                  columns={audienceColumns}
                  selectionMode="multi"
                  selectedIds={savedAudiences}
                  onSelectionChange={(ids) => onChange({ ...data, savedAudiences: ids })}
                  selectAllFiltered
                  idKey="id"
                  searchPlaceholder="Search audiences..."
                  searchableKeys={['name', 'type']}
                  filters={[{
                    key: 'type',
                    label: 'Type',
                    options: [
                      { value: 'retarget', label: 'Retargeting' },
                      { value: 'saved', label: 'Saved' },
                    ],
                  }]}
                  variant="table"
                  maxHeight="250px"
                  emptyMessage="No saved audiences"
                  collapsible
                  isOpen={openListId === 'saved-audiences-streaming'}
                  onOpenChange={handleOpenChange('saved-audiences-streaming')}
                  collapsibleLabel="Select audiences..."
                />
              </div>
            </>
          )}
        </>
      )}


      {/* Mode: Topics & Shows — SearchableList */}
      {inventoryMode === 'topics' && (
        <div className="space-y-3">
          <Label>Shows & Inventory</Label>
          <SearchableList
            items={MOCK_SHOWS}
            columns={showColumns}
            selectionMode="multi"
            selectedIds={selectedShows}
            onSelectionChange={(ids) => onChange({ ...data, selectedShows: ids })}
            selectAllFiltered
            idKey="id"
            searchPlaceholder="Search shows, interests, networks..."
            searchableKeys={['name', 'description', 'topic', 'inventoryType']}
            filters={showFilters}
            defaultSort={{ key: 'name', dir: 'asc' }}
            pageSize={10}
            variant="table"
            maxHeight="350px"
            emptyMessage="No shows match your search"
            collapsible
            isOpen={openListId === 'shows'}
            onOpenChange={handleOpenChange('shows')}
            collapsibleIcon={<List className="h-4 w-4" />}
            collapsibleLabel="Select shows & interests..."
          />
        </div>
      )}


      {/* Ad Position — Pro only */}
      {isPro && (
        <div className="space-y-3">
          <Label>Ad Position</Label>
          <div className="flex flex-wrap gap-2">
            {adPositionOptions.map(pos => {
              const selected = adPositions.includes(pos);
              return (
                <div
                  key={pos}
                  onClick={() => toggleAdPosition(pos)}
                  className={cn(
                    'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
                    selected
                      ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                      : 'border-border hover:border-[#C8E6C9]'
                  )}
                >
                  {selected && (
                    <div className="h-4 w-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{pos}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gender */}
      <div className="space-y-3">
        <Label>Gender</Label>
        <div className="flex flex-wrap gap-2">
          {[ {value: '', label: 'All'}, ...targetingSegments?.filter(segment => segment.code === 'gender')].map(({ value, label }) => {
            const selected = data.gender === value;
            return (
              <div
                key={value}
                onClick={() => onChange({ ...data, gender: value })}
                className={cn(
                  'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
                  selected
                    ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                    : 'border-border hover:border-[#C8E6C9]'
                )}
              >
                {selected && (
                  <div className="h-4 w-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 text-foreground" />
                  </div>
                )}
                <span className="text-sm font-medium">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Age Range */}
      <div className="space-y-3">
        <Label>Age Range</Label>
        <div className="flex flex-wrap gap-2">
          {targetingSegments.filter(segment => segment.code === "age").map((age) => {
            const selected = data.ageRanges.includes(age.value);
            return (
              <div
                key={age.value}
                onClick={() => toggleAge(age.value)}
                className={cn(
                  'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
                  selected
                    ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                    : 'border-border hover:border-[#C8E6C9]'
                )}
              >
                {selected && (
                  <div className="h-4 w-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0">
                    <Check className="h-2.5 w-2.5 text-foreground" />
                  </div>
                )}
                <span className="text-sm font-medium">{age.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Device Types — Pro only */}
      {isPro && (
        <div className="space-y-3">
          <Label>Device Type</Label>
          <p className="text-sm text-muted-foreground -mt-1">Target listeners by the type of device they are listening to.</p>
          <SearchableList
            items={deviceTypes.filter(device => device.code === 'MOBILE_AND_TABLETS' || device.code === 'DESKTOPS_AND_LAPTOPS')}
            columns={deviceColumns}
            selectionMode="multi"
            selectedIds={data.deviceTypes}
            onSelectionChange={(ids) => onChange({ ...data, deviceTypes: ids })}
            selectAllFiltered
            idKey="value"
            searchPlaceholder="Search device types..."
            searchableKeys={['label']}
            defaultSort={{ key: 'label', dir: 'asc' }}
            pageSize={10}
            variant="table"
            maxHeight="350px"
            emptyMessage="No device types match your search"
            collapsible
            isOpen={openListId === 'devices'}
            onOpenChange={handleOpenChange('devices')}
            collapsibleLabel="Select device types..."
          />
        </div>
      )}

    </div>
  );
}
