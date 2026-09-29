import { Button } from '@/components/ui/button';
import AudioCardPlayer from '@/components/shared/AudioCardPlayer';
import { useIsMobile } from '@/hooks/use-mobile';
import type { AdData } from '@/services/ads';

interface ReadyAdCardProps {
  ad: AdData;
  onEditAudio: () => void;
}

// The created ad in the Getting Started checklist: the landing site's AudioCardPlayer at full
// width, with "Edit ad" inside the player on the right. On phones the step's marker column
// leaves too little room for that, so the player slides under the marker (-ms = 36px marker
// + 16px gap in GettingStartedCard) and "Edit ad" moves below it.
export default function ReadyAdCard({ ad, onEditAudio }: ReadyAdCardProps) {
  const isMobile = useIsMobile();
  const duration = Math.round(Number(ad.duration) || 0);
  const title = duration > 0 ? `${ad.adName} · ${duration}s` : ad.adName;
  const editButton = (
    <Button variant="outline" onClick={onEditAudio}>
      Edit ad
    </Button>
  );

  return (
    <div className="-ms-[52px] space-y-2 md:ms-0">
      <AudioCardPlayer
        sample={{ id: ad.id, title, audioUrl: ad.sourceUrl ?? '' }}
        className="lg:max-w-full"
        action={isMobile ? undefined : editButton}
      />
      {isMobile && <div className="flex justify-end">{editButton}</div>}
    </div>
  );
}
