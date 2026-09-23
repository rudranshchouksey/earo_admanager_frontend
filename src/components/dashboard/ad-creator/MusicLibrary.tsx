import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Heart, Loader2, Music as MusicIcon } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchableDropdown } from "@/components/ui/searchable-dropdown";
import { SearchableList } from "@/components/ui/searchable-list";
import type { Column } from "@/components/ui/searchable-list";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { mapMusicToVoxifyTrack, musicToFavPayload } from "@/lib/creativeLibraryMappers";
import {
  adsApi,
  type FavTrack,
  type GetFavTracksPayload,
  type Music,
  type SearchMusicsPayload,
  type VoxifyTrack,
} from "@/services/ads";
import InlineAudioPlayer from "./InlineAudioPlayer";
import { logger } from "@/lib/logger";
import { toast } from "@/hooks/use-toast";

const PAGE_SIZE = 10;

type MusicFilters = {
  genre: string[] | null;
  mood: string[] | null;
  instrument: string[] | null;
};

const DEFAULT_MUSIC_FILTERS: MusicFilters = {
  genre: null,
  mood: null,
  instrument: null,
};

const GENRE_OPTIONS = [{"id":"Acid Jazz","label":"Acid Jazz"},{"id":"Acoustic Blues","label":"Acoustic Blues"},{"id":"Bebop","label":"Bebop"},{"id":"Big Band","label":"Big Band"},{"id":"Dixieland","label":"Dixieland"},{"id":"Electric Blues","label":"Electric Blues"},{"id":"Exotica","label":"Exotica"},{"id":"Gypsy Jazz","label":"Gypsy Jazz"},{"id":"Jazz Ballad","label":"Jazz Ballad"},{"id":"Jazz Fusion","label":"Jazz Fusion"},{"id":"Latin Jazz","label":"Latin Jazz"},{"id":"Lounge","label":"Lounge"},{"id":"Ragtime","label":"Ragtime"},{"id":"Smooth Jazz","label":"Smooth Jazz"},{"id":"Swing","label":"Swing"},{"id":"Dramedy","label":"Dramedy"},{"id":"Drone","label":"Drone"},{"id":"Film Score (Electronic)","label":"Film Score (Electronic)"},{"id":"Film Score (Orchestral)","label":"Film Score (Orchestral)"},{"id":"Horror","label":"Horror"},{"id":"Americana","label":"Americana"},{"id":"Bluegrass","label":"Bluegrass"},{"id":"Country Folk","label":"Country Folk"},{"id":"Country Pop","label":"Country Pop"},{"id":"Country Rock","label":"Country Rock"},{"id":"Big Beat","label":"Big Beat"},{"id":"Breakbeat","label":"Breakbeat"},{"id":"Dance Pop","label":"Dance Pop"},{"id":"Dubstep","label":"Dubstep"},{"id":"House","label":"House"},{"id":"Industrial","label":"Industrial"},{"id":"Synthwave","label":"Synthwave"},{"id":"Techno","label":"Techno"},{"id":"Trance","label":"Trance"},{"id":"Ambient","label":"Ambient"},{"id":"Chill Out","label":"Chill Out"},{"id":"Chiptune","label":"Chiptune"},{"id":"Downtempo","label":"Downtempo"},{"id":"Dub","label":"Dub"},{"id":"Lo-Fi","label":"Lo-Fi"},{"id":"Trip Hop","label":"Trip Hop"},{"id":"Acoustic","label":"Acoustic"},{"id":"Bush Ballad","label":"Bush Ballad"},{"id":"Folk Pop","label":"Folk Pop"},{"id":"Folk Rock","label":"Folk Rock"},{"id":"Nu-Folk","label":"Nu-Folk"},{"id":"Polka","label":"Polka"},{"id":"Classic Hip Hop","label":"Classic Hip Hop"},{"id":"Drill","label":"Drill"},{"id":"Gangsta","label":"Gangsta"},{"id":"Orchestral Hip Hop","label":"Orchestral Hip Hop"},{"id":"Trap","label":"Trap"},{"id":"20th Century","label":"20th Century"},{"id":"Baroque","label":"Baroque"},{"id":"Classical Period","label":"Classical Period"},{"id":"Film Score (Orchestral)","label":"Film Score (Orchestral)"},{"id":"Romantic Period","label":"Romantic Period"},{"id":"Solo Piano","label":"Solo Piano"},{"id":"Adult Contemporary","label":"Adult Contemporary"},{"id":"Bubblegum","label":"Bubblegum"},{"id":"Dancehall","label":"Dancehall"},{"id":"Easy Listening","label":"Easy Listening"},{"id":"Electro Pop","label":"Electro Pop"},{"id":"Indie Pop","label":"Indie Pop"},{"id":"New Wave","label":"New Wave"},{"id":"Pop Rock","label":"Pop Rock"},{"id":"Singer-Songwriter","label":"Singer-Songwriter"},{"id":"Disco","label":"Disco"},{"id":"Funk","label":"Funk"},{"id":"Neo Soul","label":"Neo Soul"},{"id":"R&B Pop","label":"R&B Pop"},{"id":"Soul","label":"Soul"},{"id":"Alternative Grunge","label":"Alternative Grunge"},{"id":"Classic Rock","label":"Classic Rock"},{"id":"Country Rock","label":"Country Rock"},{"id":"Electro Rock","label":"Electro Rock"},{"id":"Indie Rock","label":"Indie Rock"},{"id":"Metal","label":"Metal"},{"id":"New Wave","label":"New Wave"},{"id":"Pop Rock","label":"Pop Rock"},{"id":"Punk Rock","label":"Punk Rock"},{"id":"Rock-n-Roll","label":"Rock-n-Roll"},{"id":"Soft Rock","label":"Soft Rock"},{"id":"Surf Rock","label":"Surf Rock"},{"id":"African","label":"African"},{"id":"Afrobeat","label":"Afrobeat"},{"id":"Asian","label":"Asian"},{"id":"Australiana","label":"Australiana"},{"id":"Bachata","label":"Bachata"},{"id":"Brazilian / Samba","label":"Brazilian / Samba"},{"id":"British","label":"British"},{"id":"Celtic","label":"Celtic"},{"id":"Cuban / Salsa","label":"Cuban / Salsa"},{"id":"Cumbia","label":"Cumbia"},{"id":"European","label":"European"},{"id":"French","label":"French"},{"id":"Indian","label":"Indian"},{"id":"Island","label":"Island"},{"id":"Italian","label":"Italian"},{"id":"Japanese","label":"Japanese"},{"id":"Klezmer","label":"Klezmer"},{"id":"Latin American","label":"Latin American"},{"id":"Middle Eastern","label":"Middle Eastern"},{"id":"Reggae","label":"Reggae"},{"id":"Reggaeton","label":"Reggaeton"},{"id":"Ska","label":"Ska"},{"id":"Spanish / Flamenco","label":"Spanish / Flamenco"},{"id":"Tango","label":"Tango"},{"id":"World Elements","label":"World Elements"}];

