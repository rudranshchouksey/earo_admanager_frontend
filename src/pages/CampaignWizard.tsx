import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { useGeoLocation } from '@/hooks/useGeoLocation';
import type { LocationData } from '@/components/dashboard/campaign-wizard/CampaignInventoryStep';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { useTranslation } from '@/contexts/TranslationContext';

import CampaignSetupStep from '@/components/dashboard/campaign-wizard/CampaignSetupStep';
import CampaignScheduleStep from '@/components/dashboard/campaign-wizard/CampaignScheduleStep';
import CampaignInventoryStep from '@/components/dashboard/campaign-wizard/CampaignInventoryStep';
import CampaignTargetingStep from '@/components/dashboard/campaign-wizard/CampaignTargetingStep';
import CampaignBudgetStep from '@/components/dashboard/campaign-wizard/CampaignBudgetStep';
import CampaignPaymentStep from '@/components/dashboard/campaign-wizard/CampaignPaymentStep';
import ForecastSidebar from '@/components/dashboard/campaign-wizard/ForecastSidebar';
import CampaignSummary from '@/components/dashboard/campaign-wizard/CampaignSummary';
import AudienceExtensionStep from '@/components/dashboard/campaign-wizard/AudienceExtensionStep';
import type { AudienceExtensionData } from '@/components/dashboard/campaign-wizard/AudienceExtensionStep';
import CampaignLaunchModal from '@/components/dashboard/campaign-wizard/CampaignLaunchModal';

