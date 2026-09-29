import spotifyIcon from '@/assets/partners/spotify-icon.webp';
import applePodcastsIcon from '@/assets/partners/apple-podcasts-icon.webp';
import castboxIcon from '@/assets/partners/castbox-icon.webp';
import tuneinIcon from '@/assets/partners/tunein.webp';

// Platforms and icons from PARTNER_PILLS in admanager_landing/src/components/shared/phone-mockup.tsx (minus YouTube)
const PARTNER_PILLS = [
  { name: 'Spotify', src: spotifyIcon },
  { name: 'Apple Podcasts', src: applePodcastsIcon },
  { name: 'Castbox', src: castboxIcon },
  { name: 'TuneIn', src: tuneinIcon },
] as const;

// One pill: an "Available on" label followed by the platform logos (no names; each logo
// keeps its name as alt text/tooltip for screen readers and hover).
export default function PartnerPills() {
  return (
    // Full width of the reach panel so it lines up with the 50K+ / 100M+ stats above; logos
    // spread across the space after the label.
    <div className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 rounded-[8px] border border-border bg-background px-3 py-2">
      <span className="text-xs text-muted-foreground">Available on</span>
      <div className="flex flex-1 flex-wrap items-center justify-between gap-2.5">
        {PARTNER_PILLS.map((pill) => (
          <img
            key={pill.name}
            src={pill.src}
            alt={pill.name}
            title={pill.name}
            height={24}
            // Fixed height, natural width: TuneIn's logo is a wide wordmark, not a square icon.
            className="h-6 w-auto object-contain"
          />
        ))}
      </div>
    </div>
  );
}
