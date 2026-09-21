import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Heart, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { SearchableList } from "@/components/ui/searchable-list";
import type { Column } from "@/components/ui/searchable-list";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  mapVoiceLibraryVoiceToVoxifyVoice,
  voiceLibraryVoiceToFavPayload,
} from "@/lib/creativeLibraryMappers";
import {
  adsApi,
  type FavVoice,
  type GetFavVoicesPayload,
  type SearchVoicesPayload,
  type VoiceLibraryVoice,
  type VoxifyVoice,
} from "@/services/ads";
import InlineAudioPlayer from "./InlineAudioPlayer";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

const PAGE_SIZE = 10;

type VoiceFilters = {
  gender: string[] | null;
  language: string[] | null;
  accent: string[] | null;
  age: string[] | null;
  speechStyle: string[] | null;
};

const DEFAULT_VOICE_FILTERS: VoiceFilters = {
  gender: null,
  language: null,
  accent: null,
  age: null,
  speechStyle: null,
};

const LANGUAGE_OPTIONS = [
  { id: "en", label: "English" },
  { id: "es", label: "Spanish" },
  { id: "de", label: "German" },
  { id: "fr", label: "French" },
  { id: "it", label: "Italian" },
  { id: "ar", label: "Arabic" },
];

const ACCENT_OPTIONS = [{"id":"african","label":"African"},{"id":"african american","label":"African american"},{"id":"american","label":"American"},{"id":"arabic","label":"Arabic"},{"id":"australian","label":"Australian"},{"id":"boston","label":"Boston"},{"id":"british","label":"British"},{"id":"bulgarian","label":"Bulgarian"},{"id":"canadian","label":"Canadian"},{"id":"chicago","label":"Chicago"},{"id":"chinese","label":"Chinese"},{"id":"cockney","label":"Cockney"},{"id":"croatian","label":"Croatian"},{"id":"czech","label":"Czech"},{"id":"danish","label":"Danish"},{"id":"dutch","label":"Dutch"},{"id":"en-american","label":"En-american"},{"id":"en-canadian","label":"En-canadian"},{"id":"en-filipino","label":"En-filipino"},{"id":"en-indian","label":"En-indian"},{"id":"en-scottish","label":"En-scottish"},{"id":"en-singaporean","label":"En-singaporean"},{"id":"filipino","label":"Filipino"},{"id":"finnish","label":"Finnish"},{"id":"french","label":"French"},{"id":"geordie","label":"Geordie"},{"id":"german","label":"German"},{"id":"greek","label":"Greek"},{"id":"hindi","label":"Hindi"},{"id":"indian","label":"Indian"},{"id":"indonesian","label":"Indonesian"},{"id":"irish","label":"Irish"},{"id":"italian","label":"Italian"},{"id":"jamaican","label":"Jamaican"},{"id":"japanese","label":"Japanese"},{"id":"korean","label":"Korean"},{"id":"malay","label":"Malay"},{"id":"new york","label":"New york"},{"id":"new zealand","label":"New zealand"},{"id":"nigerian","label":"Nigerian"},{"id":"other","label":"Other"},{"id":"polish","label":"Polish"},{"id":"portuguese","label":"Portuguese"},{"id":"received pronunciation","label":"Received pronunciation"},{"id":"romanian","label":"Romanian"},{"id":"russian","label":"Russian"},{"id":"scottish","label":"Scottish"},{"id":"scouse","label":"Scouse"},{"id":"singaporean","label":"Singaporean"},{"id":"slovak","label":"Slovak"},{"id":"south african","label":"South african"},{"id":"spanish","label":"Spanish"},{"id":"swedish","label":"Swedish"},{"id":"tamil","label":"Tamil"},{"id":"turkish","label":"Turkish"},{"id":"ukrainian","label":"Ukrainian"},{"id":"us midwest","label":"Us midwest"},{"id":"us northeast","label":"Us northeast"},{"id":"us southern","label":"Us southern"},{"id":"welsh","label":"Welsh"},{"id":"yorkshire","label":"Yorkshire"}];
const GENDER_OPTIONS = [
  { id: "female", label: "Female" },
  { id: "male", label: "Male" },
  { id: "nonbinary", label: "Nonbinary" },
];

const AGE_OPTIONS = [
  { id: "young", label: "Young" },
  { id: "middle_aged", label: "Middle aged" },
  { id: "old", label: "Old" },
];

