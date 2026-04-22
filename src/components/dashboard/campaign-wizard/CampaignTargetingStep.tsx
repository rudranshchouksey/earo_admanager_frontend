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
// import airDxbImg from '@/assets/podcasts/air-dxb.png';
// import cityLightsImg from '@/assets/podcasts/city-lights.png';
// import dubaiRealEstateImg from '@/assets/podcasts/dubai-real-estate.png';
// import expatsInDubaiImg from '@/assets/podcasts/expats-in-dubai.png';
// import dubaiPodcastImg from '@/assets/podcasts/dubai-podcast.png';
// import portraitImg from '@/assets/podcasts/portrait.png';
// import takingCareBusinessImg from '@/assets/podcasts/taking-care-business.png';
// import lovinDubaiImg from '@/assets/podcasts/lovin-dubai.png';
// import bigBreakfastImg from '@/assets/podcasts/big-breakfast.png';

const SHOW_IMAGES = [
  // dubaiStarsImg, j2HubImg, bitesizeBusinessImg, airDxbImg, cityLightsImg,
  // dubaiRealEstateImg, expatsInDubaiImg, dubaiPodcastImg, portraitImg,
  // takingCareBusinessImg, lovinDubaiImg, bigBreakfastImg,
];

const ageRanges = ['18-24', '25-34', '35-44', '45-54', '55-65', '65+'];

