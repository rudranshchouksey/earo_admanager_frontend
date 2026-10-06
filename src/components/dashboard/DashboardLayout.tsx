import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Volume2,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  PanelLeft,
  ChevronRight,
  Mail,
  CircleHelp,
  ChevronDown,
  BookOpen,
  CreditCard,
  Wallet,
  Receipt,
  FileText,
  User,
  Users,
  Building2,
  Briefcase,
  PhoneCall,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { auth, AuthSession } from '@/services/auth';
import { useSessionFlags } from '@/hooks/useSessionFlags';
import { useTranslation } from '@/contexts/TranslationContext';
import AlertBar from '@/components/dashboard/AlertBar';
import { useDirection } from '@/contexts/DirectionContext';
import { AgencySignup, OnboardingRole } from './AgencySignup';
import { organizationApi } from '@/services/organization';
import { toast } from '@/hooks/use-toast';
import { Advertiser, advertiserApi } from '@/services/advertiser';
import { appNotifications } from '@/services/appNotifications';
import { cn } from '@/lib/utils';

import logoFull from '@/assets/logo-full.png';
import logo from '@/assets/logo.png';
import { userApi } from '@/services/user';
import UpgradePlanModal from './UpgradePlanModal';
import ScheduleCallDialog from './ScheduleCallDialog';
import { SidebarNavGroup, SidebarNavLink, SidebarTooltip, type SidebarGroupItem, type SidebarLinkItem } from './SidebarNav';
import { getAccountSections, getBillingSections, type AccountSection, type BillingSection } from '@/lib/accountSections';
import { logger } from "@/lib/logger";

const BREADCRUMB_KEYS: Record<string, string> = {
  dashboard: 'layout.nav_dashboard',
  ads: 'layout.nav_ads',
  new: 'layout.breadcrumb_new',
  campaigns: 'layout.nav_campaigns',
  reports: 'layout.nav_reports',
  account: 'layout.nav_account',
  billing: 'layout.nav_billing',
  'payment-method': 'layout.nav_payment_method',
  payments: 'layout.nav_payments',
  invoices: 'layout.nav_invoices',
  profile: 'layout.nav_profile',
  users: 'layout.nav_users',
  advertisers: 'layout.nav_advertisers',
  company: 'layout.nav_company',
  support: 'layout.nav_contact',
};

type Organization = {
  orgId: string;
  name: string;
  role: string;
  orgType: string;
}

