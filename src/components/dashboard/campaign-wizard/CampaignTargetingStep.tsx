import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Check, Mic, Music, Radio, LayoutGrid, List, Info, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
// import { useDevFlags } from '@/contexts/DevFlagsContext';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { SearchableList } from '@/components/ui/searchable-list';
import type { Column, FilterDef } from '@/components/ui/searchable-list';
import { SearchableDropdown } from '@/components/ui/searchable-dropdown';
// import dubaiStarsImg from '@/assets/podcasts/dubai-stars.png';
// import j2HubImg from '@/assets/podcasts/j2-hub.png';
import bitesizeBusinessImg from '@/assets/podcasts/bitesize-business.png';
import { ContentLanguage, Country, PodcastAudience, StreamingAudience, TargetingSegment } from '@/services/targeting';
import { Input } from '@/components/ui/input';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  { type: 'Podcast', description: 'Top shows and networks with 300+ contextual targeting options.' },
  { type: 'Streaming', description: 'Music, radio and CTV apps with genre and mood targeting.' },
  { type: 'Gaming', description: 'In-game audio across mobile and console gaming environments.' },
] as const;

const adPositionOptions = [
  {
    "code": "position",
    "category": "Audio Position",
    "value": "pre-roll",
    "label": "Pre-Roll"
  },
  {
      "code": "position",
      "category": "Audio Position",
      "value": "mid-roll",
      "label": "Mid-Roll"
  },
  {
      "code": "position",
      "category": "Audio Position",
      "value": "post-roll",
      "label": "Post-Roll"
},
] as const;

const podcastTopicColumns: Column<{ id: string; name: string }>[] = [
  { key: 'name', label: 'Topic', sortable: true },
];

const contentLanguageColumns: Column<{ id: string; name: string; label: string }>[] = [
  { key: 'name', label: 'Language', sortable: true },
  { key: 'label', label: 'Label', sortable: true },
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
  podcastAudiences: string[];
  streamingAudiences: string[];
  streamingTopics: string[];
  adPositions: string[];
  selectedShows: string[];
  savedAudiences: string[];
  contentLanguages: string[];
}

interface Props {
  data: TargetingData;
  onChange: (data: TargetingData) => void;
  contentLanguages: ContentLanguage[];
  podcastTopics: string[];
  streamingTopics: string[];
  podcastAudiences: PodcastAudience[];
  streamingAudiences: StreamingAudience[];
  targetingSegments: TargetingSegment[];
  deviceTypes: TargetingSegment[];
  disabled: boolean;
}

