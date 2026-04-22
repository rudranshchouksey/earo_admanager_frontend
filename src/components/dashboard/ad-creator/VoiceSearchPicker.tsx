import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SearchableList } from '@/components/ui/searchable-list';
import type { Column, FilterDef } from '@/components/ui/searchable-list';
import InlineAudioPlayer from './InlineAudioPlayer';
// import { VOICES, type VoiceEntry } from './voiceData';
interface VoiceEntry {
  id: string;
  name: string;
  traits: string;
  language: string;
  gender: string;
  mood: string;
}

const voiceColumns: Column<VoiceEntry>[] = [
  { key: 'name', label: 'Name' },
  { key: 'traits', label: 'Traits' },
];

const voiceFilters: FilterDef[] = [
  {
    key: 'language',
    label: 'Language',
    options: [...new Set([].map((v) => v.language))].sort().map((l) => ({ value: l, label: l })),
  },
  {
    key: 'gender',
    label: 'Gender',
    options: [
      { value: 'female', label: 'Female' },
      { value: 'male', label: 'Male' },
    ],
  },
];

interface VoiceSearchPickerProps {
  selectedVoiceId: string | null;
  onSelect: (voiceId: string, voiceName: string) => void;
}

export default function VoiceSearchPicker({ selectedVoiceId, onSelect }: VoiceSearchPickerProps) {
  return (
    <SearchableList<VoiceEntry>
      items={[]}
      columns={voiceColumns}
      selectionMode="single"
      selectedIds={selectedVoiceId ? [selectedVoiceId] : []}
      onSelectionChange={(ids) => {
        const voice = [].find((v) => v.id === ids[0]);
        if (voice) onSelect(voice.id, voice.name);
      }}
      idKey="id"
      collapsible
      collapsibleLabel="Select a voice"
      rotatingLabels={['language', 'accent', 'gender', 'mood']}
      searchableKeys={['name', 'traits', 'language', 'gender', 'mood']}
      filters={voiceFilters}
      variant="list"
      maxHeight="400px"
      pageSize={50}
      emptyMessage="No voices found"
      renderItem={(voice, isSelected) => (
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
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={voice?.image_url || ''} alt={voice.name} className="object-cover" />
            <AvatarFallback className="text-xs font-medium bg-muted text-foreground">
              {voice.name.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-foreground">{voice.name}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 capitalize font-normal">
                {voice.gender}
              </Badge>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                {voice.language}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground truncate">{voice.traits}</p>
          </div>
          <InlineAudioPlayer duration={6} />
        </div>
      )}
    />
  );
}
