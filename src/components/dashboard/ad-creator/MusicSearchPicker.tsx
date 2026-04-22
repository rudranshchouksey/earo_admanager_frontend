import { Music } from 'lucide-react';
import InlineAudioPlayer from './InlineAudioPlayer';
import { cn } from '@/lib/utils';
import { SearchableList } from '@/components/ui/searchable-list';
import type { Column, FilterDef } from '@/components/ui/searchable-list';
// import { TRACKS, type TrackEntry } from './musicData';

interface TrackEntry {
  id: string;
  name: string;
  traits: string;
  genre: string;
  mood: string;
}

const trackColumns: Column<TrackEntry>[] = [
  { key: 'name', label: 'Name' },
  { key: 'traits', label: 'Traits' },
];

const trackFilters: FilterDef[] = [
  {
    key: 'genre',
    label: 'Genre',
    options: [...new Set([].map((t) => t.genre))].sort().map((g) => ({ value: g, label: g.charAt(0).toUpperCase() + g.slice(1) })),
  },
  {
    key: 'mood',
    label: 'Mood',
    options: [...new Set([].map((t) => t.mood))].sort().map((m) => ({ value: m, label: m.charAt(0).toUpperCase() + m.slice(1) })),
  },
];

interface MusicSearchPickerProps {
  selectedTrackId: string | null;
  onSelect: (trackId: string, trackName: string) => void;
}

export default function MusicSearchPicker({ selectedTrackId, onSelect }: MusicSearchPickerProps) {
  return (
    <SearchableList<TrackEntry>
      items={[]}
      columns={trackColumns}
      selectionMode="single"
      selectedIds={selectedTrackId ? [selectedTrackId] : []}
      onSelectionChange={(ids) => {
        const track = [].find((t) => t.id === ids[0]);
        if (track) onSelect(track.id, track.name);
      }}
      idKey="id"
      collapsible
      collapsibleLabel="Select a track"
      rotatingLabels={['mood', 'genre', 'instrument', 'rhythm']}
      searchableKeys={['name', 'traits', 'mood', 'genre']}
      filters={trackFilters}
      variant="list"
      maxHeight="400px"
      pageSize={50}
      emptyMessage="No tracks found"
      renderItem={(track, isSelected) => (
        <div
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
            isSelected ? 'bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'
          )}
        >
          <div className={cn(
            'h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors',
            isSelected ? 'border-primary' : 'border-muted-foreground/40'
          )}>
            {isSelected && <div className="h-2 w-2 rounded-full bg-primary" />}
          </div>
          <div className="h-9 w-9 shrink-0 rounded-md bg-muted flex items-center justify-center">
            <Music className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium text-foreground">{track.name}</span>
            <p className="text-xs text-muted-foreground truncate">{track.traits}</p>
          </div>
          <InlineAudioPlayer duration={8} />
        </div>
      )}
    />
  );
}