export default function CampaignTargetingStep({ data, onChange, contentLanguages, podcastTopics, streamingTopics, podcastAudiences, streamingAudiences, targetingSegments, deviceTypes, disabled }: Props) {
  const { isPro } = useSessionFlags();
  const [inventoryMode, setInventoryMode] = useState<InventoryMode>('categories');
  const [openListId, setOpenListId] = useState<string | null>(null);
  const [podcastOptionsOpen, setPodcastOptionsOpen] = useState(false);
  const [streamingOptionsOpen, setStreamingOptionsOpen] = useState(false);
  const [gamingOptionsOpen, setGamingOptionsOpen] = useState(false);

  const handleOpenChange = (listId: string) => (open: boolean) => {
    setOpenListId(open ? listId : null);
  };
  const adPositions = data.adPositions || ['Pre-roll', 'Mid-roll', 'Post-roll'];
  const selectedShows = data.selectedShows || [];
  const savedAudiences = data.savedAudiences || [];

  const toggleAge = (age: string) => {

    if(age === 'ALL') {
      onChange({ ...data, ageRanges: targetingSegments.filter(segment => segment.code === "age").map(segment => segment.value) });
      return;
    }


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
    if(pos === 'ALL') {
      onChange({ ...data, adPositions: adPositionOptions.map(p => p.value) });
      return;
    }
    const next = adPositions.includes(pos)
      ? adPositions.filter(p => p !== pos)
      : [...adPositions, pos];
    onChange({ ...data, adPositions: next });
  };

  const setInventoryType = (type: string) => {
    const _type = data.inventoryType.split(',').includes(type) ? data.inventoryType.split(',').filter(t => t !== type).join(',') : [...data.inventoryType.split(','), type].join(',');
    onChange({ ...data, inventoryType: _type });
  };

  const isPodcastSelected = data.inventoryType?.includes('Podcast');
  const isStreamingSelected = data.inventoryType?.includes('Streaming');
  const isGamingSelected = data.inventoryType?.includes('Gaming');

  const podcastAudienceMap = podcastAudiences.reduce((acc, audience) => {
    acc[audience.code] = audience.name;
    return acc;
  }, {});
  const contentLanguageMap = contentLanguages.reduce((acc, language) => {
    acc[language.code] = language.label || language.name;
    return acc;
  }, {});

  const streamingAudienceMap = streamingAudiences.reduce((acc, audience) => {
    acc[audience.value] = audience.label;
    return acc;
  }, {});


  const togglePodcastAudience = (audience: string) => {
    const next = data.podcastAudiences.includes(audience)
      ? data.podcastAudiences.filter((a) => a !== audience)
      : [...data.podcastAudiences, audience];
    onChange({ ...data, podcastAudiences: next });
  };

  const toggleContentLanguage = (language: string) => {
    const next = data.contentLanguages.includes(language)
      ? data.contentLanguages.filter((l) => l !== language)
      : [...data.contentLanguages, language];
    onChange({ ...data, contentLanguages: next });
  };

  const toggleStreamingTopic = (topic: string) => {
    const next = data.streamingTopics.includes(topic)
      ? data.streamingTopics.filter((t) => t !== topic)
      : [...data.streamingTopics, topic];
    onChange({ ...data, streamingTopics: next });
  };

  const toggleStreamingAudience = (audience: string) => {
    const next = data.streamingAudiences.includes(audience)
      ? data.streamingAudiences.filter((a) => a !== audience)
      : [...data.streamingAudiences, audience];
    onChange({ ...data, streamingAudiences: next });
  };

  return (
    <div className="space-y-6">
      {/* Inventory Type — Mode Switcher (Pro only) */}
      {isPro && (
        <div className="space-y-3 hidden">
          
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
          <div className="grid grid-cols-1 gap-3">
            <div
              className={cn(
                'border rounded-lg p-4 cursor-pointer transition-all',
                isPodcastSelected
                  ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                  : 'border-border hover:border-[#C8E6C9]'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className='flex items-center gap-2' onClick={() => setInventoryType('Podcast')}>
                  <Checkbox 
                    checked={isPodcastSelected} 
                    className='peer shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-5 w-5'
                  />
                  <span className="text-sm font-semibold">Podcast</span>
                </div>
                {isPodcastSelected && (
                  <button
                    type="button"
                    aria-label={podcastOptionsOpen ? 'Collapse podcast options' : 'Expand podcast options'}
                    aria-expanded={podcastOptionsOpen}
                    className="rounded-md p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPodcastOptionsOpen((open) => !open);
                    }}
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        podcastOptionsOpen && 'rotate-180',
                      )}
                    />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{inventoryOptions.find(option => option.type === 'Podcast')?.description}</p>
              {isPodcastSelected && podcastOptionsOpen && (
                  <div
                    className="mt-4 space-y-4"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label>Podcast Topics</Label>
                      </div>
                      {
                          data.podcastTopics.length > 0 && ( 
                            <div className="flex flex-wrap gap-1">
                            {data.podcastTopics?.map((topic) => (
                              <span key={topic} className="flex flex-row items-center gap-2 text-xs text-muted-foreground hover:text-foreground mx-2 px-2 py-1 rounded-md bg-white w-auto">
                                {topic}  <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => toggleTopic(topic)} />
                              </span>
                            ))}
                            </div>
                          )
                        }
                      <SearchableDropdown
                        items={podcastTopics?.map((topic) => ({
                          id: topic,
                          label: topic,
                          searchText: topic,
                        })) || []}
                        selectedIds={data.podcastTopics || []}
                        onSelectionChange={(ids) => {
                          onChange({ ...data, podcastTopics: ids });
                        }}
                        selectionMode="multi"
                        placeholder="Search or select segment"
                        searchPlaceholder="Search topics..."
                        emptyMessage="No topics match your search"
                        disabled={disabled}
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label>Podcast Audiences</Label>
                      </div>
                      {
                          data.podcastAudiences.length > 0 && ( 
                            <div className="flex flex-wrap gap-1">
                            {data.podcastAudiences?.map((audience) => (
                              <span key={audience} className="flex flex-row items-center gap-2 text-xs text-muted-foreground hover:text-foreground mx-2 px-2 py-1 rounded-md bg-white w-auto">
                                {podcastAudienceMap[audience]}
                                <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => togglePodcastAudience(audience)} />
                              </span>
                            ))}
                            </div>
                          )
                        }
                      <SearchableDropdown
                        items={podcastAudiences?.map((audience) => ({
                          id: audience.code,
                          label: audience.name,
                          searchText: audience.name,
                        })) || []}
                        selectedIds={data.podcastAudiences || []}
                        onSelectionChange={(ids) =>
                          onChange({ ...data, podcastAudiences: ids })
                        }
                        selectionMode="multi"
                        placeholder="Search or select segments"
                        searchPlaceholder="Search by name"
                        emptyMessage="No audiences match your search"
                        disabled={disabled}
                      />
                    </div>


                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label>Content Languages</Label>
                      </div>
                      {
                        data.contentLanguages.length > 0 && ( 
                          <div className="flex flex-wrap gap-1">
                          {data.contentLanguages?.map((language) => (
                            <span key={language} className="flex flex-row items-center gap-2 text-xs text-muted-foreground hover:text-foreground mx-2 px-2 py-1 rounded-md bg-white w-auto">
                              {contentLanguageMap[language]}
                              <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => toggleContentLanguage(language)} />
                            </span>
                          ))}
                          </div>
                        )
                      }
                      <SearchableDropdown
                        items={contentLanguages?.map((language) => ({
                          id: language.code,
                          label: language.label || language.name,
                          searchText: `${language.name} ${language.label || ""} ${language.code}`,
                        })) || []}
                        selectedIds={data.contentLanguages || []}
                        onSelectionChange={(ids) =>
                          onChange({ ...data, contentLanguages: ids })
                        }
                        selectionMode="multi"
                        placeholder="Search or select segments"
                        searchPlaceholder="Search by language"
                        emptyMessage="No languages match your search"
                        disabled={disabled}
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
                        disabled={disabled}
                      />
                    </div>
                  </div>
              )}
            </div>


            <div
              className={cn(
                'border rounded-lg p-4 cursor-pointer transition-all',
                isStreamingSelected
                  ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                  : 'border-border hover:border-[#C8E6C9]'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className='flex items-center gap-2' onClick={() => setInventoryType('Streaming')}>
                  <Checkbox 
                    checked={isStreamingSelected} 
                    className='peer shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-5 w-5'
                  />
                  <span className="text-sm font-semibold">Streaming</span>
                </div>
                {isStreamingSelected && (
                  <button
                    type="button"
                    aria-label={streamingOptionsOpen ? 'Collapse streaming options' : 'Expand streaming options'}
                    aria-expanded={streamingOptionsOpen}
                    className="rounded-md p-1 text-muted-foreground hover:bg-black/5 hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setStreamingOptionsOpen((open) => !open);
                    }}
                  >
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 transition-transform',
                        streamingOptionsOpen && 'rotate-180',
                      )}
                    />
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{inventoryOptions.find(option => option.type === 'Streaming')?.description}</p>
              {isStreamingSelected && streamingOptionsOpen && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label>Streaming Topics</Label>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {data.streamingTopics?.map((topic) => (
                        <span key={topic} className="flex flex-row items-center gap-2 text-xs text-muted-foreground hover:text-foreground mx-2 px-2 py-1 rounded-md bg-white w-auto">
                          {topic} <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => toggleStreamingTopic(topic)} />
                        </span>
                      ))}
                    </div>
                    <SearchableDropdown
                      items={streamingTopics?.map((topic) => ({
                        id: topic,
                        label: topic,
                        searchText: topic,
                      })) || []}
                      selectedIds={data.streamingTopics || []}
                      onSelectionChange={(ids) =>
                        onChange({ ...data, streamingTopics: ids })
                      }
                      selectionMode="multi"
                      placeholder="Search or select segments"
                      searchPlaceholder="Search by genre, mood, or content type..."
                      emptyMessage="No content matches your search"
                      disabled={disabled}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label>Streaming Audiences</Label>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {data.streamingAudiences?.map((audience) => (
                        <span key={audience} className="flex flex-row items-center gap-2 text-xs text-muted-foreground hover:text-foreground mx-2 px-2 py-1 rounded-md bg-white w-auto">
                          {streamingAudienceMap[audience]} <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => toggleStreamingAudience(audience)} />
                        </span>
                      ))}
                    </div>
                    <SearchableDropdown
                      items={streamingAudiences?.map((audience) => ({
                        id: audience.value,
                        label: audience.label,
                        searchText: `${audience.label} ${audience.category || ""}`,
                      })) || []}
                      selectedIds={data.streamingAudiences || []}
                      onSelectionChange={(ids) =>
                        onChange({ ...data, streamingAudiences: ids })
                      }
                      selectionMode="multi"
                      placeholder="Search or select segments"
                      searchPlaceholder="Search by category, behavior, or segment..."
                      emptyMessage="No segments match your search"
                      disabled={disabled}
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
                </div>
              )}
            </div>


            <div
              onClick={() => {
                setInventoryType('Gaming');
                if (!isGamingSelected) setGamingOptionsOpen(true);
              }}
              className={cn(
                'border rounded-lg p-4 cursor-pointer transition-all',
                isGamingSelected
                  ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                  : 'border-border hover:border-[#C8E6C9]'
              )}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className='flex items-center gap-2'>
                  <Checkbox 
                    checked={isGamingSelected} 
                    onChange={() => setInventoryType('Gaming')} 
                    className='peer shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-5 w-5'
                  />
                  <span className="text-sm font-semibold">Gaming</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{inventoryOptions.find(option => option.type === 'Gaming')?.description}</p>
            </div>


          </div>

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
            disabled={disabled}
          />
        </div>
      )}


      {/* Ad Position — Pro only */}
      {isPro && (
        <div className="space-y-3">
          <Label>Ad Position</Label>
          <div className="flex flex-wrap gap-2">
            <div
              key={'ALL'}
              onClick={() => !disabled ? toggleAdPosition('ALL') : undefined}
              className={cn(
                'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
                adPositions.length === 3
                  ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                  : 'border-border hover:border-[#C8E6C9]',
                  disabled ? 'opacity-50 cursor-not-allowed' : ''
              )}
            >
              {adPositions.length === 3 && (
                <div className="h-4 w-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0">
                  <Check className="h-2.5 w-2.5 text-foreground" />
                </div>
              )}
              <span className="text-sm font-medium">All</span>
            </div>

            {adPositionOptions.map(pos => {
              const selected = adPositions.includes(pos.value);
              return (
                <div
                  key={pos.value}
                  onClick={() => !disabled ? toggleAdPosition(pos.value) : undefined}
                  className={cn(
                    'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
                    selected
                      ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                      : 'border-border hover:border-[#C8E6C9]',
                      disabled ? 'opacity-50 cursor-not-allowed' : ''
                  )}
                >
                  {selected && (
                    <div className="h-4 w-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0">
                      <Check className="h-2.5 w-2.5 text-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium">{pos.label}</span>
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

          <div
            key={'ALL'}
            onClick={() => !disabled ? onChange({ ...data, gender: '' }) : undefined}
            className={cn(
              'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
              data.gender === ''
                ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                : 'border-border hover:border-[#C8E6C9]',
                disabled ? 'opacity-50 cursor-not-allowed' : ''
            )}
          >
            {data.gender === '' && (
              <div className="h-4 w-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0">
                <Check className="h-2.5 w-2.5 text-foreground" />
              </div>
            )}
            <span className="text-sm font-medium">All</span>
          </div>

          {[...targetingSegments?.filter(segment => segment.code === 'gender')].map(({ value, label }) => {
            const selected = data.gender === value;
            return (
              <div
                key={value}
                onClick={() => !disabled ? onChange({ ...data, gender: value }) : undefined}
                className={cn(
                  'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
                  (selected || data.gender === '')
                    ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                    : 'border-border hover:border-[#C8E6C9]',
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
                )}
              >
                {(selected || data.gender === '') && (
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

          <div
            key={'ALL'}
            onClick={() => !disabled ? toggleAge('ALL') : undefined}
            className={cn(
              'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
              targetingSegments.filter(segment => segment.code === "age").length === data.ageRanges.length
                ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                : 'border-border hover:border-[#C8E6C9]',
                disabled ? 'opacity-50 cursor-not-allowed' : ''
            )}
            >
            { ( targetingSegments.filter(segment => segment.code === "age").length === data.ageRanges.length) && (
              <div className="h-4 w-4 rounded-full bg-[#E6F4EA] flex items-center justify-center shrink-0">
                <Check className="h-2.5 w-2.5 text-foreground" />
              </div>
            )}
            <span className="text-sm font-medium">{'All'}</span>
          </div>

          {targetingSegments.filter(segment => segment.code === "age").map((age) => {
            const selected = data.ageRanges.includes(age.value);
            return (
              <div
                key={age.value}
                onClick={() => !disabled ? toggleAge(age.value) : undefined}
                className={cn(
                  'border rounded-lg px-3 py-2 cursor-pointer transition-all flex items-center gap-1.5',
                  selected
                    ? 'border-[#C8E6C9] bg-[#E6F4EA] ring-1 ring-[#E6F4EA]'
                    : 'border-border hover:border-[#C8E6C9]',
                    disabled ? 'opacity-50 cursor-not-allowed' : ''
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
          <div className="flex flex-wrap gap-1">
            {data.deviceTypes?.map((device) => (
              <span key={device} className="flex flex-row items-center gap-2 text-xs text-muted-foreground hover:text-foreground mx-2 px-2 py-1 rounded-md bg-[#E6F4EA] w-auto">
                {device?.replace(/_/g, ' ')} <X className="h-3.5 w-3.5 cursor-pointer" onClick={() => toggleDevice(device)} />
              </span>
            ))}
          </div>
          <SearchableDropdown
            items={deviceTypes
              .filter(
                (device) =>
                  device.code === 'MOBILE_AND_TABLETS' ||
                  device.code === 'DESKTOPS_AND_LAPTOPS',
              )
              .map((device) => ({
                id: device.value,
                label: device.label,
                searchText: device.label,
              }))}
            selectedIds={data.deviceTypes || []}
            onSelectionChange={(ids) => onChange({ ...data, deviceTypes: ids })}
            selectionMode="multi"
            placeholder="Select device types..."
            searchPlaceholder="Search device types..."
            emptyMessage="No device types match your search"
            disabled={disabled}
          />
        </div>
      )}

    </div>
  );
}