const SPEECH_STYLE_OPTIONS = [{"id":"anxious","label":"Anxious"},{"id":"authoritative","label":"Authoritative"},{"id":"bright","label":"Bright"},{"id":"calm","label":"Calm"},{"id":"casual","label":"Casual"},{"id":"chill","label":"Chill"},{"id":"cinematic","label":"Cinematic"},{"id":"classy","label":"Classy"},{"id":"compassionate","label":"Compassionate"},{"id":"confident","label":"Confident"},{"id":"corporate","label":"Corporate"},{"id":"cozy","label":"Cozy"},{"id":"crisp","label":"Crisp"},{"id":"cute","label":"Cute"},{"id":"deep","label":"Deep"},{"id":"documentary","label":"Documentary"},{"id":"earnest","label":"Earnest"},{"id":"empathetic","label":"Empathetic"},{"id":"encouraging","label":"Encouraging"},{"id":"excited","label":"Excited"},{"id":"expressive","label":"Expressive"},{"id":"festive","label":"Festive"},{"id":"formal","label":"Formal"},{"id":"friendly","label":"Friendly"},{"id":"gentle","label":"Gentle"},{"id":"grumpy","label":"Grumpy"},{"id":"husky","label":"Husky"},{"id":"hyped","label":"Hyped"},{"id":"intense","label":"Intense"},{"id":"mature","label":"Mature"},{"id":"meditative","label":"Meditative"},{"id":"modulated","label":"Modulated"},{"id":"motivational","label":"Motivational"},{"id":"neutral","label":"Neutral"},{"id":"playful","label":"Playful"},{"id":"pleasant","label":"Pleasant"},{"id":"polished","label":"Polished"},{"id":"premium","label":"Premium"},{"id":"professional","label":"Professional"},{"id":"promotional","label":"Promotional"},{"id":"raspy","label":"Raspy"},{"id":"reassuring","label":"Reassuring"},{"id":"relaxed","label":"Relaxed"},{"id":"robotic","label":"Robotic"},{"id":"rough","label":"Rough"},{"id":"sad","label":"Sad"},{"id":"sassy","label":"Sassy"},{"id":"serious","label":"Serious"},{"id":"soft","label":"Soft"},{"id":"supportive","label":"Supportive"},{"id":"trustworthy","label":"Trustworthy"},{"id":"upbeat","label":"Upbeat"},{"id":"urgent","label":"Urgent"},{"id":"warm","label":"Warm"},{"id":"whispery","label":"Whispery"},{"id":"wise","label":"Wise"}];

function buildVoiceSearchPayload(
  filters: VoiceFilters,
  searchQuery: string,
  offset: number,
): SearchVoicesPayload {
  const payload: SearchVoicesPayload = {
    sort: "name",
    limit: PAGE_SIZE,
    offset,
  };

  const q = searchQuery.trim();
  if (q) payload.q = q;
  if (filters.language?.length) payload.language = filters.language;
  if (filters.accent?.length) payload.accent = filters.accent;
  if (filters.gender?.length) payload.gender = filters.gender;
  if (filters.age?.length) payload.age = filters.age;
  if (filters.speechStyle?.length) payload.speech_style = filters.speechStyle;


  if(payload.age?.length) {
    payload.age = payload.age.filter((a) => a !== "middle-aged" && a !== "middle-age");

    if(payload.age.find((a) => a === "middle_aged")){
      payload.age.push("middle-aged");
      payload.age.push("middle-age");    
    }
  }

  return payload;
}

function buildFavVoicesPayload(
  filters: VoiceFilters,
  searchQuery: string,
  offset: number,
): GetFavVoicesPayload {
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const payload: GetFavVoicesPayload = {
    page,
    limit: PAGE_SIZE,
  };

  const q = searchQuery.trim();
  if (q) payload.query = q;
  if (filters.language?.length) payload.language = filters.language;
  if (filters.accent?.length) payload.accent = filters.accent.join(",");
  if (filters.gender?.length) payload.gender = filters.gender;
  if (filters.age?.length) payload.ageGroup = filters.age;
  if (filters.speechStyle?.length) payload.style = filters.speechStyle;

  return payload;
}

function mapFavVoiceToLibraryVoice(voice: FavVoice): VoiceLibraryVoice {
  return {
    voice_id: voice.voice_id,
    voice_owner_id: voice.voice_owner_id,
    name: voice.name,
    description: voice.description,
    language: voice.language,
    accent: voice.accent,
    gender: voice.gender,
    age: voice.age,
    speech_style: voice.speech_style,
    speech_rate: voice.speech_rate ?? 0,
    preview_url: voice.preview_url,
    category: voice.category,
    source: voice.source,
    is_favorite: true,
  };
}