const MOOD_OPTIONS = [{"id":"Abstract","label":"Abstract"},{"id":"Emotional","label":"Emotional"},{"id":"Exotic","label":"Exotic"},{"id":"Neutral","label":"Neutral"},{"id":"Calm / Serene","label":"Calm / Serene"},{"id":"Ethereal / Airy","label":"Ethereal / Airy"},{"id":"Gentle / Soft","label":"Gentle / Soft"},{"id":"Laid-back","label":"Laid-back"},{"id":"Shimmering","label":"Shimmering"},{"id":"Smooth / Flowing","label":"Smooth / Flowing"},{"id":"Aggressive","label":"Aggressive"},{"id":"Anxious / Fear","label":"Anxious / Fear"},{"id":"Dark / Brooding","label":"Dark / Brooding"},{"id":"Dramatic","label":"Dramatic"},{"id":"Intense / Hard","label":"Intense / Hard"},{"id":"Ominous / Looming","label":"Ominous / Looming"},{"id":"Raw / Gritty","label":"Raw / Gritty"},{"id":"Suspense / Tense","label":"Suspense / Tense"},{"id":"Building / Escalating","label":"Building / Escalating"},{"id":"Driving","label":"Driving"},{"id":"Pulsing","label":"Pulsing"},{"id":"Punchy","label":"Punchy"},{"id":"Rowdy / Boisterous","label":"Rowdy / Boisterous"},{"id":"Anthemic","label":"Anthemic"},{"id":"Confident","label":"Confident"},{"id":"Epic","label":"Epic"},{"id":"Majestic","label":"Majestic"},{"id":"Patriotic","label":"Patriotic"},{"id":"Powerful / Strong","label":"Powerful / Strong"},{"id":"Bouncy","label":"Bouncy"},{"id":"Cheesy","label":"Cheesy"},{"id":"Funny / Silly","label":"Funny / Silly"},{"id":"Playful / Whimsical","label":"Playful / Whimsical"},{"id":"Quirky / Kitsch","label":"Quirky / Kitsch"},{"id":"Funky","label":"Funky"},{"id":"Grooving","label":"Grooving"},{"id":"Jazzy","label":"Jazzy"},{"id":"Sophisticated","label":"Sophisticated"},{"id":"Swaggering","label":"Swaggering"},{"id":"Celebration","label":"Celebration"},{"id":"Cool","label":"Cool"},{"id":"Energetic / Lively","label":"Energetic / Lively"},{"id":"Exciting / Rousing","label":"Exciting / Rousing"},{"id":"Feel Good","label":"Feel Good"},{"id":"Fun","label":"Fun"},{"id":"Happy / Bright","label":"Happy / Bright"},{"id":"Hopeful / Optimistic","label":"Hopeful / Optimistic"},{"id":"Joyful","label":"Joyful"},{"id":"Upbeat / Cheerful","label":"Upbeat / Cheerful"},{"id":"Uplifting / Inspiring","label":"Uplifting / Inspiring"},{"id":"Haunting","label":"Haunting"},{"id":"Mysterious","label":"Mysterious"},{"id":"Sneaky","label":"Sneaky"},{"id":"Strange / Weird","label":"Strange / Weird"},{"id":"Beautiful","label":"Beautiful"},{"id":"Passionate","label":"Passionate"},{"id":"Romantic","label":"Romantic"},{"id":"Sensual / Intimate","label":"Sensual / Intimate"},{"id":"Sweet / Warm","label":"Sweet / Warm"},{"id":"Bittersweet","label":"Bittersweet"},{"id":"Moody","label":"Moody"},{"id":"Nostalgic / Reflective","label":"Nostalgic / Reflective"},{"id":"Sad / Melancholic","label":"Sad / Melancholic"}];

