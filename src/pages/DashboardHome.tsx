import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, DollarSign, MousePointerClick, Target, Loader2 } from 'lucide-react';
import CampaignActionsGrid from '@/components/dashboard/CampaignActionsGrid';
import StatCard from '@/components/dashboard/StatCard';
import GettingStartedCard from '@/components/dashboard/GettingStartedCard';
import WhatYouCanDoSection from '@/components/dashboard/WhatYouCanDoSection';
import ReachStatsSection from '@/components/dashboard/ReachStatsSection';
import AgencyGettingStartedCard from '@/components/dashboard/AgencyGettingStartedCard';
import AgencyWhatYouCanDoSection from '@/components/dashboard/AgencyWhatYouCanDoSection';
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
import { getDraftChecklist, DraftChecklist } from '@/lib/campaignCompletion';

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
  const [hasNoAdvertisers, setHasNoAdvertisers] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioAds, setAudioAds] = useState<AdData[]>([]);

  const { t } = useTranslation();
  const { role, isAgency } = useSessionFlags();
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
        setHasNoAdvertisers(true);
        setIsLoading(false);
        return;
      }
    }

    setHasNoAdvertisers(false);

    userApi.getUserProfile().then(({ data, status, error }) => {
      if (status === 200 && !error && data?.data?.firstName) setUserName(data.data.firstName);
    });

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

        const draftsMeta = await campaignApi.getCampaigns({ advertiserId, status: 'DRAFT', page: 1, limit: 1 });
        setDraftCount(draftsMeta.status === 200 && !draftsMeta.error ? draftsMeta.data.meta.total : 1);
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

    const audioAdsRes = await adsApi.getAds({
      advertiserId,
      page: 1,
      limit: 1,
      isSaved: true,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
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

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {!isNewUser && !isNewWithAd && !hasDraftCampaign && !(isAgency && hasNoAdvertisers) && (
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here&apos;s your overview.</p>
        </div>
      )}

      {/* Agency org with zero advertisers yet */}
      {isAgency && hasNoAdvertisers && (
        <>
          <div className="space-y-1.5 px-1">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground">
              {userName ? `WELCOME, ${userName.toUpperCase()}` : 'WELCOME'}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              Set up your agency workspace
            </h1>
            <p className="text-sm text-muted-foreground">
              Add your first advertiser to start managing campaigns on their behalf.
            </p>
          </div>

          <AgencyGettingStartedCard canEdit={role === 'ADMIN'} />
          <AgencyWhatYouCanDoSection />
          <ReachStatsSection heading="Your clients' reach on Earo" />
        </>
      )}

      {/* Pre-campaign states: brand-new, has-ad, or draft-campaign-in-progress */}
      {!(isAgency && hasNoAdvertisers) && (isNewUser || hasDraftCampaign) && (
        <>
          <div className="space-y-1.5 px-1">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground">
              {userName ? `WELCOME, ${userName.toUpperCase()}` : 'WELCOME'}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {hasDraftCampaign
                ? "You're almost live."
                : isNewWithAd
                ? "Your ad is ready. Let's get it on air."
                : 'Get your first audio ad live.'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {hasDraftCampaign
                ? 'Finish setting up your campaign to start reaching listeners.'
                : isNewWithAd
                ? 'One more step to reach listeners across 50K+ podcasts and radio stations.'
                : 'Three steps to reach listeners across 50K+ podcasts and radio stations.'}
            </p>
          </div>

          <GettingStartedCard
            hasAudioAd={isNewWithAd}
            latestAudioAd={audioAds[0]}
            hasDraftCampaign={hasDraftCampaign}
            draftCampaign={draftCampaign}
            draftChecklist={draftChecklist}
            draftCampaignId={draftCampaignId}
            draftCount={draftCount}
            canEdit={canEdit}
          />

          <WhatYouCanDoSection hasAudioAd={isNewWithAd} />
          <ReachStatsSection />
        </>
      )}

      {/* Steady state */}
      {!(isAgency && hasNoAdvertisers) && !isNewUser && !hasDraftCampaign && (
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