function filtersKey(filters: VoiceFilters, showFavorites: boolean): string {
  return [
    showFavorites ? "fav" : "all",
    filters.language?.join(",") ?? "",
    filters.accent?.join(",") ?? "",
    filters.gender?.join(",") ?? "",
    filters.age?.join(",") ?? "",
    filters.speechStyle?.join(",") ?? "",
  ].join("|");
}

const voiceColumns: Column<VoiceLibraryVoice>[] = [
  { key: "name", label: "Name" },
  { key: "language", label: "Language" },
];

export interface VoiceLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedVoiceId?: string | null;
  onSelect: (voice: VoxifyVoice) => void;
}

function VoiceFilterDropdown({
  label,
  options,
  selected,
  onChange,
  className,
}: {
  label: string;
  options: { id: string; label: string }[];
  selected: string[] | null;
  onChange: (ids: string[]) => void;
  className?: string;
}) {
  return (
    <SearchableDropdown
      items={options}
      selectedIds={selected ?? []}
      onSelectionChange={onChange}
      selectionMode="multi"
      placeholder={label}
      searchPlaceholder={`Search ${label.toLowerCase()}...`}
      emptyMessage={`No ${label.toLowerCase()} found`}
      className={cn("h-8 text-xs", className)}
    />
  );
}