const INSTRUMENT_OPTIONS = [{"id":"French Horn","label":"French Horn"},{"id":"Trombone","label":"Trombone"},{"id":"Trumpet / Cornet","label":"Trumpet / Cornet"},{"id":"Tuba","label":"Tuba"},{"id":"Brass","label":"Brass"},{"id":"Percussion","label":"Percussion"},{"id":"Orchestra","label":"Orchestra"},{"id":"Orchestral Noise","label":"Orchestral Noise"},{"id":"Strings","label":"Strings"},{"id":"Woodwind","label":"Woodwind"},{"id":"FX (Clock)","label":"FX (Clock)"},{"id":"FX (Heartbeat)","label":"FX (Heartbeat)"},{"id":"FX (Reverse)","label":"FX (Reverse)"},{"id":"Scratching","label":"Scratching"},{"id":"Stompbox","label":"Stompbox"},{"id":"Vinyl Crackle","label":"Vinyl Crackle"},{"id":"Clavinet","label":"Clavinet"},{"id":"Harpsichord","label":"Harpsichord"},{"id":"Piano","label":"Piano"},{"id":"Rhodes","label":"Rhodes"},{"id":"Congas","label":"Congas"},{"id":"Drum Kit","label":"Drum Kit"},{"id":"Drum Kit - Brushes","label":"Drum Kit - Brushes"},{"id":"Electronic Drums","label":"Electronic Drums"},{"id":"Hand Drum","label":"Hand Drum"},{"id":"Tabla","label":"Tabla"},{"id":"Hammond Organ","label":"Hammond Organ"},{"id":"Organ","label":"Organ"},{"id":"Bells / Tubular Bells","label":"Bells / Tubular Bells"},{"id":"Celeste","label":"Celeste"},{"id":"Gamelan","label":"Gamelan"},{"id":"Glockenspiel","label":"Glockenspiel"},{"id":"Kalimba","label":"Kalimba"},{"id":"Marimba","label":"Marimba"},{"id":"Music Box","label":"Music Box"},{"id":"Steel Drums","label":"Steel Drums"},{"id":"Vibraphone","label":"Vibraphone"},{"id":"Xylophone","label":"Xylophone"},{"id":"Castanets","label":"Castanets"},{"id":"Cowbell","label":"Cowbell"},{"id":"Finger Snaps","label":"Finger Snaps"},{"id":"Hand Claps","label":"Hand Claps"},{"id":"Sleigh Bells","label":"Sleigh Bells"},{"id":"Shaker","label":"Shaker"},{"id":"Tambourine","label":"Tambourine"},{"id":"Accordion / Bandoneon","label":"Accordion / Bandoneon"},{"id":"Harmonica","label":"Harmonica"},{"id":"Melodica","label":"Melodica"},{"id":"Bass - Double","label":"Bass - Double"},{"id":"Cello","label":"Cello"},{"id":"Erhu","label":"Erhu"},{"id":"Violin / Viola","label":"Violin / Viola"},{"id":"Bass - Electric","label":"Bass - Electric"},{"id":"Dobro","label":"Dobro"},{"id":"Guitar - Acoustic","label":"Guitar - Acoustic"},{"id":"Guitar - Electric","label":"Guitar - Electric"},{"id":"Guitar - Lap & Pedal","label":"Guitar - Lap & Pedal"},{"id":"Guitar - Slide","label":"Guitar - Slide"},{"id":"Guitar - Spanish","label":"Guitar - Spanish"},{"id":"Ukulele","label":"Ukulele"},{"id":"Banjo","label":"Banjo"},{"id":"Dulcimer","label":"Dulcimer"},{"id":"Harp","label":"Harp"},{"id":"Koto","label":"Koto"},{"id":"Jaw Harp","label":"Jaw Harp"},{"id":"Lute","label":"Lute"},{"id":"Mandolin","label":"Mandolin"},{"id":"Saz","label":"Saz"},{"id":"Shamisen","label":"Shamisen"},{"id":"Sitar","label":"Sitar"},{"id":"Bass - Synth","label":"Bass - Synth"},{"id":"Keyboard","label":"Keyboard"},{"id":"Synth","label":"Synth"},{"id":"Theremin","label":"Theremin"},{"id":"Pizzicato","label":"Pizzicato"},{"id":"Whistling","label":"Whistling"},{"id":"Bagpipes / Celtic Pipes","label":"Bagpipes / Celtic Pipes"},{"id":"Bassoon","label":"Bassoon"},{"id":"Clarinet","label":"Clarinet"},{"id":"Didgeridoo","label":"Didgeridoo"},{"id":"Duduk","label":"Duduk"},{"id":"Flute / Piccolo","label":"Flute / Piccolo"},{"id":"Oboe / Cor Anglais","label":"Oboe / Cor Anglais"},{"id":"Pan Pipes","label":"Pan Pipes"},{"id":"Recorder","label":"Recorder"},{"id":"Saxophone","label":"Saxophone"},{"id":"Shakuhachi","label":"Shakuhachi"},{"id":"Whistles / Tin / Penny","label":"Whistles / Tin / Penny"},{"id":"Ethnic","label":"Ethnic"}];