export default function CampaignWizard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isPro } = useSessionFlags();
  const [saving, setSaving] = useState(false);
  const [showLaunchModal, setShowLaunchModal] = useState(false);

  const [setup, setSetup] = useState({ adId: '', campaignName: '' });
  const [schedule, setSchedule] = useState(() => {
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 30);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { startDate: fmt(today), endDate: fmt(end) };
  });
  const { geoData, isLoading: geoLoading } = useGeoLocation();
  const [inventory, setInventory] = useState<LocationData>({ country: '', countryCode: '', mode: 'city', city: '', cities: [], businessLocations: [] });
  const [geoApplied, setGeoApplied] = useState(false);
  const [targeting, setTargeting] = useState({ gender: 'all', ageRanges: ['18-24', '25-34', '35-44', '45-54', '55-65'] as string[], deviceTypes: ['Mobile', 'Desktop'] as string[], inventoryTypes: ['Podcast', 'Streaming', 'Radio'] as string[], podcastTopics: [] as string[] });
  const [budget, setBudget] = useState({ dailyBudget: '', totalBudget: '', currency: 'USD' });
  const [payment, setPayment] = useState({ paymentMethod: 'card', couponCode: '' });
  const [audienceExtension, setAudienceExtension] = useState<AudienceExtensionData>({
    enabled: false,
    banners: [
      { dimension: '300x250', fileName: null, preview: null },
      { dimension: '728x90', fileName: null, preview: null },
      { dimension: '160x600', fileName: null, preview: null },
    ],
    impressionPixel: '',
  });

  // Collapsed state for each section
  const [collapsed, setCollapsed] = useState({ setup: false, schedule: false, inventory: false, targeting: false, budget: false, audienceExtension: false });

  // Completion checks
  const setupDone = !!(setup.adId && setup.campaignName.trim());
  const scheduleDone = !!(schedule.startDate && schedule.endDate);
  const inventoryDone = !!inventory.country;

  // Auto-fill country from geo-detect
  useEffect(() => {
    if (geoData && !geoApplied) {
      setInventory(prev => ({
        ...prev,
        country: geoData.country !== 'your country' ? geoData.country : prev.country,
        countryCode: geoData.countryCode || prev.countryCode,
      }));
      setGeoApplied(true);
    }
  }, [geoData, geoApplied]);
  const targetingDone = true;
  const budgetDone = Number(budget.totalBudget) > 0;

  const canLaunch = setupDone && scheduleDone && inventoryDone && budgetDone;

  const durationDays = schedule.startDate && schedule.endDate
    ? Math.max(1, Math.ceil((new Date(schedule.endDate).getTime() - new Date(schedule.startDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  const showForecast = true;

  // Refs for auto-scroll
  const setupRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const inventoryRef = useRef<HTMLDivElement>(null);
  const targetingRef = useRef<HTMLDivElement>(null);
  const budgetRef = useRef<HTMLDivElement>(null);
  const paymentRef = useRef<HTMLDivElement>(null);

  // Track which sections have been revealed to trigger scroll only once
  const [revealed, setRevealed] = useState({ schedule: false, inventory: false, targeting: false, budget: false, payment: false });

  // Find the scrollable parent
  const scrollToRef = (ref: React.RefObject<HTMLDivElement>) => {
    setTimeout(() => {
      const el = ref.current;
      if (!el) return;
      const scrollParent = el.closest('main') || el.closest('[style*="overflow"]') || window;
      if (scrollParent instanceof HTMLElement) {
        const parentRect = scrollParent.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        scrollParent.scrollTo({
          top: scrollParent.scrollTop + elRect.top - parentRect.top - 16,
          behavior: 'smooth',
        });
      } else {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  // Section order for collapse logic
  type SectionKey = 'setup' | 'schedule' | 'budget' | 'inventory' | 'targeting' | 'audienceExtension' | 'payment';
  const SECTION_ORDER: SectionKey[] = isPro
    ? ['setup', 'schedule', 'budget', 'inventory', 'targeting', 'audienceExtension']
    : ['setup', 'schedule', 'budget', 'inventory', 'targeting', 'payment'];

  // Track the section the user is actively interacting with
  const [activeSection, setActiveSection] = useState<SectionKey>('setup');

  const doneMap: Record<string, boolean> = { setup: setupDone, schedule: scheduleDone, inventory: inventoryDone, targeting: targetingDone, budget: budgetDone, payment: false };

  // When activeSection changes, collapse all prior completed sections and expand the active one
  useEffect(() => {
    const activeIdx = SECTION_ORDER.indexOf(activeSection);
    setCollapsed(prev => {
      const next = { ...prev };
      for (let i = 0; i < activeIdx; i++) {
        const key = SECTION_ORDER[i];
        if (key !== 'payment' && doneMap[key]) {
          next[key as keyof typeof prev] = true;
        }
      }
      // Expand the active section
      if (activeSection !== 'payment' && activeSection in next) {
        next[activeSection as keyof typeof next] = false;
      }
      return next;
    });
  }, [activeSection, setupDone, scheduleDone, inventoryDone, targetingDone, budgetDone]);

  // Reveal sections when prerequisites are met
  useEffect(() => {
    if (setupDone && !revealed.schedule) {
      setRevealed(r => ({ ...r, schedule: true }));
      scrollToRef(scheduleRef);
    }
  }, [setupDone]);

  useEffect(() => {
    if (scheduleDone && setupDone && !revealed.budget) {
      setRevealed(r => ({ ...r, budget: true }));
      scrollToRef(budgetRef);
    }
  }, [scheduleDone, setupDone]);

  useEffect(() => {
    if (budgetDone && scheduleDone && setupDone && !revealed.inventory) {
      setRevealed(r => ({ ...r, inventory: true }));
      scrollToRef(inventoryRef);
    }
  }, [budgetDone, scheduleDone, setupDone]);

  useEffect(() => {
    if (inventoryDone && budgetDone && scheduleDone && setupDone && !revealed.targeting) {
      setRevealed(r => ({ ...r, targeting: true }));
      scrollToRef(targetingRef);
    }
  }, [inventoryDone, budgetDone, scheduleDone, setupDone]);

  useEffect(() => {
    if (targetingDone && inventoryDone && budgetDone && scheduleDone && setupDone && !revealed.payment) {
      setRevealed(r => ({ ...r, payment: true }));
      scrollToRef(paymentRef);
    }
  }, [targetingDone, inventoryDone, budgetDone, scheduleDone, setupDone]);

  const sectionRefs: Record<string, React.RefObject<HTMLDivElement>> = {
    setup: setupRef, schedule: scheduleRef, inventory: inventoryRef, targeting: targetingRef, budget: budgetRef, payment: paymentRef,
  };

  const toggleCollapse = (section: keyof typeof collapsed) => {
    const wasCollapsed = collapsed[section];
    setCollapsed(c => ({ ...c, [section]: !c[section] }));
    // If expanding, smooth-scroll to the section after the animation starts
    if (wasCollapsed) {
      const ref = sectionRefs[section];
      if (ref) {
        setTimeout(() => scrollToRef(ref), 50);
      }
    }
  };

  // Summary text helpers
  const getSummaryText = (section: string): string => {
    switch (section) {
      case 'setup':
        return setup.campaignName || t('wizard.untitled');
      case 'schedule': {
        if (!schedule.startDate || !schedule.endDate) return '';
        const fmt = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${fmt(schedule.startDate)} – ${fmt(schedule.endDate)} (${durationDays} days)`;
      }
      case 'inventory': {
        const parts: string[] = [];
        if (inventory.country) parts.push(inventory.country);
        if (inventory.mode === 'city' && inventory.city) parts.push(inventory.city);
        if (inventory.mode === 'business' && inventory.businessLocations.length > 0) parts.push(t('wizard.locations_count', { count: String(inventory.businessLocations.length) }));
        return parts.join(', ') || t('wizard.not_set');
      }
      case 'targeting': {
        const parts: string[] = [];
        parts.push(targeting.gender === 'all' ? t('wizard.targeting.all') : targeting.gender);
        if (targeting.ageRanges.length > 0) parts.push(targeting.ageRanges.slice(0, 2).join('/') + (targeting.ageRanges.length > 2 ? '+' : ''));
        if (targeting.deviceTypes.length > 0) parts.push(targeting.deviceTypes.join('/'));
        return parts.join(', ');
      }
      case 'budget':
        return budget.dailyBudget && budget.totalBudget
          ? `$${Number(budget.dailyBudget).toLocaleString()}/day, $${Number(budget.totalBudget).toLocaleString()} total`
          : budget.totalBudget ? `$${Number(budget.totalBudget).toLocaleString()} total` : '';
      default:
        return '';
    }
  };

  // Build summary items for sidebar
  const summaryLabels: Record<string, string> = { setup: t('wizard.your_ad'), schedule: t('wizard.schedule'), budget: t('wizard.budget'), inventory: t('wizard.location'), targeting: t('wizard.audience') };
  const summaryItems = (['setup', 'schedule', 'budget', 'inventory', 'targeting'] as const)
    .filter(key => {
      const doneMap: Record<string, boolean> = { setup: setupDone, budget: budgetDone, inventory: inventoryDone, targeting: targetingDone, schedule: scheduleDone };
      return doneMap[key] && collapsed[key];
    })
    .map(key => ({
      key,
      label: summaryLabels[key],
      value: getSummaryText(key),
      icon: CheckCircle2,
    }));

  const saveCampaign = async (status: 'draft' | 'active') => {
    setSaving(true);
    try {
      const { data: { session } } = await api.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const { error } = await api.createCampaign({
        user_id: session.user.id,
        ad_id: setup.adId,
        name: setup.campaignName,
        campaign_type: 'express',
        status,
        start_date: schedule.startDate,
        end_date: schedule.endDate,
        budget: Number(budget.totalBudget),
        currency: budget.currency,
      });

      if (error) throw error;

      if (status === 'active') {
        setShowLaunchModal(true);
      } else {
        toast({ title: t('wizard.draft_saved') });
        navigate('/dashboard/campaigns');
      }
    } catch (err: any) {
      toast({ title: t('common.error'), description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const sectionClasses = (visible: boolean) =>
    `transition-all duration-500 ease-out ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none h-0 overflow-hidden'}`;

  // Render a collapsible section card
  const renderSection = (
    key: keyof typeof collapsed,
    title: string,
    done: boolean,
    visible: boolean,
    ref: React.RefObject<HTMLDivElement> | null,
    children: React.ReactNode,
  ) => {
    const isCollapsed = collapsed[key] && done;
    const Chevron = isCollapsed ? ChevronDown : ChevronUp;

    return (
      <div
        ref={ref}
        className={ref ? sectionClasses(visible) : undefined}
        onClickCapture={() => setActiveSection(key)}
        onFocusCapture={() => setActiveSection(key)}
      >
        <Card className="overflow-hidden">
          {/* Clickable header for collapse/expand */}
          {done ? (
            <div
              className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleCollapse(key)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                <span className="font-semibold text-foreground">{title}</span>
                {isCollapsed && (
                  <span className="text-sm text-muted-foreground truncate ml-2">{getSummaryText(key)}</span>
                )}
              </div>
              <Chevron className="h-4 w-4 text-muted-foreground shrink-0" />
            </div>
          ) : (
            <CardHeader><CardTitle className="text-lg">{title}</CardTitle></CardHeader>
          )}

          {/* Animated content area */}
          <div
            className={cn(
              'transition-all duration-300 ease-in-out overflow-hidden',
              isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[2000px] opacity-100'
            )}
          >
            <CardContent className={done ? 'pt-0' : undefined}>{children}</CardContent>
          </div>
        </Card>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t('wizard.title')}</h1>
        <p className="text-muted-foreground">{t('wizard.subtitle')}</p>
      </div>

      {/* Main content + sidebar */}
      <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
        <div className="space-y-4" onKeyDownCapture={(e) => {
          if (e.key === 'Enter') {
            const target = e.target as HTMLElement;
            const tag = target.tagName.toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') {
              e.preventDefault();
              const container = e.currentTarget;
              const focusables = Array.from(container.querySelectorAll<HTMLElement>('input, select, textarea'));
              const idx = focusables.indexOf(target as HTMLElement);
              if (idx >= 0 && idx < focusables.length - 1) {
                const next = focusables[idx + 1];
                next.focus();
                setTimeout(() => {
                  next.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }, 100);
              }
            }
          }
        }}>
          {/* Your Ad - always visible */}
          {renderSection('setup', t('wizard.your_ad'), setupDone, true, setupRef,
            <CampaignSetupStep data={setup} onChange={setSetup} />
          )}

          {/* Schedule */}
          {renderSection('schedule', t('wizard.schedule'), scheduleDone, setupDone, scheduleRef,
            <CampaignScheduleStep data={schedule} onChange={setSchedule} />
          )}

          {/* Budget */}
          {renderSection('budget', t('wizard.budget'), budgetDone, setupDone && scheduleDone, budgetRef,
            <CampaignBudgetStep data={budget} onChange={setBudget} durationDays={durationDays || 7} inventoryCount={targeting.inventoryTypes.length} />
          )}

          {/* Location */}
          {renderSection('inventory', t('wizard.location'), inventoryDone, setupDone && scheduleDone && budgetDone, inventoryRef,
            <CampaignInventoryStep data={inventory} onChange={setInventory} isLoading={geoLoading && !geoApplied} />
          )}

          {/* Audience */}
          {renderSection('targeting', t('wizard.audience'), targetingDone, setupDone && scheduleDone && budgetDone && inventoryDone, targetingRef,
            <CampaignTargetingStep data={targeting} onChange={setTargeting} multiCountry={(inventory.additionalCountries || []).length > 0} />
          )}

          {/* Audience Extension — Pro only */}
          {isPro && (
            <div className={sectionClasses(setupDone && scheduleDone && budgetDone && inventoryDone && targetingDone)}>
              <Card>
                <CardHeader><CardTitle className="text-lg">{t('wizard.audience_extension')}</CardTitle></CardHeader>
                <CardContent>
                  <AudienceExtensionStep
                    data={audienceExtension}
                    onChange={setAudienceExtension}
                    dailyBudget={Number(budget.dailyBudget) || 0}
                  />
                </CardContent>
              </Card>
            </div>
          )}

          {/* Launch - not collapsible, Express only (Pro is postpaid) */}
          {!isPro && (
            <div ref={paymentRef} className={sectionClasses(setupDone && scheduleDone && budgetDone && inventoryDone && targetingDone)} onClickCapture={() => setActiveSection('payment')} onFocusCapture={() => setActiveSection('payment')}>
              <Card>
                <CardHeader><CardTitle className="text-lg">{t('wizard.launch')}</CardTitle></CardHeader>
                <CardContent><CampaignPaymentStep data={payment} onChange={setPayment} /></CardContent>
              </Card>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between border-t border-border pt-4">
            <Button variant="outline" onClick={() => navigate('/dashboard/campaigns')} disabled={saving}>
              {t('wizard.cancel')}
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => saveCampaign('draft')} disabled={saving || !setupDone}>
                {t('wizard.save_draft')}
              </Button>
              <Button onClick={() => saveCampaign('active')} disabled={saving || !canLaunch}>
                {saving ? t('wizard.launching') : isPro ? t('wizard.launch_campaign') : t('wizard.pay_launch')}
              </Button>
            </div>
          </div>
        </div>

        {/* Forecast + Summary sidebar */}
        <div className="hidden lg:block">
          <div className="sticky top-4 space-y-4" style={{ zIndex: 10 }}>
            <CampaignSummary items={summaryItems} />
            {showForecast ? (
              <ForecastSidebar
                totalBudget={Number(budget.totalBudget) || 0}
                dailyBudget={Number(budget.dailyBudget) || 0}
                inventoryTypes={targeting.inventoryTypes}
                durationDays={durationDays}
                ageRangeCount={targeting.ageRanges.length}
                deviceTypeCount={targeting.deviceTypes.length}
                hasLocation={!!inventory.country}
              />
            ) : (
              <Card className="p-4">
                <p className="text-sm text-muted-foreground text-center">{t('wizard.select_inventory_forecast')}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
      <CampaignLaunchModal open={showLaunchModal} onDone={() => navigate('/dashboard/campaigns')} />
    </div>
  );
}
