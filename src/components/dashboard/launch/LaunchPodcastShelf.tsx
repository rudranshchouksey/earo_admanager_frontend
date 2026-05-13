import { podcasts } from '@/components/landing/podcastData';

export default function LaunchPodcastShelf() {
  const displayPodcasts = podcasts.slice(0, 6);

  return (
    <div className="space-y-3">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Your ad will play in shows like these</h4>
      <div className="grid grid-cols-3 gap-2">
        {displayPodcasts.map((podcast) => (
          <div key={podcast.id} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md overflow-hidden bg-muted shrink-0">
              <img src={podcast.image} alt={podcast.name} className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{podcast.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{podcast.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
