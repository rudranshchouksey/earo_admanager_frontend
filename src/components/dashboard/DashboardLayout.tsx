import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Volume2,
  Megaphone,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Download,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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

const BREADCRUMB_KEYS: Record<string, string> = {
  dashboard: 'layout.nav_dashboard',
  ads: 'layout.nav_ads',
  new: 'layout.breadcrumb_new',
  campaigns: 'layout.nav_campaigns',
  reports: 'layout.nav_reports',
  account: 'layout.nav_account',
};

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
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string>('');
  const { isPro, isAgency } = useSessionFlags();
  const { t } = useTranslation();
  const { language, setLanguage } = useDirection();
  const localeValue = (language || 'en').split('-')[0] === 'ar' ? 'ar' : 'en';
  const [showAgencySignup, setShowAgencySignup] = useState(false);
  const [showAgencySignupBtn, setShowAgencySignupBtn] = useState(false)
  const [session, setSession] = useState<AuthSession | null>(null);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [onboardingCompleted, setOnboardingCompleted] = useState(true);
  const [accountType, setAccountType] = useState<string>('');

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
  const accountItem = { path: '/dashboard/account', label: t('layout.nav_account'), icon: Settings };


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
  }, [t]);

  useEffect(() => {
    if (selectedAdvertiser) {
      console.log("selectedAdvertiser", selectedAdvertiser);
      appNotifications.notify('advertiser:selected', { advertiserId: selectedAdvertiser });
      auth.setCurrentAdvertiserId(selectedAdvertiser, advertisers.find((a) => a.id === selectedAdvertiser)?.isPro ?? false);
      const orgId = advertisers.find((a) => a.id === selectedAdvertiser)?.orgId;
      if (orgId) {
        auth.setCurrentOrganizationId(orgId);
      }
    }
  }, [selectedAdvertiser])



  useEffect(() => {
    const getProfile = async () => {
      const { data, error, status } = await userApi.getUserProfile();
      if(error || status !== 200) return;
      if(data.data?.organizations && data.data.organizations.length > 0) {
        const organization = data.data.organizations[0];
        if(organization.orgType === "SME" && ! organization.requestedForAgency) setShowAgencySignupBtn(true);
        setAccountType(organization.orgType === "SME" ? isPro ? "Pro" : "Express" : "Agency");
      }

      setUserEmail(data.data.email ?? null);
      if(data.data?.onboardingComplete) setOnboardingCompleted(data.data.onboardingComplete);
    }
    getProfile();
  }, [])
  
  useEffect(() => {
    auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
      setSession(session);
      if(session.user.app_metadata.isAgency) {
        // Prefer the stored advertiserId (from last selection) on reload.
        getAdvertisers(session?.currentOrganizationId ?? '', session?.currentAdvertiserId ?? '');
      }
      setSelectedAdvertiser(session?.currentAdvertiserId ?? '');
    });
  }, [getAdvertisers]);

  useEffect(() => {
    return appNotifications.subscribe('advertisers:changed', (payload) => {
      const orgId = payload?.organizationId ?? session?.currentOrganizationId;
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

  const sidebarContent = (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Logo */}
      <div className={`flex items-center h-14 shrink-0 border-b border-sidebar-border ${collapsed ? 'justify-center px-4' : 'px-4'}`}>
        {collapsed ? (
          <img src={logo} alt="EARO" className="h-7 w-auto" />
        ) : (
          <img src={logoFull} alt="EARO" className="h-7" />
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive(item.path)
                ? 'bg-sidebar-accent text-sidebar-foreground'
                : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
            }`}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>


      {/* Footer */}
      <div className="px-3 py-4 border-t border-sidebar-border space-y-1">
        <Link
          to={accountItem.path}
          onClick={() => setSidebarOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            isActive(accountItem.path)
              ? 'bg-sidebar-accent text-sidebar-foreground'
              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
          }`}
        >
          <accountItem.icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{accountItem.label}</span>} 
          {!collapsed && <div className='inline-flex items-center rounded-full border font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent hover:bg-primary/80 text-[10px] px-1.5 py-0 h-4 bg-primary text-primary-foreground'>{accountType}</div>}
        </Link>
        {!collapsed && userEmail && (
          <p className="px-3 text-xs text-sidebar-foreground/50 truncate">{userEmail}</p>
        )}
         {showAgencySignupBtn && !collapsed && (
          <span className="text-sm text-blue-500 text-center px-3 underline cursor-pointer" onClick={() => setShowAgencySignup(true) }>Upgrade to Agency?</span>
        )} 

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 w-full transition-colors"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{t('layout.sign_out')}</span>}
        </button>
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
        {sidebarContent}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-20 -right-3 hidden lg:flex h-6 w-6 items-center justify-center rounded-full bg-sidebar border border-sidebar-border text-sidebar-foreground/50 hover:text-sidebar-foreground"
          style={{ left: collapsed ? 55 : 228 }}
        >
          <ChevronLeft className={`h-3 w-3 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-sidebar">
            {sidebarContent}
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

          {/* Advertiser selector — Pro mode, always visible */}
          {isAgency && (
            <Select value={selectedAdvertiser} onValueChange={(value) => {
              if(value === "add-advertiser") {
                navigate('/dashboard/account?page=advertisers');
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
                <SelectItem value="add-advertiser" className="text-xs cursor-pointer text-foreground underline" onClick={() => navigate('/dashboard/account?page=advertisers')}>
                  Add Advertiser                 
                </SelectItem>
              </SelectContent>
            </Select>
          )}

          {/* Persistent CTAs — hidden on dashboard home for new users, always shown elsewhere */}
          {(location.pathname !== '/dashboard' || !isNewUser) && (
            <div className="flex items-center gap-3">
              <Button size="sm" variant="outline" className="h-9 gap-2" onClick={() => navigate('/dashboard/ads/new')}>
                <Volume2 className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{t('layout.new_ad')}</span>
              </Button>
              <Button size="sm" className="h-9 gap-2" onClick={() => navigate('/dashboard/campaigns/new')}>
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

      {showAgencySignup && (
        <AgencySignup
          open={showAgencySignup}
          onOpenChange={(open) => {
            if (!open) setShowAgencySignup(false);
          }}
          onRequested={onRequested}
        />
      )}
    </div>
  );
}
