import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
// import { podcasts } from '@/components/landing/podcastData';
import { Eye, DollarSign, MousePointerClick, Target, Volume2, Radio, TrendingUp, Play, Pause } from 'lucide-react';
import CampaignActionsGrid from '@/components/dashboard/CampaignActionsGrid';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StatCard from '@/components/dashboard/StatCard';
// import { supabase } from '@/integrations/supabase/client';
// import { useDevFlags } from '@/contexts/DevFlagsContext';
// import headphoneWoman from '@/assets/images/headphone-woman.png';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { toast } from '@/components/ui/use-toast';
import { auth } from '@/services/auth';
import { advertiserApi } from '@/services/advertiser';
import { useTranslation } from '@/contexts/TranslationContext';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { isNewUser } = useSessionFlags();
  const [stats, setStats] = useState({ impressions: 0, spend: 0, reach: 0 });
  const [userName, setUserName] = useState('');
  const [userState, setuserState] = useState('existing')

  const { t } = useTranslation();
  const mockStats = { impressions: 0, spend: 0, reach: 0 };

  useEffect(() => {
    const getAdvertiserId = async () => {
     const { data: { session } } = await auth.getSession();
     if(!session) return;
     const advertiserId = session.currentAdvertiserId;
     console.log("advertiserId here ", {advertiserId});
     if(!advertiserId) {
      const { data: advertisersRes, status: advertisersStatus, error: advertisersError, message: advertisersMessage } = await advertiserApi.getAdvertisers(session.currentOrganizationId);
      if(advertisersStatus !== 200 || advertisersError) {
        toast({ title: t('common.error'), description: advertisersMessage ?? 'Unable to load advertisers', variant: 'destructive' });
      }
      const advertisers = advertisersRes.data;
      if(advertisers.length > 0) {
        console.log("advertisers here ", advertisers[0]);
        auth.setCurrentAdvertiserId(advertisers[0].id, advertisers[0].isPro);
      }
     }
    };
    getAdvertiserId();
  }, []);

  useEffect(() => {
    if (userState === 'existing') {
      setStats(mockStats);
      return;
    }
    if (userState === 'new' || userState === 'new_with_ad') return;
    const fetchStats = async () => {
      const { data } = await supabase
        .from('campaigns')
        .select('actual_impressions, actual_spend, reach');
      if (data) {
        setStats({
          impressions: data.reduce((s, c) => s + (c.actual_impressions ?? 0), 0),
          spend: data.reduce((s, c) => s + (c.actual_spend ?? 0), 0),
          reach: data.reduce((s, c) => s + (c.reach ?? 0), 0),
        });
      }
    };
    fetchStats();
  }, [userState]);

  const cpa = stats.reach > 0 ? (stats.spend / stats.reach).toFixed(2) : '0';

  const isNewWithAd = false;

  const greeting = userName ? `Welcome, ${userName}` : 'Welcome';

  // Mock ad for the player in new_with_ad state
  const mockGeneratedAd = {
    brandName: 'Your Brand',
    audioUrl: '',
    duration: 30,
    script: 'Your professional audio ad is ready to go.',
    category: 'general',
    tone: 'professional',
    voiceId: 'default',
    musicId: 'default',
  };

  const steps = [
    { num: 1, title: 'Create your studio-quality ad (free)', desc: 'Describe your brand to instantly generate a perfect AI script, lifelike voice, and music mix. Refine for free until it\'s broadcast-ready.' },
    { num: 2, title: 'Target listeners, not wasted ears', desc: 'Stop paying for broad reach. Pinpoint your ideal audience by age, gender, and interests across top podcasts and music streams.' },
    { num: 3, title: 'Set your budget and scale', desc: 'Control your spend with daily budgets. Maximize your reach across your local neighborhood, city, or go global with one click.' },
    { num: 4, title: 'Pay locally and go live', desc: 'Checkout securely using local credit cards, mobile wallets, or bank transfers with no friction. Your campaign goes live in minutes.' },
  ];

  // Inline waveform player component
  function DashboardAdPlayer({ audioUrl, duration }: { audioUrl: string; duration: number }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
      const audio = audioRef.current;
      if (!audio) return;
      const onTime = () => setProgress((audio.currentTime / audio.duration) * 100);
      const onEnd = () => { setIsPlaying(false); setProgress(0); };
      audio.addEventListener('timeupdate', onTime);
      audio.addEventListener('ended', onEnd);
      return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('ended', onEnd); };
    }, []);

    const togglePlay = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (isPlaying) audio.pause(); else audio.play();
      setIsPlaying(!isPlaying);
    };

    const bars = Array.from({ length: 40 }, (_, i) => ({
      height: 20 + Math.sin(i * 0.5) * 25 + Math.random() * 30,
    }));

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

    return (
      <div className="bg-muted/50 rounded-xl px-4 py-3 flex items-center gap-3">
        <audio ref={audioRef} src={audioUrl} preload="auto" />
        <Button
          size="icon"
          className="rounded-full w-10 h-10 shrink-0 bg-primary hover:bg-primary/90"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </Button>
        <div className="flex items-center gap-px h-10 flex-1 min-w-0">
          {bars.map((bar, i) => {
            const isActive = (i / bars.length) * 100 <= progress;
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-150 ${isActive ? 'bg-primary' : 'bg-primary/30'}`}
                style={{ height: `${bar.height}%` }}
              />
            );
          })}
        </div>
        <span className="text-sm text-primary font-medium shrink-0">{formatTime(duration)}</span>
      </div>
    );
  }

  const podcasts = [];

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          {isNewWithAd ? greeting : 'Dashboard'}
        </h1>
        <p className="text-muted-foreground mt-1">
          {isNewWithAd
            ? 'Edit your audio ad or start creating a campaign.'
            : 'Welcome back. Here\'s your overview.'}
        </p>
      </div>

      {/* New With Ad state */}
      {isNewWithAd && (
        <>
           <div className="bg-muted/50 rounded-[32px] p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left: Audio Player Card */}
              <Card className="border-0 shadow-none rounded-[24px] bg-card">
                <CardContent className="p-5 space-y-3">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{mockGeneratedAd.brandName}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Share it or edit the ad to change the script or the voice talent.
                    </p>
                  </div>

                  {/* Waveform player */}
                  <DashboardAdPlayer audioUrl={mockGeneratedAd.audioUrl} duration={mockGeneratedAd.duration} />

                   {/* Edit / Create Campaign buttons */}
                   <div className="grid grid-cols-2 gap-3">
                     <Button variant="outline" className="h-10" onClick={() => navigate('/dashboard/ads/new')}>
                       Edit
                     </Button>
                     <Button className="h-10" onClick={() => navigate('/dashboard/campaigns/new')}>
                       Create Campaign
                     </Button>
                   </div>
                </CardContent>
              </Card>

              {/* Right: Podcast Shelf */}
              <div className="flex flex-col justify-start pt-2 px-1">
                <h3 className="text-base font-semibold text-foreground mb-3 leading-snug">
                  Your ad will sound in podcasts<br />like these:
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {podcasts.slice(0, 3).map((podcast) => (
                    <div key={podcast.id} className="flex flex-col">
                      <img
                        src={podcast.image}
                        alt={podcast.name}
                        className="w-full aspect-square object-cover rounded-xl"
                      />
                      <p className="text-xs font-semibold text-foreground mt-1.5 truncate">{podcast.name}</p>
                      <p className="text-[11px] text-muted-foreground">50,000 daily listeners</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Educational Section */}
          <Card className="border border-border overflow-hidden rounded-[32px]">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                {/* Left: Image */}
                <div className="md:col-span-2 relative min-h-[200px] flex items-end justify-start">
                  <img
                    // src={headphoneWoman}
                    alt="Woman enjoying audio with headphones"
                    className="w-full h-full object-cover object-center"
                  />
                </div>

                {/* Right: Idea to Airwaves */}
                <div className="md:col-span-3 p-5 space-y-4">
                   <h3 className="text-lg font-semibold text-foreground">Idea to airwaves in 4 simple steps</h3>
                   <div className="space-y-4">
                     {steps.map((step) => (
                       <div key={step.num} className="flex items-start gap-3">
                         <div className="h-8 w-8 rounded-lg bg-foreground flex items-center justify-center shrink-0 mt-0.5">
                           <span className="text-sm font-semibold text-background">{step.num}</span>
                         </div>
                         <div>
                           <h4 className="font-semibold text-foreground text-sm">{step.title}</h4>
                           <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{step.desc}</p>
                         </div>
                       </div>
                     ))}
                   </div>
                 </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Primary CTAs — new users only */}
      {isNewUser && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="border-2 border-transparent hover:border-primary/20 hover:shadow-md transition-shadow rounded-[32px]">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Create Campaign</h3>
              <p className="text-sm text-muted-foreground">Launch your ad across streaming platforms</p>
              <Button onClick={() => navigate('/dashboard/campaigns/new')}>Create Campaign</Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-transparent hover:border-primary/20 hover:shadow-md transition-shadow rounded-[32px]">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-lg font-semibold text-foreground">Create Audio Ad</h3>
              <p className="text-sm text-muted-foreground">Generate an AI-powered audio ad in minutes</p>
              <Button onClick={() => navigate('/dashboard/ads/new')}>Create Audio Ad</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New User Welcome or Monthly Stats */}
      {isNewUser ? (
        <Card className="border-2 border-dashed border-primary/20 rounded-[32px]">
          <CardContent className="p-5">
            <h2 className="text-xl font-semibold text-foreground mb-1">Get Started with Earo</h2>
            <p className="text-sm text-muted-foreground mb-4">Everything you need to launch your first audio campaign.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Volume2, title: 'Create AI Audio Ads', desc: 'Generate professional audio ads with AI in minutes' },
                { icon: Radio, title: 'Launch Campaigns', desc: 'Reach listeners on Spotify, Anghami, and more' },
                { icon: TrendingUp, title: 'Track Performance', desc: 'Monitor impressions, reach, and spend in real time' },
              ].map((item) => (
                <div key={item.title} className="flex flex-col items-center text-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : userState === 'existing' ? (
        <>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">This Month</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Total Impressions" value={stats.impressions.toLocaleString()} icon={Eye} trend={stats.impressions > 0 ? 'Active' : 'No data yet'} />
              <StatCard label="Total Spent" value={`$${stats.spend.toLocaleString()}`} icon={DollarSign} trend={stats.spend > 0 ? 'Active' : 'No data yet'} />
              <StatCard label="Total Reach" value={stats.reach.toLocaleString()} icon={MousePointerClick} trend={stats.reach > 0 ? 'Active' : 'No data yet'} />
              <StatCard label="CPA" value={`$${cpa}`} icon={Target} trend={stats.reach > 0 ? 'Active' : 'No data yet'} />
            </div>
          </div>

          <CampaignActionsGrid />
        </>
      ) : null}
    </div>
  );
}