const genderOptions = [
  { value: 'all', label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const;

const deviceOptions = [
  { value: 'Mobile' },
  { value: 'Desktop' },
  { value: 'Smart Speaker' },
  { value: 'Connected TV' },
] as const;

const DEVICE_TYPES = [
  { id: 'phone', name: 'Phone', audience: '18.5M' },
  { id: 'portable-media-player', name: 'Portable Media Player', audience: '2.1M' },
  { id: 'tablet', name: 'Tablet', audience: '6.8M' },
  { id: 'desktop', name: 'Desktop', audience: '9.2M' },
  { id: 'gaming-console', name: 'Gaming Console', audience: '3.4M' },
  { id: 'smart-speaker', name: 'Smart Speaker', audience: '5.7M' },
  { id: 'smart-tv', name: 'Smart TV', audience: '7.3M' },
  { id: 'connected-vehicle', name: 'Connected Vehicle', audience: '1.9M' },
  { id: 'less-common-devices', name: 'Less Common Devices', audience: '850K' },
  { id: 'smart-watch', name: 'Smart Watch', audience: '4.1M' },
];

const inventoryOptions = [
  { type: 'Podcast', description: 'Reach 60M+ listeners across top shows and networks, with 300+ targeting options to match your message with the right audience.' },
  { type: 'Streaming', description: 'Connect with 100M+ listeners on top music, radio, CTV and gaming apps, in English or Arabic with powerful precision targeting.' },
] as const;

const adPositionOptions = ['Pre-roll', 'Mid-roll', 'Post-roll'] as const;

const podcastTopicsList = ['Business', 'Comedy', 'Health', 'Technology', 'Sports', 'News', 'Education', 'Entertainment', 'True Crime', 'Society & Culture'];

const PODCAST_TOPICS = [
  { id: 'topic-business', name: 'Business', audience: '8.4M' },
  { id: 'topic-comedy', name: 'Comedy', audience: '12.1M' },
  { id: 'topic-health', name: 'Health', audience: '6.7M' },
  { id: 'topic-technology', name: 'Technology', audience: '7.3M' },
  { id: 'topic-sports', name: 'Sports', audience: '9.8M' },
  { id: 'topic-news', name: 'News', audience: '11.2M' },
  { id: 'topic-education', name: 'Education', audience: '5.9M' },
  { id: 'topic-entertainment', name: 'Entertainment', audience: '10.5M' },
  { id: 'topic-truecrime', name: 'True Crime', audience: '8.1M' },
  { id: 'topic-society', name: 'Society & Culture', audience: '6.3M' },
];

const podcastTopicColumns: Column<typeof PODCAST_TOPICS[0]>[] = [
  { key: 'name', label: 'Topic', sortable: true },
];

const PODCAST_AUDIENCES = [
  { id: 'car-buyers', name: 'Car Buyers', description: 'Likely to purchase', type: 'High Intent', category: 'Automotive', provider: 'ComCast', audience: '800K' },
  { id: 'auto-enthusiasts', name: 'Auto Enthusiasts', description: 'Interested in cars', type: 'Interest', category: 'Automotive', provider: 'AdsWizz', audience: '1.5M' },
  { id: 'auto-podcast', name: 'Automotive Podcast Listeners', description: 'Reached via relevant shows', type: 'Broad', category: 'Automotive', provider: 'AdsWizz', audience: '2.9M' },
  { id: 'dm-healthcare', name: 'Healthcare Decision Makers', description: 'C-suite & directors in health sector', type: 'High Intent', category: 'Health', provider: 'AdsWizz', audience: '1.2M' },
  { id: 'dm-finance', name: 'Finance Decision Makers', description: 'Senior leaders in financial services', type: 'High Intent', category: 'Finance', provider: 'AdsWizz', audience: '1.8M' },
  { id: 'dm-technology', name: 'Tech Decision Makers', description: 'IT leaders & CTOs', type: 'High Intent', category: 'Technology', provider: 'ComCast', audience: '2.1M' },
  { id: 'dm-legal', name: 'Legal Professionals', description: 'Lawyers & compliance officers', type: 'Interest', category: 'Business', provider: 'ComCast', audience: '680K' },
  { id: 'dm-energy', name: 'Energy Industry Leaders', description: 'Executives in oil, gas & renewables', type: 'High Intent', category: 'Business', provider: 'NumberEight', audience: '520K' },
  { id: 'rc-apparel', name: 'Apparel Shoppers', description: 'Active fashion & clothing buyers', type: 'High Intent', category: 'Retail', provider: 'AdsWizz', audience: '3.4M' },
  { id: 'rc-electronics', name: 'Electronics Buyers', description: 'In-market for consumer electronics', type: 'High Intent', category: 'Retail', provider: 'ComCast', audience: '4.7M' },
  { id: 'rc-food', name: 'Food & Beverage Fans', description: 'Interest in food brands & dining', type: 'Interest', category: 'Retail', provider: 'NumberEight', audience: '5.1M' },
  { id: 'rc-home', name: 'Home & Garden Enthusiasts', description: 'Interested in home improvement', type: 'Interest', category: 'Retail', provider: 'ComCast', audience: '2.3M' },
  { id: 'int-travelers', name: 'Frequent Travelers', description: 'High-frequency flyers & hotel bookers', type: 'High Intent', category: 'Travel', provider: 'NumberEight', audience: '3.8M' },
  { id: 'int-fitness', name: 'Fitness Enthusiasts', description: 'Active gym-goers & wellness seekers', type: 'Interest', category: 'Fitness', provider: 'AdsWizz', audience: '4.5M' },
  { id: 'int-parents', name: 'Parents', description: 'Broad parenting audience', type: 'Broad', category: 'Education', provider: 'ComCast', audience: '6.2M' },
  { id: 'int-smb', name: 'Small Business Owners', description: 'SMB founders & operators', type: 'High Intent', category: 'Business', provider: 'NumberEight', audience: '1.9M' },
  { id: 'int-students', name: 'Students', description: 'College & university students', type: 'Broad', category: 'Education', provider: 'AdsWizz', audience: '7.8M' },
  { id: 'health-wellness', name: 'Wellness Seekers', description: 'Interest in holistic health & wellness', type: 'Interest', category: 'Health', provider: 'NumberEight', audience: '3.5M' },
  { id: 'travel-luxury', name: 'Luxury Travelers', description: 'Premium travel & resorts', type: 'Interest', category: 'Travel', provider: 'AdsWizz', audience: '1.6M' },
  { id: 'tech-early', name: 'Early Tech Adopters', description: 'First to try new gadgets & apps', type: 'Interest', category: 'Technology', provider: 'ComCast', audience: '5.1M' },
];

const podcastAudienceColumns: Column<typeof PODCAST_AUDIENCES[0]>[] = [
  {
    key: 'name',
    label: 'Audience Segment',
    sortable: true,
    render: (_val, item) => (
      <div>
        <div className="font-medium text-foreground">{item.name}</div>
        <div className="text-xs text-muted-foreground">{item.description}</div>
        <div className="text-xs text-muted-foreground/70 mt-0.5">{item.type} · {item.provider}</div>
      </div>
    ),
  },
  { key: 'category', label: 'Category', sortable: true },
];

const podcastAudienceFilters: FilterDef[] = [
  {
    key: 'type',
    label: 'Audience Type',
    options: [
      { value: 'High Intent', label: 'High Intent' },
      { value: 'Interest', label: 'Interest' },
      { value: 'Broad', label: 'Broad' },
    ],
  },
  {
    key: 'category',
    label: 'Category',
    options: [
      { value: 'Automotive', label: 'Automotive' },
      { value: 'Business', label: 'Business' },
      { value: 'Education', label: 'Education' },
      { value: 'Finance', label: 'Finance' },
      { value: 'Fitness', label: 'Fitness' },
      { value: 'Health', label: 'Health' },
      { value: 'Retail', label: 'Retail' },
      { value: 'Technology', label: 'Technology' },
      { value: 'Travel', label: 'Travel' },
    ],
  },
];

const BEHAVIORAL_AUDIENCES = [
  { id: 'auto-buyers', name: 'Automotive: Car Buyers', audience: '4.2M' },
  { id: 'auto-enthusiasts', name: 'Automotive: Car Enthusiasts', audience: '3.8M' },
  { id: 'auto-luxury', name: 'Automotive: Luxury Vehicle Owners', audience: '1.4M' },
  { id: 'tech-early', name: 'Technology: Early Adopters', audience: '5.1M' },
  { id: 'tech-gamers', name: 'Technology: Gamers', audience: '6.7M' },
  { id: 'finance-investors', name: 'Finance: Active Investors', audience: '2.3M' },
  { id: 'finance-crypto', name: 'Finance: Crypto Enthusiasts', audience: '1.9M' },
  { id: 'travel-frequent', name: 'Travel: Frequent Flyers', audience: '3.1M' },
  { id: 'travel-luxury', name: 'Travel: Luxury Travelers', audience: '1.6M' },
  { id: 'health-fitness', name: 'Health: Fitness Enthusiasts', audience: '4.8M' },
  { id: 'health-wellness', name: 'Health: Wellness Seekers', audience: '3.5M' },
  { id: 'food-foodies', name: 'Food & Drink: Foodies', audience: '5.4M' },
  { id: 'fashion-shoppers', name: 'Fashion: Online Shoppers', audience: '7.2M' },
  { id: 'home-owners', name: 'Real Estate: Home Owners', audience: '8.1M' },
  { id: 'parents-new', name: 'Family: New Parents', audience: '2.7M' },
];

const behavioralAudienceColumns: Column<typeof BEHAVIORAL_AUDIENCES[0]>[] = [
  { key: 'name', label: 'Segment', sortable: true },
];

const STREAMED_CONTENT = [
  { id: 'alternative', name: 'Alternative', audience: '8.3M' },
  { id: 'christmas', name: 'Christmas', audience: '12.1M' },
  { id: 'blues', name: 'Blues', audience: '3.2M' },
  { id: 'classical', name: 'Classical', audience: '4.5M' },
  { id: 'country', name: 'Country', audience: '6.8M' },
  { id: 'electronic', name: 'Electronic / Dance', audience: '9.1M' },
  { id: 'hip-hop', name: 'Hip-Hop / Rap', audience: '14.7M' },
  { id: 'indie', name: 'Indie', audience: '5.6M' },
  { id: 'jazz', name: 'Jazz', audience: '3.9M' },
  { id: 'latin', name: 'Latin', audience: '11.2M' },
  { id: 'metal', name: 'Metal', audience: '4.1M' },
  { id: 'pop', name: 'Pop', audience: '18.5M' },
  { id: 'rnb', name: 'R&B / Soul', audience: '7.4M' },
  { id: 'rock', name: 'Rock', audience: '10.3M' },
  { id: 'arabic', name: 'Arabic', audience: '6.2M' },
];

const streamedContentColumns: Column<typeof STREAMED_CONTENT[0]>[] = [
  { key: 'name', label: 'Genre / Content', sortable: true },
];

type InventoryMode = 'categories' | 'topics';

// Extended mock shows
const MOCK_SHOWS = [
  { id: '1', name: 'The Daily', inventoryType: 'Podcast', topic: 'News & Politics', audience: '2.1M', country: 'US', description: 'Daily news deep dives from The New York Times', image: SHOW_IMAGES[0] },
  { id: '2', name: 'Crime Junkie', inventoryType: 'Podcast', topic: 'True Crime', audience: '1.8M', country: 'US', description: 'Weekly true crime stories with host Ashley Flowers', image: SHOW_IMAGES[1] },
  { id: '3', name: 'SmartLess', inventoryType: 'Podcast', topic: 'Comedy', audience: '1.2M', country: 'US', description: 'Celebrity interviews with Bateman, Arnett and Hayes', image: SHOW_IMAGES[2] },
  { id: '4', name: 'How I Built This', inventoryType: 'Podcast', topic: 'Business', audience: '950K', country: 'US', description: 'Stories behind successful companies and movements', image: SHOW_IMAGES[3] },
  { id: '5', name: 'Lex Fridman Podcast', inventoryType: 'Podcast', topic: 'Technology', audience: '3.5M', country: 'US', description: 'Conversations about AI, science, and philosophy', image: SHOW_IMAGES[4] },
  { id: '6', name: 'Huberman Lab', inventoryType: 'Podcast', topic: 'Health & Wellness', audience: '4.2M', country: 'US', description: 'Neuroscience tools for everyday life', image: SHOW_IMAGES[5] },
  { id: '7', name: 'New Heights', inventoryType: 'Podcast', topic: 'Sports', audience: '2.8M', country: 'US', description: 'Football and culture with the Kelce brothers', image: SHOW_IMAGES[6] },
  { id: '8', name: 'Anghami Sessions', inventoryType: 'Streaming', topic: 'Music', audience: '850K', country: 'AE', description: 'Live music sessions from Arab artists on Anghami', image: SHOW_IMAGES[7] },
  { id: '9', name: 'Arab Radio Live', inventoryType: 'Radio', topic: 'Entertainment', audience: '1.5M', country: 'AE', description: 'Top-rated Arabic radio entertainment show', image: SHOW_IMAGES[8] },
  { id: '10', name: 'Finyal Media', inventoryType: 'Podcast', topic: 'Society & Culture', audience: '400K', country: 'AE', description: 'Arabic storytelling and documentary podcasts', image: SHOW_IMAGES[9] },
  { id: '11', name: 'Spotify Hits', inventoryType: 'Streaming', topic: 'Music', audience: '12M', country: 'GB', description: 'Top chart hits playlist on Spotify UK', image: SHOW_IMAGES[10] },
  { id: '12', name: 'BBC Radio 1', inventoryType: 'Radio', topic: 'Music', audience: '8M', country: 'GB', description: "UK's biggest youth radio station", image: SHOW_IMAGES[11] },
  { id: '13', name: 'Desert Drive FM', inventoryType: 'Radio', topic: 'Entertainment', audience: '600K', country: 'SA', description: "Saudi Arabia's favourite drive-time show", image: SHOW_IMAGES[0] },
  { id: '14', name: 'TED Radio Hour', inventoryType: 'Podcast', topic: 'Education', audience: '1.1M', country: 'US', description: 'TED Talks turned into compelling radio stories', image: SHOW_IMAGES[1] },
  { id: '15', name: 'Stuff You Should Know', inventoryType: 'Podcast', topic: 'Education', audience: '1.6M', country: 'US', description: 'Exploring how everything works since 2008', image: SHOW_IMAGES[2] },
];

const MOCK_SAVED_AUDIENCES = [
  { id: 'sa1', name: 'Website Visitors (30d)', type: 'retarget', size: '12,400' },
  { id: 'sa2', name: 'Cart Abandoners', type: 'retarget', size: '3,200' },
  { id: 'sa3', name: 'UAE Tech Enthusiasts 25-44', type: 'saved', size: '85,000' },
  { id: 'sa4', name: 'GCC Female 18-34', type: 'saved', size: '120,000' },
];
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

const deviceColumns: Column<typeof DEVICE_TYPES[0]>[] = [
  { key: 'name', label: 'Device Type', sortable: true },
];

interface TargetingData {
  gender: string;
  ageRanges: string[];
  deviceTypes: string[];
  inventoryTypes: string[];
  podcastTopics: string[];
  podcastAudiences?: string[];
  behavioralAudiences?: string[];
  streamedContent?: string[];
  adPositions?: string[];
  selectedShows?: string[];
  savedAudiences?: string[];
}

interface Props {
  data: TargetingData;
  onChange: (data: TargetingData) => void;
}

export default function CampaignTargetingStep({ data, onChange }: Props) {
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
    if (data.inventoryTypes.includes(type)) return;
    onChange({ ...data, inventoryTypes: [type] });
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
              const selected = data.inventoryTypes.includes(type);
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

          {data.inventoryTypes.includes('Podcast') && (
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
                  items={PODCAST_TOPICS}
                  columns={podcastTopicColumns}
                  selectedIds={PODCAST_TOPICS.filter(t => data.podcastTopics.includes(t.name)).map(t => t.id)}
                  onSelectionChange={(ids) => {
                    const names = PODCAST_TOPICS.filter(t => ids.includes(t.id)).map(t => t.name);
                    onChange({ ...data, podcastTopics: names });
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
                  items={PODCAST_AUDIENCES}
                  columns={podcastAudienceColumns}
                  selectionMode="multi"
                  selectedIds={data.podcastAudiences || []}
                  onSelectionChange={(ids) => onChange({ ...data, podcastAudiences: ids })}
                  selectAllFiltered
                  idKey="id"
                  searchPlaceholder="Search by segment, category, or provider..."
                  searchableKeys={['name', 'description', 'type', 'category', 'provider']}
                  filters={podcastAudienceFilters}
                  variant="table"
                  maxHeight="300px"
                  collapsible
                  isOpen={openListId === 'podcast-audiences'}
                  onOpenChange={handleOpenChange('podcast-audiences')}
                  collapsibleLabel="Search or select segments"
                  emptyMessage="No audiences match your search"
                />
              </div>


              <div className="space-y-3">
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

          {data.inventoryTypes.includes('Streaming') && (
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
                  items={STREAMED_CONTENT}
                  columns={streamedContentColumns}
                  selectionMode="multi"
                  selectedIds={data.streamedContent || []}
                  onSelectionChange={(ids) => onChange({ ...data, streamedContent: ids })}
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
                  items={BEHAVIORAL_AUDIENCES}
                  columns={behavioralAudienceColumns}
                  selectionMode="multi"
                  selectedIds={data.behavioralAudiences || []}
                  onSelectionChange={(ids) => onChange({ ...data, behavioralAudiences: ids })}
                  selectAllFiltered
                  idKey="id"
                  searchPlaceholder="Search by category, behavior, or segment..."
                  searchableKeys={['name']}
                  variant="table"
                  maxHeight="300px"
                  collapsible
                  isOpen={openListId === 'streaming-audiences'}
                  onOpenChange={handleOpenChange('streaming-audiences')}
                  collapsibleLabel="Search or select segments"
                  emptyMessage="No segments match your search"
                />
              </div>

              <div className="space-y-3">
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
          {genderOptions.map(({ value, label }) => {
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
          {ageRanges.map((age) => {
            const selected = data.ageRanges.includes(age);
            return (
              <div
                key={age}
                onClick={() => toggleAge(age)}
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
                <span className="text-sm font-medium">{age}</span>
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
            items={DEVICE_TYPES}
            columns={deviceColumns}
            selectionMode="multi"
            selectedIds={data.deviceTypes}
            onSelectionChange={(ids) => onChange({ ...data, deviceTypes: ids })}
            selectAllFiltered
            idKey="id"
            searchPlaceholder="Search device types..."
            searchableKeys={['name']}
            defaultSort={{ key: 'name', dir: 'asc' }}
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