export default function VoiceLibrary({
  open,
  onOpenChange,
  onSelect,
}: VoiceLibraryProps) {
  const [voices, setVoices] = useState<VoiceLibraryVoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<VoiceFilters>(DEFAULT_VOICE_FILTERS);
  const [listReady, setListReady] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null);
  const [favVoiceIds, setFavVoiceIds] = useState<Set<string>>(new Set());
  const [togglingVoiceId, setTogglingVoiceId] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const showFavoritesRef = useRef(showFavorites);
  showFavoritesRef.current = showFavorites;

  const offsetRef = useRef(0);
  const lastQueryRef = useRef("");
  const hasMoreRef = useRef(false);
  const fetchingRef = useRef(false);
  const totalCountRef = useRef(0);

  const loadFavoriteIds = useCallback(async () => {
    try {
      const { status, data } = await adsApi.getFavVoices({ page: 1, limit: 100 });
      if (status === 200 && Array.isArray(data?.data)) {
        setFavVoiceIds(new Set(data.data.map((v) => v.voice_id)));
      }
    } catch (err) {
      logger.warn("Failed to load favorite voice ids", { err });
    }
  }, []);

  const fetchVoices = useCallback(
    async (opts: { reset: boolean; nextOffset: number; searchQuery: string }) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      if (opts.reset) setLoading(true);
      else setLoadingMore(true);

      try {
        if (showFavoritesRef.current) {
          const { status, error, data } = await adsApi.getFavVoices(
            buildFavVoicesPayload(filtersRef.current, opts.searchQuery, opts.nextOffset),
          );

          if (status !== 200 || error || !Array.isArray(data?.data)) {
            logger.warn("Favorite voices fetch failed", { status, error });
            if (opts.reset) setVoices([]);
            hasMoreRef.current = false;
            setHasMore(false);
            return;
          }

          const next = data.data.map(mapFavVoiceToLibraryVoice);
          const total = data.pagination?.total ?? next.length;
          const nextOffset = opts.nextOffset + next.length;

          totalCountRef.current = total;
          offsetRef.current = nextOffset;
          lastQueryRef.current = opts.searchQuery;
          setVoices((prev) => (opts.reset ? next : [...prev, ...next]));
          setFavVoiceIds((prev) => {
            const nextIds = new Set(prev);
            for (const voice of next) nextIds.add(voice.voice_id);
            return nextIds;
          });

          const more = nextOffset < total;
          hasMoreRef.current = more;
          setHasMore(more);
          return;
        }

        const { status, error, data } = await adsApi.searchVoxifyVoices(
          buildVoiceSearchPayload(filtersRef.current, opts.searchQuery, opts.nextOffset),
        );

        if (status !== 200 || error || !data?.data?.items) {
          logger.warn("Voice library search failed", { status, error });
          if (opts.reset) setVoices([]);
          hasMoreRef.current = false;
          setHasMore(false);
          return;
        }

        const next = data.data.items;
        const total = data.data.total;
        const nextOffset = opts.nextOffset + next.length;

        totalCountRef.current = total;
        offsetRef.current = nextOffset;
        lastQueryRef.current = opts.searchQuery;
        setVoices((prev) => (opts.reset ? next : [...prev, ...next]));
        setFavVoiceIds((prev) => {
          const nextIds = new Set(prev);
          for (const voice of next) {
            if (voice.is_favorite) nextIds.add(voice.voice_id);
          }
          return nextIds;
        });

        const more =
          total != null ? nextOffset < total : next.length >= PAGE_SIZE;
        hasMoreRef.current = more;
        setHasMore(more);
      } finally {
        fetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
        setListReady(true);
      }
    },
    [],
  );

  useEffect(() => {
    if (!open) {
      setListReady(false);
      setVoices([]);
      setSelectedVoiceId(null);
      setFavVoiceIds(new Set());
      setTogglingVoiceId(null);
      setShowFavorites(false);
      offsetRef.current = 0;
      lastQueryRef.current = "";
      hasMoreRef.current = false;
      setHasMore(false);
      return;
    }

    offsetRef.current = 0;
    lastQueryRef.current = "";
    setListReady(false);
    void loadFavoriteIds();
    void fetchVoices({ reset: true, nextOffset: 0, searchQuery: "" });
  }, [open, filters, showFavorites, fetchVoices, loadFavoriteIds]);

  const handleQueryChange = useCallback(
    (nextQuery: string) => {
      if (nextQuery === lastQueryRef.current) return;
      offsetRef.current = 0;
      //alert(`fetching ${nextQuery}`);
      void fetchVoices({ reset: true, nextOffset: 0, searchQuery: nextQuery });
    },
    [fetchVoices],
  );

  const handleLoadMore = useCallback(() => {
    if (fetchingRef.current || !hasMoreRef.current) return;
    //alert("loading more");
    void fetchVoices({
      reset: false,
      nextOffset: offsetRef.current,
      searchQuery: lastQueryRef.current,
    });
  }, [fetchVoices]);

  const selectedIds = useMemo(() => {
    if (!selectedVoiceId) return [];
    const match = voices.find((v) => v.voice_id === selectedVoiceId);
    return match ? [match.voice_id] : [];
  }, [selectedVoiceId, voices]);

  const updateFilter = (key: keyof VoiceFilters, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : null,
    }));
  };

  const handleUseVoice = () => {
    const voice = voices.find((v) => v.voice_id === selectedVoiceId);
    if (!voice) return;
    onSelect(mapVoiceLibraryVoiceToVoxifyVoice(voice));
  };

  const handleToggleFavorite = async (voice: VoiceLibraryVoice) => {
    if (!voice?.voice_id || togglingVoiceId) return;
    setTogglingVoiceId(voice.voice_id);
    try {
      const { status, error, data, message } = await adsApi.toggleFavVoice(
        voiceLibraryVoiceToFavPayload(voice),
      );
      if (status !== 200 || error || !data?.data) {
        toast({
          title: "Could not update favorite",
          description: message || "Please try again",
          variant: "destructive",
        });
        return;
      }

      setFavVoiceIds((prev) => {
        const next = new Set(prev);
        if (data.data.isFavorite) next.add(voice.voice_id);
        else next.delete(voice.voice_id);
        return next;
      });

      if (showFavoritesRef.current && !data.data.isFavorite) {
        setVoices((prev) => prev.filter((v) => v.voice_id !== voice.voice_id));
        totalCountRef.current = Math.max(0, totalCountRef.current - 1);
        if (selectedVoiceId === voice.voice_id) setSelectedVoiceId(null);
      }
    } catch (err) {
      logger.warn("toggleFavVoice failed in VoiceLibrary", { err });
      toast({
        title: "Could not update favorite",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setTogglingVoiceId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl max-h-[85vh] flex flex-col gap-0 overflow-hidden bg-white p-0"
        onInteractOutside={(e) => {
          const target = e.target;
          if (
            target instanceof Element &&
            target.closest("[data-radix-popper-content-wrapper]")
          ) {
            e.preventDefault();
          }
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-6 pb-4">
        <DialogHeader>
          <DialogTitle>Voice library</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2 shrink-0 p-1">
          <VoiceFilterDropdown
            label="Language"
            options={LANGUAGE_OPTIONS}
            selected={filters.language}
            onChange={(ids) => updateFilter("language", ids)}
            className="w-[160px]"
          />
          <VoiceFilterDropdown
            label="Accent"
            options={ACCENT_OPTIONS}
            selected={filters.accent}
            onChange={(ids) => updateFilter("accent", ids)}
            className="w-[200px]"
          />
          <VoiceFilterDropdown
            label="Gender"
            options={GENDER_OPTIONS}
            selected={filters.gender}
            onChange={(ids) => updateFilter("gender", ids)}
            className="w-[160px]"
          />
          <VoiceFilterDropdown
            label="Age"
            options={AGE_OPTIONS}
            selected={filters.age}
            onChange={(ids) => updateFilter("age", ids)}
            className="w-[160px]"
          />
          <VoiceFilterDropdown
            label="Style"
            options={SPEECH_STYLE_OPTIONS}
            selected={filters.speechStyle}
            onChange={(ids) => updateFilter("speechStyle", ids)}
            className="w-[160px]"
          />
          <div className="flex items-center gap-2 ml-auto pr-1 w-full">
            <Heart
              className={cn(
                "h-3.5 w-3.5",
                showFavorites ? "text-primary" : "text-muted-foreground",
              )}
              fill={showFavorites ? "currentColor" : "none"}
            />
            <span className="text-sm text-muted-foreground">Favorites</span>
            <Switch
              checked={showFavorites}
              onCheckedChange={(checked) => {
                setShowFavorites(checked);
                setSelectedVoiceId(null);
              }}
              size="sm"
            />
          </div>
        </div>

        
        <div className="min-h-0 flex-1 overflow-hidden">
        {/* Keep SearchableList mounted during search fetches so the input query is preserved.
            Only show a full-page spinner on the initial load / filter remount. */}
        {!listReady ? (
          <div className="flex h-full min-h-[320px] items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <SearchableList<VoiceLibraryVoice>
            key={`voice-library-${filtersKey(filters, showFavorites)}`}
            items={voices}
            columns={voiceColumns}
            selectionMode="single"
            selectedIds={selectedIds}
            onSelectionChange={(ids) => {
              const voice = voices.find((v) => v.voice_id === ids[0]);
              if (voice) {
                setSelectedVoiceId(voice.voice_id);
                //onSelect(mapVoiceLibraryVoiceToVoxifyVoice(voice));
              }
            }}
            idKey="voice_id"
            searchPlaceholder={showFavorites ? "Search favorites..." : "Search voices..."}
            searchableKeys={["name", "language", "accent", "gender", "description"]}
            useFilterApi
            onQueryChange={handleQueryChange}
            queryDebounceMs={300}
            hasMore={hasMore}
            loadingMore={loadingMore}
            onLoadMore={handleLoadMore}
            paginationMode="infinite-scroll"
            variant="list"
            maxHeight="calc(85vh - 280px)"
            pageSize={PAGE_SIZE}
            emptyMessage={showFavorites ? "No favorite voices found" : "No voices found"}
            loading={loading}
            renderItem={(voice, isSelected) => (
              <div
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
                  isSelected ? "bg-primary/5 ring-1 ring-primary" : "hover:bg-muted/50",
                )}
              >
                <div
                  className={cn(
                    "h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center",
                    isSelected ? "border-primary" : "border-muted-foreground/40",
                  )}
                >
                  {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <Avatar className="h-10 w-10 shrink-0">
                  <AvatarFallback className="text-xs font-medium">{voice.name.trim().slice(0, 2)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-medium text-foreground">{voice.name.trim()}</span>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize">
                      {voice.gender}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                      {voice.language}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate capitalize">
                    {[voice.accent, voice.age, voice.speech_style, voice.category]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  title={favVoiceIds.has(voice.voice_id) ? "Remove from favorites" : "Add to favorites"}
                  disabled={togglingVoiceId === voice.voice_id}
                  className={cn(
                    "shrink-0 transition-colors",
                    favVoiceIds.has(voice.voice_id)
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary",
                    togglingVoiceId === voice.voice_id && "opacity-50",
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleToggleFavorite(voice);
                  }}
                >
                  {togglingVoiceId === voice.voice_id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Heart
                      className="h-4 w-4"
                      fill={favVoiceIds.has(voice.voice_id) ? "currentColor" : "none"}
                    />
                  )}
                </button>
                {voice.preview_url ? (
                  <div onClick={(e) => e.stopPropagation()}>
                    <InlineAudioPlayer audioUrl={voice.preview_url} />
                  </div>
                ) : null}
              </div>
            )}
            showFooterContent={false}
          />
        )}
        </div>
        </div>

          <DialogFooter className="shrink-0 border-t bg-white px-6 py-4 ">
            <div className="flex md:flex-row items-center justify-between w-full">
            <span className="text-sm text-muted-foreground flex items-center">
              {voices.length} of {totalCountRef.current} voices found
              {
                loadingMore && (<Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />)
              }
            </span>
            {selectedVoiceId && (
              <Button
                type="button"
                variant="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!selectedVoiceId}
                onClick={handleUseVoice}
              >
              Use this voice
              </Button>
            )}
            </div>

          </DialogFooter>            
      </DialogContent>
    </Dialog>
  );
}