function getBreadcrumbs(pathname: string, t: (key: string) => string) {
  const parts = pathname.replace(/^\//, '').split('/').filter(Boolean);
  const crumbs: { label: string; path: string }[] = [];
  let path = '';
  for (const part of parts) {
    path += `/${part}`;
    const key = BREADCRUMB_KEYS[part];
    const label = key ? t(key) : part;
    crumbs.push({ label, path });
  }
  return crumbs;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string>('');
  const { isPro, isAgency, role, isSuperAdmin } = useSessionFlags();
  const { t } = useTranslation();
  const { language, setLanguage } = useDirection();
  const localeValue = (language || 'en').split('-')[0] === 'ar' ? 'ar' : 'en';
  const [showAgencySignup, setShowAgencySignup] = useState(false);
  const [showAgencySignupBtn, setShowAgencySignupBtn] = useState(false)
  const [session, setSession] = useState<AuthSession | null>(null);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [accountType, setAccountType] = useState<"Pro" | "Express" | "Agency">('Express');
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');
  const [organizationSearchOpen, setOrganizationSearchOpen] = useState(false);
  const [organizationSearch, setOrganizationSearch] = useState('');
  const [requestedForAgency, setRequestedForAgency] = useState(false);
  const [scheduleCallOpen, setScheduleCallOpen] = useState(false);
  const [openFooterGroupId, setOpenFooterGroupId] = useState<string | null>(null);

  const onSelectRole = async (role: OnboardingRole) => {
    setShowAgencySignup(false);
    const { error, status, message } = await organizationApi.updateOrganizationType(session?.user?.id, role);
    if (error || status !== 200) {
      toast({
        title: t("common.error"),
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } else {
      auth.userUpgradedToAgency();
      toast({
        title: t("common.success"),
        description: "Upgraded to agency successfully",
        variant: "default",
      });
    }
  };

  const isNewUser = false;

  const navItems = [
    { path: '/dashboard', label: t('layout.nav_dashboard'), icon: LayoutDashboard },
    { path: '/dashboard/ads', label: t('layout.nav_ads'), icon: Volume2 },
    { path: '/dashboard/campaigns', label: t('layout.nav_campaigns'), icon: Megaphone },
    { path: '/dashboard/reports', label: t('layout.nav_reports'), icon: BarChart3 },
  ];

  const billingLinks: Record<BillingSection, SidebarLinkItem> = {
    'payment-method': { path: '/dashboard/billing/payment-method', label: t('layout.nav_payment_method'), icon: CreditCard },
    payments: { path: '/dashboard/billing/payments', label: t('layout.nav_payments'), icon: Receipt },
    invoices: { path: '/dashboard/billing/invoices', label: t('layout.nav_invoices'), icon: FileText },
  };
  const billingGroup: SidebarGroupItem = {
    id: 'billing',
    label: t('layout.nav_billing'),
    icon: Wallet,
    children: getBillingSections({ role, isPro, isAgency }).map((section) => billingLinks[section]),
  };

  const supportGroup: SidebarGroupItem = {
    id: 'support',
    label: t('layout.nav_support'),
    icon: CircleHelp,
    children: [
      { path: 'https://help.earo.ai', label: t('layout.nav_help_center'), icon: BookOpen, external: true },
      { path: '/dashboard/support', label: t('layout.nav_contact'), icon: Mail },
    ],
  };


  const getAdvertisers = useCallback(async (organizationId: string, preferredAdvertiserId?: string) => {
    if (!organizationId) return;
    const { data, error, status } = await advertiserApi.getAdvertisers(organizationId);
    if (error || status !== 200) {
      toast({
        title: t("common.error"),
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    } else {
      const list = data.data ?? [];
      setAdvertisers(list);
      setSelectedAdvertiser((prev) => {
        const desired = preferredAdvertiserId || prev;
        if (desired && list.some((a) => a.id === desired)) return desired;
        return list[0]?.id ?? '';
      });
    }
  }, [t, selectedOrganization]);

  useEffect(() => {
    if (selectedAdvertiser) {
      if(advertisers.length === 0){
       
        advertiserApi.getAdvertisers(session?.currentOrganizationId ?? '').then(res => {
          if(res.status === 200 && res.data.data.length > 0){
            setAdvertisers(res.data.data);
            const currentAdvertiser = res.data.data.find((a) => a.id === selectedAdvertiser);
            if(currentAdvertiser){
              auth.setCurrentAdvertiserId(currentAdvertiser?.id ?? '', currentAdvertiser?.isPro ?? false);
              const orgId = currentAdvertiser?.orgId;
              if (orgId) {
                auth.setCurrentOrganizationId(orgId);
              }
            }
            else{
              // auth.setCurrentAdvertiserId('', false);
              // const orgId = res.data.data[0]?.orgId;
              // if (orgId) {
              //   auth.setCurrentOrganizationId(orgId);
              // }
            }
          }
        }).catch(err => logger.captureException(err, { context: "getAdvertisers in DashboardLayout" }));
      }
      else{
        auth.setCurrentAdvertiserId(selectedAdvertiser, advertisers.find((a) => a.id === selectedAdvertiser)?.isPro ?? false);
        const orgId = advertisers.find((a) => a.id === selectedAdvertiser)?.orgId;
        if (orgId) {
          auth.setCurrentOrganizationId(orgId);
        }
      }

      setTimeout(() => {
        appNotifications.notify('advertiser:selected', { advertiserId: selectedAdvertiser });
      }, 100);
    }
  }, [selectedAdvertiser])

  useEffect(() => {
    
    if(selectedOrganization && organizations.length > 1){
      auth.setCurrentOrganizationId(selectedOrganization);
    }
  
  }, [selectedOrganization])

  const sortedOrganizations = useMemo(
    () => [...organizations].sort((a, b) => a.name.localeCompare(b.name)),
    [organizations],
  );

  const filteredOrganizations = useMemo(() => {
    const query = organizationSearch.trim().toLowerCase();
    if (!query) return sortedOrganizations;
    return sortedOrganizations.filter((org) => org.name.toLowerCase().includes(query));
  }, [sortedOrganizations, organizationSearch]);

  const selectedOrganizationName =
    sortedOrganizations.find((org) => org.orgId === selectedOrganization)?.name || 'Organization';

  const handleOrganizationChange = (orgId: string) => {
    setSelectedOrganization(orgId);
    setOrganizationSearchOpen(false);
    setOrganizationSearch('');
    setTimeout(() => {
      window.location.reload();
    }, 200);
  };



  useEffect(() => {
    const getProfile = async () => {
      const { data, error, status } = await userApi.getUserProfile();
      if(error || status !== 200) return;
      if(data.data?.organizations && data.data.organizations.length > 0) {
        const organization = data.data.organizations[0];
        if(organization.orgType === "SME" && !isPro) setShowAgencySignupBtn(true);
        if(organization.orgType === "SME" && organization.requestedForAgency) setRequestedForAgency(true);
        const proFlagFromAdvertisers = organization.orgType === "SME" ? advertisers.some((a) => a.isPro) : true;
        setAccountType(organization.orgType === "SME" ? (isPro || proFlagFromAdvertisers) ? "Pro" : "Express" : "Agency");
        setOrganizations(data.data.organizations);
      }

      if(data.data?.onboardingComplete) setOnboardingCompleted(data.data.onboardingComplete);
    }
    getProfile();
  }, [session?.currentOrganizationId, isPro, advertisers])
  
  useEffect(() => {
    auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if(session.user.app_metadata.isAgency || session.user.app_metadata.isSuperAdmin) {
        // Prefer the stored advertiserId (from last selection) on reload.
        getAdvertisers(session?.currentOrganizationId ?? '', session?.currentAdvertiserId ?? '');
      }
      setSelectedAdvertiser(session?.currentAdvertiserId ?? '');
      setSelectedOrganization(session?.currentOrganizationId ?? '');
    });
  }, [getAdvertisers, selectedOrganization]);

  useEffect(() => {
    return appNotifications.subscribe('advertisers:changed', (payload) => {      const orgId = payload?.organizationId ?? session?.currentOrganizationId;
      if (!orgId || !session?.user?.app_metadata?.isAgency) return;
      void getAdvertisers(orgId);
    });
  }, [getAdvertisers, session?.currentOrganizationId, session?.user?.app_metadata?.isAgency]);

  const handleSignOut = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const changeLocale = (locale: string) => {
    setLanguage(locale);
  };

  const onRequested = async (hasRequested: boolean) => {
    setShowAgencySignupBtn(false);
    setShowAgencySignup(false);
  }

  const navigateToCampaignNew = () => {
    // navigate('/dashboard/campaigns/new');
    window.location.href = '/dashboard/campaigns/new';
  }

  const closeMobileSidebar = () => setSidebarOpen(false);

  const accountLinks: Record<AccountSection, SidebarLinkItem> = {
    profile: { path: '/dashboard/account/profile', label: t('layout.nav_profile'), icon: User },
    users: { path: '/dashboard/account/users', label: t('layout.nav_users'), icon: Users },
    advertisers: { path: '/dashboard/account/advertisers', label: t('layout.nav_advertisers'), icon: Briefcase },
    company: { path: '/dashboard/account/company', label: t('layout.nav_company'), icon: Building2 },
  };
  const accountGroup: SidebarGroupItem = {
    id: 'account',
    label: t('layout.nav_account'),
    icon: Settings,
    badge: (
      <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-foreground px-2 text-[10px] font-semibold text-background">
        {accountType}
      </span>
    ),
    children: getAccountSections({ role, isPro, isAgency }).map((section) => accountLinks[section]),
  };

  // Footer groups open one at a time: they grow upward from the bottom edge, so
  // stacking several would push the headings (and the clicked target) around.
  const footerGroups = [accountGroup, billingGroup, supportGroup];
  const activeFooterGroupId =
    footerGroups.find((group) => group.children.some((child) => !child.external && isActive(child.path)))?.id ?? null;

  // Auto-expand the group navigation lands in (deep link, breadcrumb, in-page link).
  useEffect(() => {
    if (activeFooterGroupId) setOpenFooterGroupId(activeFooterGroupId);
  }, [activeFooterGroupId]);

  const renderFooterGroup = (group: SidebarGroupItem, collapsed: boolean) => (
    <SidebarNavGroup
      key={group.id}
      group={group}
      collapsed={collapsed}
      isActive={isActive}
      onNavigate={closeMobileSidebar}
      open={openFooterGroupId === group.id}
      onOpenChange={(open) => setOpenFooterGroupId(open ? group.id : null)}
    />
  );

  // The mobile drawer always renders expanded, whatever the desktop rail state is,
  // and has no open/close toggle (the overlay and navigation close it).
  const renderSidebar = (collapsed: boolean, showToggle: boolean) => (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Logo + open/close toggle */}
      <div className={cn('flex items-center h-14 shrink-0 px-4', collapsed ? 'justify-center' : 'justify-between')}>
        {collapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => setCollapsed(false)}
                aria-label={t('layout.open_sidebar')}
                className="group flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                {/* Square logo by default; swaps to the panel icon on hover/focus. */}
                <img src={logo} alt="EARO" className="h-7 w-auto group-hover:hidden group-focus-visible:hidden" />
                <PanelLeft className="hidden h-5 w-5 group-hover:block group-focus-visible:block" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('layout.open_sidebar')}</TooltipContent>
          </Tooltip>
        ) : (
          <>
            <img src={logoFull} alt="EARO" className="h-7" />
            {showToggle && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setCollapsed(true)}
                    aria-label={t('layout.close_sidebar')}
                    className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <PanelLeft className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t('layout.close_sidebar')}</TooltipContent>
              </Tooltip>
            )}
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <SidebarNavLink
            key={item.path}
            item={item}
            active={isActive(item.path)}
            collapsed={collapsed}
            onNavigate={closeMobileSidebar}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 space-y-1">
        {/* Sits directly above the Account group. */}
        <div className="pb-2">
          <SidebarTooltip label={t('layout.schedule_call')} enabled={collapsed}>
            <Button
              variant="outline"
              size="sm"
              aria-label={collapsed ? t('layout.schedule_call') : undefined}
              className={cn('w-full gap-2', collapsed ? 'h-9 px-0' : 'h-auto justify-start whitespace-normal py-2')}
              onClick={() => {
                closeMobileSidebar();
                setScheduleCallOpen(true);
              }}
            >
              <PhoneCall className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="flex flex-col items-start text-start">
                  <span>{t('layout.schedule_call')}</span>
                  <span className="text-xs font-normal text-muted-foreground">{t('layout.schedule_call_subtitle')}</span>
                </span>
              )}
            </Button>
          </SidebarTooltip>
        </div>
        {footerGroups.map((group) => renderFooterGroup(group, collapsed))}
        {showAgencySignupBtn && !collapsed && (accountType === "Express" || (accountType === "Pro" && !requestedForAgency)) && (
          <div className="my-2 mx-1 rounded-lg border border-sidebar-border bg-background p-3">
            <Button
              size="sm"
              className="h-7 w-full text-[11px] font-semibold"
              onClick={() => setShowAgencySignup(true)}
            >
              Upgrade
            </Button>
          </div>
        )}


        <SidebarTooltip label={t('layout.sign_out')} enabled={collapsed}>
          <button
            onClick={handleSignOut}
            aria-label={collapsed ? t('layout.sign_out') : undefined}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors',
              collapsed && 'justify-center',
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{t('layout.sign_out')}</span>}
          </button>
        </SidebarTooltip>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border shrink-0 transition-all duration-200 h-screen sticky top-0 ${
          collapsed ? 'w-[68px]' : 'w-60'
        }`}
      >
        {renderSidebar(collapsed, true)}
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute start-0 top-0 bottom-0 w-60 bg-sidebar">
            {renderSidebar(false, false)}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border flex items-center px-4 lg:px-6 bg-background shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-2"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Breadcrumbs — hidden on dashboard home */}
          {location.pathname !== '/dashboard' && (
            <nav className="hidden sm:flex items-center gap-1 text-sm min-w-0">
              {getBreadcrumbs(location.pathname, t).map((crumb, i, arr) => (
                <span key={crumb.path} className="flex items-center gap-1 min-w-0">
                  {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                  {i < arr.length - 1 ? (
                    <Link to={crumb.path} className="text-muted-foreground hover:text-foreground transition-colors truncate">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span className="font-medium text-foreground truncate">{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          <div className="flex-1" />
          <div className="flex items-center gap-3">

            {
              organizations?.length > 1 && (
                <Popover
                  open={organizationSearchOpen}
                  onOpenChange={(open) => {
                    setOrganizationSearchOpen(open);
                    if (!open) setOrganizationSearch('');
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-9 w-[180px] justify-between gap-2 px-3 text-xs font-normal border-border"
                    >
                      <span className="truncate">{selectedOrganizationName}</span>
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-[220px] p-0">
                    <div className="border-b border-border p-2">
                      <Input
                        value={organizationSearch}
                        onChange={(e) => setOrganizationSearch(e.target.value)}
                        placeholder="Search organizations..."
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="max-h-[240px] overflow-y-auto p-1">
                      {filteredOrganizations.length === 0 ? (
                        <p className="px-2 py-3 text-xs text-muted-foreground text-center">
                          No organizations found
                        </p>
                      ) : (
                        filteredOrganizations.map((org) => (
                          <button
                            key={org.orgId}
                            type="button"
                            onClick={() => handleOrganizationChange(org.orgId)}
                            className={cn(
                              'w-full rounded-sm px-2 py-1.5 text-left text-xs transition-colors hover:bg-accent hover:text-accent-foreground',
                              org.orgId === selectedOrganization && 'bg-accent text-accent-foreground font-medium',
                            )}
                          >
                            {org.name}
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              )
            }
            

          {/* Advertiser selector — Pro mode, always visible */}
          {(isAgency || organizations?.length > 1 || isSuperAdmin) && (
            <Select value={selectedAdvertiser} onValueChange={(value) => {
              if(value === "add-advertiser") {
                navigate('/dashboard/account/advertisers');
              } else {
                setSelectedAdvertiser(value);
              }
            }}>
              <SelectTrigger className="h-9 w-[180px] text-xs border-border">
                <SelectValue placeholder={t('layout.choose_advertiser')} />
              </SelectTrigger>
              <SelectContent>
                {advertisers.map((adv) => (
                  <SelectItem key={adv.id} value={adv.id} className="text-xs">
                    {adv.advertiserName}
                  </SelectItem>
                ))}
                {
                  (role === "ADMIN" || role === "EDITOR" || role === "EDITOR_RESTRICTED") && (
                    <SelectItem value="add-advertiser" className="text-xs cursor-pointer text-foreground underline" onClick={() => navigate('/dashboard/account/advertisers')}>
                      Add Advertiser                 
                    </SelectItem>  
                  )
                }
              </SelectContent>
            </Select>
          )}

          {/* Persistent CTAs — hidden on dashboard home for new users, always shown elsewhere */}
          {(location.pathname !== '/dashboard' || !isNewUser) && (isSuperAdmin || role === "ADMIN" || role === "EDITOR" || role === "EDITOR_RESTRICTED") && (
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" className="h-9 gap-2" onClick={() => window.location.href = '/dashboard/ads/new'}>
                <Volume2 className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{t('layout.new_ad')}</span>
              </Button>
              {/* Always available: with no ads yet, the wizard's ad picker links to ad creation (CampaignSetupStep). */}
              <Button size="sm" className="h-9 gap-2" onClick={navigateToCampaignNew}>
                <Megaphone className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{t('layout.new_campaign')}</span>
              </Button>
            </div>
          )}
          {/* TODO: Add locale selector */}
            {/* <Select value={localeValue} onValueChange={changeLocale}>
              <SelectTrigger className="h-9 w-[180px] text-xs border-border gap-2">
                <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                <SelectValue placeholder={t('layout.choose_locale')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">{t('layout.language_en')}</SelectItem>
                <SelectItem value="ar">{t('layout.language_ar')}</SelectItem>
              </SelectContent>
            </Select> */}
          </div>
        </header>

        <AlertBar />

        {/* Page content */}
        <main className={cn(
          "flex-1 overflow-auto p-4 lg:p-6",
          (location.pathname === '/dashboard/campaigns/new' || location.pathname === '/dashboard/ads/new') && 'bg-[hsl(240,5%,96%)]'
        )}>
          {children}
        </main>
      </div>

      {/* {showAgencySignup && (
        <AgencySignup
          open={showAgencySignup}
          onOpenChange={(open) => {
            if (!open) setShowAgencySignup(false);
          }}
          onRequested={onRequested}
        />
      )} */}


      {showAgencySignup && (
        <UpgradePlanModal
          open={showAgencySignup}
          onOpenChange={(open) => {
            if (!open) setShowAgencySignup(false);
          }}
          currentPlan={accountType}
          requestedForAgency={requestedForAgency}
        />
      )}

      <ScheduleCallDialog open={scheduleCallOpen} onOpenChange={setScheduleCallOpen} />
    </div>
  );
}
