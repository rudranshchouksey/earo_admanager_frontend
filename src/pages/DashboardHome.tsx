import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { walletApi } from '@/services/wallet';
import { userApi } from '@/services/user';
import { appNotifications } from '@/services/appNotifications';
import { getDraftChecklist, DraftChecklist } from '@/lib/campaignCompletion';
import { logger } from '@/lib/logger';

// How many saved ads the draft-campaign path fetches to confirm the draft's attached ad
// still exists (see load()).
const DRAFT_ADS_LOOKUP_LIMIT = 50;

// "Visa •••• 4242" for the completed payment step. Cards store last_4 as "**** **** **** 4242"
// and type as Mamo's card brand; falls back to "Card" when the brand is missing.
function formatCardLabel(card?: { type?: string | null; last_4?: string | null }): string | null {
  const last4 = card?.last_4?.match(/(\d{4})\s*$/)?.[1];
  if (!last4) return null;
  const brand = card?.type?.trim();
  const brandLabel = brand ? brand.charAt(0).toUpperCase() + brand.slice(1).toLowerCase() : 'Card';
  return `${brandLabel} •••• ${last4}`;
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ impressions: 0, spend: 0, reach: 0, cpa: 0 });
  const [loadingStats, setloadingStats] = useState(false);
  const [userName, setUserName] = useState('');

  const [isNewUser, setIsNewUser] = useState(false);
  const [hasDraftCampaign, setHasDraftCampaign] = useState(false);
  const [draftCampaignId, setDraftCampaignId] = useState<string | null>(null);
  const [draftCampaign, setDraftCampaign] = useState<Campaign | null>(null);
  const [draftChecklist, setDraftChecklist] = useState<DraftChecklist | null>(null);
  const [hasNoAdvertisers, setHasNoAdvertisers] = useState(false);
  const [hasPaymentMethod, setHasPaymentMethod] = useState(false);
  const [paymentCardLabel, setPaymentCardLabel] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
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

  // Each advertiser switch (or the advertisers/advertiser-selected notifications) fires
  // a fresh load() call without waiting for any in-flight one to finish. Since this
  // function does several sequential/parallel awaits, a slower older call can resolve
  // after a newer one and clobber its state with stale data -- this token makes every
  // call check it's still the most recent before committing state.
  const loadRequestIdRef = useRef(0);

  const applyCards = useCallback((cardsRes: Awaited<ReturnType<typeof walletApi.getCards>>) => {
    const cards = cardsRes.status === 200 && !cardsRes.error ? (cardsRes.data?.data ?? []) : [];
    setHasPaymentMethod(cards.length > 0);
    setPaymentCardLabel(formatCardLabel(cards[0]));
  }, []);

  const load = useCallback(async () => {
    const requestId = ++loadRequestIdRef.current;
    const isStale = () => loadRequestIdRef.current !== requestId;

    setIsLoading(true);
    try {
      const { data: { session } } = await auth.getSession();
      if (isStale()) return;
      if (!session) {
        setIsLoading(false);
        return;
      }

      let advertiserId = session.currentAdvertiserId;
      let advertisersList: Advertiser[] | null = null;
      if (!advertiserId) {
        const { data: advertisersRes, status: advertisersStatus, error: advertisersError, message: advertisersMessage } =
          await advertiserApi.getAdvertisers(session.currentOrganizationId);
        if (isStale()) return;
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
      setAudioAds([]);

      userApi.getUserProfile().then(({ data, status, error }) => {
        if (status === 200 && !error && data?.data?.firstName) setUserName(data.data.firstName);
      });

      const campaings = await campaignApi.getCampaigns({ advertiserId, page: 1, limit: 1000 });
      if (isStale()) return;
      if (campaings.status === 200 && !campaings.error && campaings.data.data.length > 0) {
        // Most-recent campaign (default sort is createdAt desc) -- cheap reuse of the
        // "any campaign" check above rather than a second status-filtered fetch. Only
        // looks at the single latest campaign, so a user with an older live campaign
        // plus a newer draft would be shown the draft nudge instead of steady-state --
        // an acceptable simplification since that mix is unlikely this early in a
        // user's lifecycle.
        const nonDraftCampaign = campaings.data.data.find((campaign: Campaign) => campaign.status?.toString().toUpperCase() !== 'DRAFT');
        if(nonDraftCampaign){
          setIsLoading(false);
          await fetchStats();
          return;
        }
        const draftCampaign = campaings.data.data.find((campaign: Campaign) => campaign.status?.toString().toUpperCase() === 'DRAFT');

        setIsNewUser(false);
        setHasDraftCampaign(!nonDraftCampaign);
        setDraftCampaignId(draftCampaign?.id ?? null);

        if (draftCampaign && draftCampaign.id) {
          // The list endpoint above only returns a lean field set (it also backs the
          // paginated campaigns grid, so it deliberately omits audioId/adGroups/
          // timestamps). The checklist and "last edited" copy need the fuller record,
          // so fetch it via the same single-campaign endpoint CampaignWizard already
          // uses to hydrate a draft for editing.
          const [fullRes, cardsRes, audioAdsRes] = await Promise.all([
            campaignApi.getCampaign({ id: draftCampaign.id, advertiserId }),
            walletApi.getCards(),
            // So the "Create your first audio ad" step can still show the audio player
            // (replay/edit) once a draft campaign exists, not just before one does. Also used
            // to check the draft's attached ad still exists: getAds excludes soft-deleted ads,
            // but a draft's audioId keeps pointing at an ad after it's deleted. The limit is
            // generous so the attached ad is almost always in this page for a new user.
            adsApi.getAds({ advertiserId, page: 1, limit: DRAFT_ADS_LOOKUP_LIMIT, isSaved: true, sortBy: 'createdAt', sortOrder: 'desc' }),
          ]);
          if (isStale()) return;
          const fullCampaign = fullRes.status === 200 && !fullRes.error && fullRes.data?.data ? fullRes.data.data : latestCampaign;
          const adsLoaded = audioAdsRes.status === 200 && !audioAdsRes.error;
          const savedAds = adsLoaded ? audioAdsRes.data.data : [];
          const attachedAd = fullCampaign.audioId ? savedAds.find((ad) => ad.id === fullCampaign.audioId) : undefined;
          // Only mark the attached ad as gone when we can be sure: the lookup succeeded and
          // returned the whole list (fewer rows than the limit). Otherwise trust the draft.
          const attachedAdDeleted =
            !!fullCampaign.audioId && adsLoaded && !attachedAd && savedAds.length < DRAFT_ADS_LOOKUP_LIMIT;
          const checklist = getDraftChecklist(fullCampaign);

          setDraftCampaign(fullCampaign);
          setDraftChecklist(attachedAdDeleted ? { ...checklist, audioDone: false } : checklist);
          applyCards(cardsRes);
          // Put the draft's attached ad first so the step-2 player shows the ad this campaign
          // actually uses, falling back to the most recent saved ad.
          setAudioAds(attachedAd ? [attachedAd, ...savedAds.filter((ad) => ad.id !== attachedAd.id)] : savedAds);
        } else {
          setDraftCampaign(null);
          setDraftChecklist(null);
        }

        setIsLoading(false);
        if (nonDraftCampaign) await fetchStats();
        return;
      }

      setHasDraftCampaign(false);
      setDraftCampaignId(null);
      setDraftCampaign(null);
      setDraftChecklist(null);

      const [audioAdsRes, cardsRes] = await Promise.all([
        adsApi.getAds({
          advertiserId,
          page: 1,
          limit: 1,
          isSaved: true,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }),
        walletApi.getCards(),
      ]);
      if (isStale()) return;
      const hasAudioAds =
        audioAdsRes.status === 200 && !audioAdsRes.error && audioAdsRes.data.data.length > 0;
      if (hasAudioAds) {
        setAudioAds(audioAdsRes.data.data);
      }
      applyCards(cardsRes);

      setIsNewUser(true);
      setIsLoading(false);
    } catch (error) {
      // Auth-session failures (ApiAuthError) already trigger a redirect to /login via
      // ProtectedRoute's onAuthStateChange listener, independent of this catch -- this is
      // a backstop against any other unexpected failure mid-load leaving the page stuck
      // on its spinner forever with no way out.
      if (!isStale()) {
        logger.captureException(error, { context: 'DashboardHome load error' });
        toast({ title: t('common.error'), description: 'Unable to load dashboard', variant: 'destructive' });
        setIsLoading(false);
      }
    }
  }, [applyCards, fetchStats, t]);

  useEffect(() => {
    load();
  }, [load]);

  // Back from the add-card flow opened on this page (gateway redirects to /dashboard?card=...,
  // see paymentApi.addCard('dashboard')). Toast once, then drop the param so a refresh doesn't
  // repeat it.
  useEffect(() => {
    const cardResult = searchParams.get('card');
    if (cardResult !== 'added' && cardResult !== 'failed') return;
    toast(
      cardResult === 'added'
        ? { title: 'Card added', description: 'Your debit or credit card has been saved.' }
        : { title: 'Card not added', description: 'Something went wrong adding your card. Please try again.', variant: 'destructive' },
    );
    const next = new URLSearchParams(searchParams);
    next.delete('card');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

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
  const isAgencyOnboarding = isAgency && hasNoAdvertisers;
  // Headline follows the checklist: a draft only reads as "almost live" while an ad exists.
  // A draft outlives the deletion of its ad, and then the next step is creating an ad again.
  const hasAudioAd = audioAds.length > 0;
  const isDraftWithAd = hasDraftCampaign && hasAudioAd;

  return (
    <div className="max-w-[1400px] mx-auto space-y-4">
      {!isNewUser && !hasDraftCampaign && !isAgencyOnboarding && (
        <div>
          <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back. Here&apos;s your overview.</p>
        </div>
      )}

      {/* Agency org with zero advertisers yet */}
      {isAgencyOnboarding && (
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AgencyGettingStartedCard canEdit={role === 'ADMIN'} />
            </div>
            {/* Sidebar is supporting context only; hidden on mobile so the checklist stays the focus. */}
            <div className="hidden md:block lg:col-span-1 space-y-4">
              <ReachStatsSection heading="Your clients' reach on Earo" />
              <AgencyWhatYouCanDoSection />
            </div>
          </div>
        </>
      )}

      {/* Pre-campaign states: brand-new, has-ad, or draft-campaign-in-progress */}
      {!isAgencyOnboarding && (isNewUser || hasDraftCampaign) && (
        <>
          <div className="space-y-1.5 px-1">
            <p className="text-xs font-bold uppercase tracking-wide text-foreground">
              {userName ? `WELCOME, ${userName.toUpperCase()}` : 'WELCOME'}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground leading-tight">
              {isDraftWithAd
                ? "You're almost live."
                : hasAudioAd
                ? "Your ad is ready. Let's get it on air."
                : 'Get your first audio ad live.'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isDraftWithAd
                ? 'Finish setting up your campaign to start reaching listeners.'
                : hasAudioAd
                ? 'One more step to reach listeners across 50K+ podcasts and radio stations.'
                : 'Three steps to reach listeners across 50K+ podcasts and radio stations.'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <GettingStartedCard
                hasAudioAd={hasAudioAd}
                latestAudioAd={audioAds[0]}
                hasPaymentMethod={hasPaymentMethod}
                paymentCardLabel={paymentCardLabel}
                hasDraftCampaign={hasDraftCampaign}
                draftCampaign={draftCampaign}
                draftChecklist={draftChecklist}
                draftCampaignId={draftCampaignId}
                canEdit={canEdit}
                isAdmin={role === 'ADMIN'}
                onPaymentModalClose={() => void load()}
              />
            </div>
            {/* Sidebar is supporting context only; hidden on mobile so the checklist stays the focus. */}
            <div className="hidden md:block lg:col-span-1 space-y-4">
              <ReachStatsSection />
              <WhatYouCanDoSection />
            </div>
          </div>
        </>
      )}

      {/* Steady state */}
      {!isAgencyOnboarding && !isNewUser && !hasDraftCampaign && (
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