function splitCsv(value?: string | null): string[] {
  if (!value?.trim()) return [];
  return value.split(",").map((part) => part.trim()).filter(Boolean);
}

function buildMusicPayload(
  filters: MusicFilters,
  query: string,
  offset: number,
): SearchMusicsPayload {
  const payload: SearchMusicsPayload = {
    sort: "title",
    limit: PAGE_SIZE,
    offset,
  };

  const q = query.trim();
  if (q) payload.q = q;
  if (filters.genre?.length) payload.genre = filters.genre;
  if (filters.mood?.length) payload.mood = filters.mood;
  if (filters.instrument?.length) payload.instrument = filters.instrument;

  return payload;
}

function buildFavTracksPayload(
  filters: MusicFilters,
  searchQuery: string,
  offset: number,
): GetFavTracksPayload {
  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const payload: GetFavTracksPayload = {
    page,
    limit: PAGE_SIZE,
  };

  const q = searchQuery.trim();
  if (q) payload.query = q;
  if (filters.genre?.length) payload.genre = filters.genre;
  if (filters.mood?.length) payload.mood = filters.mood.join(",");
  if (filters.instrument?.length) payload.instrument = filters.instrument;

  return payload;
}

function mapFavTrackToMusic(track: FavTrack): Music {
  return {
    track_id: track.track_id,
    title: track.title ?? "",
    artist_name: track.artist ?? "",
    genres: splitCsv(track.genre),
    moods: splitCsv(track.mood),
    instruments: splitCsv(track.instrument),
    tags: splitCsv(track.tag),
    tempo: track.bpm ?? 0,
    tempo_bucket: track.tempo_bucket ?? "",
    start_key: track.start_key ?? "",
    end_key: track.end_key ?? "",
    duration_secs: track.duration ?? 0,
    preview_url: track.preview_url ?? "",
    source: track.source ?? "",
    provider: track.source ?? "",
    is_favorite: true,
  };
}

