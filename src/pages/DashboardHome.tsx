import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, DollarSign, MousePointerClick, Target, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CampaignActionsGrid from '@/components/dashboard/CampaignActionsGrid';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import StatCard from '@/components/dashboard/StatCard';
import DashboardHero from '@/components/dashboard/DashboardHero';
import ReadyAdCard from '@/components/dashboard/ReadyAdCard';
import DraftCampaignCard, { DraftProgressBar } from '@/components/dashboard/DraftCampaignCard';
import { NewUserGetStartedCard, NewUserStatsStrip } from '@/components/dashboard/NewUserGetStartedCard';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { toast } from '@/components/ui/use-toast';
import { auth } from '@/services/auth';
import { Advertiser, advertiserApi } from '@/services/advertiser';
import { useTranslation } from '@/contexts/TranslationContext';
import { reportsApi } from '@/services/reports';
import { Campaign, campaignApi } from '@/services/campaign';
import { adsApi, AdData } from '@/services/ads';
import { userApi } from '@/services/user';
import { appNotifications } from '@/services/appNotifications';
import { getDraftChecklist, draftChecklistCaption, DraftChecklist } from '@/lib/campaignCompletion';

export default function DashboardHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ impressions: 0, spend: 0, reach: 0, cpa: 0 });
  const [loadingStats, setloadingStats] = useState(false);
  const [userName, setUserName] = useState('');

  const [isNewUser, setIsNewUser] = useState(false);
  const [isNewWithAd, setIsNewWithAd] = useState(false);
  const [hasDraftCampaign, setHasDraftCampaign] = useState(false);
  const [draftCampaignId, setDraftCampaignId] = useState<string | null>(null);
  const [draftCampaign, setDraftCampaign] = useState<Campaign | null>(null);
  const [draftChecklist, setDraftChecklist] = useState<DraftChecklist | null>(null);
  const [draftCount, setDraftCount] = useState(1);
  const [advertiserName, setAdvertiserName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [audioAds, setAudioAds] = useState<AdData[]>([]);

  const { t } = useTranslation();
  const { role } = useSessionFlags();
  const canEdit = role === 'ADMIN' || role === 'EDITOR' || role === 'EDITOR_RESTRICTED';

  const fetchStats = useCallback(async () => {
    const { data: { session } } = await auth.getSession();
    if (!session) return;
    const advertiserId = session.currentAdvertiserId;
    if (!advertiserId) return;
    setloadingStats(true);
    const { data, error, status } = await reportsApi.getDashboardCardsData({ advertiserId });
    if (status !== 200 || error) {
      setloadingStats(false);
      return;
    }
    setStats({
      impressions: data.data.cardTotals.impressions,
      spend: data.data.cardTotals.totalSpend,
      reach: data.data.cardTotals.demandAudioReachUniqueUsers,
      cpa: data.data.cardTotals.attributionCPAInUSD,
    });
    setloadingStats(false);
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    const { data: { session } } = await auth.getSession();
    if (!session) {
      setIsLoading(false);
      return;
    }

    let advertiserId = session.currentAdvertiserId;
    let advertisersList: Advertiser[] | null = null;
    if (!advertiserId) {
      const { data: advertisersRes, status: advertisersStatus, error: advertisersError, message: advertisersMessage } =
        await advertiserApi.getAdvertisers(session.currentOrganizationId);
      if (advertisersStatus !== 200 || advertisersError) {
        toast({ title: t('common.error'), description: advertisersMessage ?? 'Unable to load advertisers', variant: 'destructive' });
        setIsLoading(false);
        return;
      }
      advertisersList = advertisersRes.data;
      if (advertisersList.length > 0) {
        auth.setCurrentAdvertiserId(advertisersList[0].id, advertisersList[0].isPro);
        advertiserId = advertisersList[0].id;
      } else {
        setIsLoading(false);
        return;
      }
    }

    userApi.getUserProfile().then(({ data, status, error }) => {
      if (status === 200 && !error && data?.data?.firstName) setUserName(data.data.firstName);
    });

    // Best-effort lookup of the current advertiser's display name, reusing the
    // list already fetched above when we have it instead of refetching.
    const getAdvertiserDisplayName = async (id: string): Promise<string> => {
      const list =
        advertisersList ??
        (await advertiserApi.getAdvertisers(session.currentOrganizationId).then((r) =>
          r.status === 200 && !r.error ? r.data.data : [],
        ));
      return list.find((a) => a.id === id)?.advertiserName ?? '';
    };

    const campaings = await campaignApi.getCampaigns({ advertiserId, page: 1, limit: 1 });
    if (campaings.status === 200 && !campaings.error && campaings.data.data.length > 0) {
      // Most-recent campaign (default sort is createdAt desc) -- cheap reuse of the
      // "any campaign" check above rather than a second status-filtered fetch. Only
      // looks at the single latest campaign, so a user with an older live campaign
      // plus a newer draft would be shown the draft nudge instead of steady-state --
      // an acceptable simplification since that mix is unlikely this early in a
      // user's lifecycle.
      const latestCampaign = campaings.data.data[0];
      const isDraft = latestCampaign.status?.toString().toUpperCase() === 'DRAFT';
      setIsNewUser(false);
      setIsNewWithAd(false);
      setHasDraftCampaign(isDraft);
      setDraftCampaignId(isDraft ? latestCampaign.id ?? null : null);

      if (isDraft && latestCampaign.id) {
        // The list endpoint above only returns a lean field set (it also backs the
        // paginated campaigns grid, so it deliberately omits audioId/adGroups/
        // timestamps). The checklist and "last edited" copy need the fuller record,
        // so fetch it via the same single-campaign endpoint CampaignWizard already
        // uses to hydrate a draft for editing.
        const fullRes = await campaignApi.getCampaign({ id: latestCampaign.id, advertiserId });
        const fullCampaign = fullRes.status === 200 && !fullRes.error && fullRes.data?.data ? fullRes.data.data : latestCampaign;

        setDraftCampaign(fullCampaign);
        setDraftChecklist(getDraftChecklist(fullCampaign));

        const [draftsMeta, advertiserDisplayName] = await Promise.all([
          campaignApi.getCampaigns({ advertiserId, status: 'DRAFT', page: 1, limit: 1 }),
          getAdvertiserDisplayName(advertiserId),
        ]);
        setDraftCount(draftsMeta.status === 200 && !draftsMeta.error ? draftsMeta.data.meta.total : 1);
        setAdvertiserName(advertiserDisplayName);
      } else {
        setDraftCampaign(null);
        setDraftChecklist(null);
      }

      setIsLoading(false);
      if (!isDraft) await fetchStats();
      return;
    }

    setHasDraftCampaign(false);
    setDraftCampaignId(null);
    setDraftCampaign(null);
    setDraftChecklist(null);

    const audioAdsRes = await adsApi.getAds({ advertiserId, page: 1, limit: 1, isSaved: true });
    const hasAudioAds =
      audioAdsRes.status === 200 && !audioAdsRes.error && audioAdsRes.data.data.length > 0;
    if (hasAudioAds) {
      setAudioAds(audioAdsRes.data.data);
    }

    setIsNewUser(true);
    setIsNewWithAd(hasAudioAds);
    setIsLoading(false);
  }, [fetchStats, t]);

  useEffect(() => {
    load();
  }, [load]);

  // List created/updated/deleted in Account → Advertisers tab
  useEffect(() => {
    return appNotifications.subscribe('advertisers:changed', () => {
      void load();
    });
  }, [load]);

  // Header advertiser dropdown changed in DashboardLayout
  useEffect(() => {
    return appNotifications.subscribe('advertiser:selected', () => {
      void load();
    });
  }, [load]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  const cpa = stats.reach > 0 ? (stats.spend / stats.reach).toFixed(2) : '0';

  const steps = [
    { num: 1, title: 'Create your studio-quality ad (free)', desc: 'Describe your brand to instantly generate a perfect AI script, lifelike voice, and music mix. Refine for free until it\'s broadcast-ready.' },
    { num: 2, title: 'Target listeners, not wasted ears', desc: 'Stop paying for broad reach. Pinpoint your ideal audience by age, gender, and interests across top podcasts and music streams.' },
    { num: 3, title: 'Set your budget and scale', desc: 'Control your spend with daily budgets. Maximize your reach across your local neighborhood, city, or go global with one click.' },
    { num: 4, title: 'Pay locally and go live', desc: 'Checkout securely using local credit cards, mobile wallets, or bank transfers with no friction. Your campaign goes live in minutes.' },
  ];

  const draftSubcopy = draftCampaign
    ? [
        draftCampaign.updatedAt ? `Last edited ${formatDistanceToNow(new Date(draftCampaign.updatedAt), { addSuffix: true })}` : null,
        advertiserName || null,
        `$${Number(draftCampaign.totalBudget ?? draftCampaign.budget ?? 0).toLocaleString()} budget`,
      ].filter(Boolean).join(' · ')
    : '';

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {!isNewUser && !isNewWithAd && !hasDraftCampaign && (
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here&apos;s your overview.</p>
        </div>
      )}

      {/* Draft campaign nudge */}
      {hasDraftCampaign && draftCampaign && draftChecklist && (
        <DashboardHero
          accentClassName="border-l-4 border-l-primary"
          eyebrow={
            <>
              <span>You&apos;re almost there</span>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-transparent normal-case">
                Draft
              </Badge>
            </>
          }
          title={draftCampaign.campaignName || 'Untitled campaign'}
          subcopy={draftSubcopy}
          primaryAction={{
            label: 'Resume campaign',
            onClick: () => navigate(`/dashboard/campaigns/${draftCampaignId}`),
          }}
          secondaryAction={{
            label: `See all ${draftCount} draft${draftCount === 1 ? '' : 's'}`,
            onClick: () => navigate('/dashboard/campaigns?status=DRAFT'),
          }}
          rightCard={<DraftCampaignCard checklist={draftChecklist} />}
          belowCard={
            <div className="px-1 space-y-2">
              <DraftProgressBar checklist={draftChecklist} />
              <p className="text-xs text-muted-foreground">{draftChecklistCaption(draftChecklist)}</p>
            </div>
          }
        />
      )}

      {/* Ready ad, no campaign yet */}
      {!hasDraftCampaign && isNewWithAd && (
        <>
          {canEdit && audioAds[0] && (
            <DashboardHero
              title="Your ad is ready. Put it on air."
              subcopy="Pick your listeners, set a budget, launch. About two minutes."
              primaryAction={{
                label: 'Create campaign with this ad',
                onClick: () => navigate(`/dashboard/campaigns/new?audioId=${audioAds[0].id}`),
              }}
              secondaryAction={{
                label: 'Create another ad',
                onClick: () => navigate('/dashboard/ads/new'),
              }}
              rightCard={
                <ReadyAdCard ad={audioAds[0]} onEditAudio={() => navigate(`/dashboard/ads/${audioAds[0].id}`)} />
              }
            />
          )}

          {/* Educational Section */}
          <Card className="border border-border overflow-hidden rounded-[32px]">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-0">
                <div className="md:col-span-2 relative min-h-[200px] flex items-end justify-start">
                  <img
                    src={'/headphone-woman.png'}
                    alt="Woman enjoying audio with headphones"
                    className="w-full h-full object-cover object-center"
                  />
                </div>

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

      {/* Brand-new user: no ad, no campaign */}
      {!hasDraftCampaign && isNewUser && !isNewWithAd && (
        <DashboardHero
          eyebrow={<span>{userName ? `Welcome, ${userName}` : 'Welcome'}</span>}
          title="Get your first audio ad live in minutes."
          subcopy="Drop your website. We'll write, voice and mix it."
          primaryAction={{ label: 'Create my audio ad', onClick: () => navigate('/dashboard/ads/new') }}
          secondaryAction={{ label: 'Or build a campaign first', onClick: () => navigate('/dashboard/campaigns/new') }}
          rightCard={<NewUserGetStartedCard />}
          belowCard={<NewUserStatsStrip />}
          showActions={canEdit}
        />
      )}

      {/* Steady state */}
      {!isNewUser && !hasDraftCampaign && (
        <>
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-2">This Month</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Total Impressions" value={stats.impressions.toLocaleString()} icon={Eye} loading={loadingStats} />
              <StatCard label="Total Spend" value={`$${stats.spend?.toFixed(2).toLocaleString()}`} icon={DollarSign} loading={loadingStats} />
              <StatCard label="Total Reach" value={stats.reach.toLocaleString()} icon={MousePointerClick} loading={loadingStats} />
              <StatCard label="CPA" value={`$${cpa}`} icon={Target} loading={loadingStats} />
            </div>
          </div>

          <CampaignActionsGrid />
        </>
      )}
    </div>
  );
}