function filtersKey(filters: MusicFilters, showFavorites: boolean): string {
  return [
    showFavorites ? "fav" : "all",
    filters.genre?.join(",") ?? "",
    filters.mood?.join(",") ?? "",
    filters.instrument?.join(",") ?? "",
  ].join("|");
}

const musicColumns: Column<Music>[] = [
  { key: "title", label: "Title" },
  { key: "artist_name", label: "Artist" },
];

export interface MusicLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTrackId?: string | null;
  onSelect: (track: VoxifyTrack) => void;
}

function MusicFilterDropdown({
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

export default function MusicLibrary({
  open,
  onOpenChange,
  onSelect,
}: MusicLibraryProps) {
  const [tracks, setTracks] = useState<Music[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<MusicFilters>(DEFAULT_MUSIC_FILTERS);
  const [listReady, setListReady] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [favTrackIds, setFavTrackIds] = useState<Set<string>>(new Set());
  const [togglingTrackId, setTogglingTrackId] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;
  const showFavoritesRef = useRef(showFavorites);
  showFavoritesRef.current = showFavorites;

  const totalRef = useRef(0);
  const offsetRef = useRef(0);
  const lastQueryRef = useRef("");
  const hasMoreRef = useRef(false);
  const fetchingRef = useRef(false);

  const loadFavoriteIds = useCallback(async () => {
    try {
      const { status, data } = await adsApi.getFavTracks({ page: 1, limit: 100 });
      if (status === 200 && Array.isArray(data?.data)) {
        setFavTrackIds(new Set(data.data.map((t) => t.track_id)));
      }
    } catch (err) {
      logger.warn("Failed to load favorite track ids", { err });
    }
  }, []);

  const fetchTracks = useCallback(
    async (opts: { reset: boolean; nextOffset: number; searchQuery: string }) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;

      if (opts.reset) setLoading(true);
      else setLoadingMore(true);

      try {
        if (showFavoritesRef.current) {
          const { status, error, data } = await adsApi.getFavTracks(
            buildFavTracksPayload(filtersRef.current, opts.searchQuery, opts.nextOffset),
          );

          if (status !== 200 || error || !Array.isArray(data?.data)) {
            logger.warn("Favorite tracks fetch failed", { status, error });
            if (opts.reset) setTracks([]);
            hasMoreRef.current = false;
            setHasMore(false);
            return;
          }

          const next = data.data.map(mapFavTrackToMusic);
          const total = data.pagination?.total ?? next.length;
          const nextOffset = opts.nextOffset + next.length;

          totalRef.current = total;
          offsetRef.current = nextOffset;
          lastQueryRef.current = opts.searchQuery;
          setTracks((prev) => (opts.reset ? next : [...prev, ...next]));
          setFavTrackIds((prev) => {
            const nextIds = new Set(prev);
            for (const track of next) nextIds.add(track.track_id);
            return nextIds;
          });

          const more = nextOffset < total;
          hasMoreRef.current = more;
          setHasMore(more);
          return;
        }

        const { status, error, data } = await adsApi.searchVoxifyMusics(
          buildMusicPayload(filtersRef.current, opts.searchQuery, opts.nextOffset),
        );

        if (status !== 200 || error || !data?.data?.items) {
          logger.warn("Music library search failed", { status, error });
          if (opts.reset) setTracks([]);
          hasMoreRef.current = false;
          setHasMore(false);
          return;
        }

        const next = data.data.items;
        const nextOffset = opts.nextOffset + next.length;
        const total = data.data.total ?? 0;
        totalRef.current = total;
        offsetRef.current = nextOffset;
        lastQueryRef.current = opts.searchQuery;
        setTracks((prev) => (opts.reset ? next : [...prev, ...next]));
        setFavTrackIds((prev) => {
          const nextIds = new Set(prev);
          for (const track of next) {
            if (track.is_favorite) nextIds.add(track.track_id);
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
      setTracks([]);
      setSelectedTrackId(null);
      setFavTrackIds(new Set());
      setTogglingTrackId(null);
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
    void fetchTracks({ reset: true, nextOffset: 0, searchQuery: "" });
  }, [open, filters, showFavorites, fetchTracks, loadFavoriteIds]);

  const handleQueryChange = useCallback(
    (nextQuery: string) => {
      if (nextQuery === lastQueryRef.current) return;
      offsetRef.current = 0;
      void fetchTracks({ reset: true, nextOffset: 0, searchQuery: nextQuery });
    },
    [fetchTracks],
  );

  const handleLoadMore = useCallback(() => {
    if (fetchingRef.current || !hasMoreRef.current) return;
    void fetchTracks({
      reset: false,
      nextOffset: offsetRef.current,
      searchQuery: lastQueryRef.current,
    });
  }, [fetchTracks]);

  const selectedIds = useMemo(() => {
    if (!selectedTrackId) return [];
    const match = tracks.find((t) => t.track_id === selectedTrackId);
    return match ? [match.track_id] : [];
  }, [selectedTrackId, tracks]);

  const updateFilter = (key: keyof MusicFilters, value: string[]) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value.length > 0 ? value : null,
    }));
  };

  const handleUseTrack = () => {
    const track = tracks.find((t) => t.track_id === selectedTrackId);
    if (!track) return;
    onSelect(mapMusicToVoxifyTrack(track));
  };

  const handleToggleFavorite = async (track: Music) => {
    if (!track?.track_id || togglingTrackId) return;
    setTogglingTrackId(track.track_id);
    try {
      const { status, error, data, message } = await adsApi.toggleFavTrack(
        musicToFavPayload(track),
      );
      if (status !== 200 || error || !data?.data) {
        toast({
          title: "Could not update favorite",
          description: message || "Please try again",
          variant: "destructive",
        });
        return;
      }

      setFavTrackIds((prev) => {
        const next = new Set(prev);
        if (data.data.isFavorite) next.add(track.track_id);
        else next.delete(track.track_id);
        return next;
      });

      if (showFavoritesRef.current && !data.data.isFavorite) {
        setTracks((prev) => prev.filter((t) => t.track_id !== track.track_id));
        totalRef.current = Math.max(0, totalRef.current - 1);
        if (selectedTrackId === track.track_id) setSelectedTrackId(null);
      }
    } catch (err) {
      logger.warn("toggleFavTrack failed in MusicLibrary", { err });
      toast({
        title: "Could not update favorite",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setTogglingTrackId(null);
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
            <DialogTitle>Music library</DialogTitle>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <MusicFilterDropdown
              label="Genre"
              options={GENRE_OPTIONS}
              selected={filters.genre}
              onChange={(ids) => updateFilter("genre", ids)}
              className="w-[240px]"
            />
            <MusicFilterDropdown
              label="Mood"
              options={MOOD_OPTIONS}
              selected={filters.mood}
              onChange={(ids) => updateFilter("mood", ids)}
              className="w-[240px]"
            />
            <MusicFilterDropdown
              label="Instrument"
              options={INSTRUMENT_OPTIONS}
              selected={filters.instrument}
              onChange={(ids) => updateFilter("instrument", ids)}
              className="w-[240px]"
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
                  setSelectedTrackId(null);
                }}
                size="sm"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {!listReady ? (
              <div className="flex h-full min-h-[320px] items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <SearchableList<Music>
                key={`music-library-${filtersKey(filters, showFavorites)}`}
                items={tracks}
                columns={musicColumns}
                selectionMode="single"
                selectedIds={selectedIds}
                onSelectionChange={(ids) => {
                  const track = tracks.find((t) => t.track_id === ids[0]);
                  if (track) setSelectedTrackId(track.track_id);
                }}
                idKey="track_id"
                searchPlaceholder={showFavorites ? "Search favorites..." : "Search music..."}
                searchableKeys={["title", "artist_name"]}
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
                emptyMessage={showFavorites ? "No favorite tracks found" : "No tracks found"}
                loading={loading}
                renderItem={(track, isSelected) => (
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
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{track.title}</span>
                      <p className="text-xs text-muted-foreground truncate capitalize">
                        {[track.artist_name, ...(track.genres ?? []), ...(track.moods ?? [])]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <button
                      type="button"
                      title={favTrackIds.has(track.track_id) ? "Remove from favorites" : "Add to favorites"}
                      disabled={togglingTrackId === track.track_id}
                      className={cn(
                        "shrink-0 transition-colors",
                        favTrackIds.has(track.track_id)
                          ? "text-primary"
                          : "text-muted-foreground hover:text-primary",
                        togglingTrackId === track.track_id && "opacity-50",
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleToggleFavorite(track);
                      }}
                    >
                      {togglingTrackId === track.track_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Heart
                          className="h-4 w-4"
                          fill={favTrackIds.has(track.track_id) ? "currentColor" : "none"}
                        />
                      )}
                    </button>
                    {track.preview_url ? (
                      <div onClick={(e) => e.stopPropagation()}>
                        <InlineAudioPlayer audioUrl={track.preview_url} />
                      </div>
                    ) : null}
                  </div>
                )}
                showFooterContent={false}
              />
            )}
          </div>
        </div>

          <DialogFooter className="shrink-0 border-t bg-white px-6 py-4">
          
          <div className="flex md:flex-row items-center justify-between w-full">
            <span className="text-sm text-muted-foreground flex items-center">
              {tracks.length} of {totalRef.current} tracks found
              {
                loadingMore && (<Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />)
              }
            </span>

            {selectedTrackId && (
              
              <Button
                type="button"
                variant="default"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
                disabled={!selectedTrackId}
                onClick={handleUseTrack}
              >
                Use this track
              </Button>
            )}
            </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
