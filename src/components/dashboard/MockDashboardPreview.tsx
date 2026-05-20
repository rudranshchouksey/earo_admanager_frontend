import {
  LayoutDashboard,
  Volume2,
  Megaphone,
  BarChart3,
  Settings,
  Eye,
  DollarSign,
  MousePointerClick,
  Target,
  Clock,
  Play,
  CalendarCheck,
  FileEdit,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import StatCard from '@/components/dashboard/StatCard';
import logoFull from '@/assets/logo-full.png';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, active: true },
  { label: 'Ads', icon: Volume2, active: false },
  { label: 'Campaigns', icon: Megaphone, active: false },
  { label: 'Reports', icon: BarChart3, active: false },
];

const MOCK_STATS = [
  { label: 'Total Impressions', value: '1,284,500', icon: Eye, trend: 'Active' },
  { label: 'Total Spent', value: '$12,430', icon: DollarSign, trend: 'Active' },
  { label: 'Total Reach', value: '892,100', icon: MousePointerClick, trend: 'Active' },
  { label: 'CPA', value: '$0.14', icon: Target, trend: 'Active' },
];

const MOCK_CAMPAIGNS = [
  { name: 'Summer Podcast Push', status: 'Active', dates: 'Jun 1 — Jun 30', budget: '$5,000', spend: '$3,240', impressions: '420K', ltr: '2.4%' },
  { name: 'Brand Awareness Q2', status: 'Scheduled', dates: 'Jul 5 — Aug 5', budget: '$8,000', spend: '$0', impressions: '—', ltr: '—' },
  { name: 'Streaming Launch', status: 'Paused', dates: 'May 10 — May 28', budget: '$2,500', spend: '$2,100', impressions: '180K', ltr: '1.8%' },
  { name: 'Holiday Retarget', status: 'Draft', dates: 'Dec 1 — Dec 31', budget: '$4,000', spend: '—', impressions: '—', ltr: '—' },
];

const TAB_LABELS = [
  { label: 'All', count: 12, icon: null },
  { label: 'Almost Ending', count: 2, icon: Clock },
  { label: 'Starting Soon', count: 3, icon: Play },
  { label: 'Ended Last 10 Days', count: 1, icon: CalendarCheck },
  { label: 'Drafts', count: 4, icon: FileEdit },
];

const statusColors: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  active: 'bg-green-100 text-green-800',
  scheduled: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
};

interface MockDashboardPreviewProps {
  className?: string;
}

/**
 * Static, non-interactive dashboard shell for auth/marketing backgrounds.
 * No API calls, routing, or auth — safe to render on the login page.
 */
export default function MockDashboardPreview({ className }: MockDashboardPreviewProps) {
  return (
    <div
      className={cn(
        'flex min-h-screen w-full bg-background pointer-events-none select-none',
        className,
      )}
      aria-hidden
    >
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-sidebar border-r border-sidebar-border shrink-0">
        <div className="flex items-center h-14 px-4 border-b border-sidebar-border">
          <img src={logoFull} alt="" className="h-7 opacity-90" />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                item.active
                  ? 'bg-sidebar-accent text-sidebar-foreground'
                  : 'text-sidebar-foreground/70',
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </div>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70">
            <Settings className="h-5 w-5 shrink-0" />
            <span>Account</span>
            <span className="ml-auto text-[10px] px-1.5 py-0 h-4 rounded-full bg-primary text-primary-foreground font-semibold">
              Pro
            </span>
          </div>
          <p className="px-3 mt-2 text-xs text-sidebar-foreground/50 truncate">demo@earo.io</p>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-border flex items-center px-4 lg:px-6 bg-background shrink-0 gap-3">
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="h-9 gap-2 pointer-events-none" tabIndex={-1}>
            <Volume2 className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">New Ad</span>
          </Button>
          <Button size="sm" className="h-9 gap-2 pointer-events-none" tabIndex={-1}>
            <Megaphone className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">New Campaign</span>
          </Button>
        </header>

        <main className="flex-1 overflow-hidden p-4 lg:p-6">
          <div className="max-w-[1400px] mx-auto space-y-4">
            <div>
              <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Welcome back. Here&apos;s your overview.</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-foreground mb-2">This Month</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {MOCK_STATS.map((stat) => (
                  <StatCard key={stat.label} {...stat} />
                ))}
              </div>
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Campaign Actions</CardTitle>
              </CardHeader>
              <div className="px-4 pb-3">
                <div className="inline-flex items-center gap-1 rounded-full bg-muted p-1">
                  {TAB_LABELS.map((tab, i) => (
                    <div
                      key={tab.label}
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap',
                        i === 0 ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground',
                      )}
                    >
                      {tab.icon && <tab.icon className="size-3.5" />}
                      {tab.label} ({tab.count})
                    </div>
                  ))}
                </div>
              </div>
              <CardContent className="p-0 pt-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="text-left font-medium text-muted-foreground px-4 py-2.5">Campaign</th>
                        <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Status</th>
                        <th className="text-left font-medium text-muted-foreground px-3 py-2.5">Dates</th>
                        <th className="text-right font-medium text-muted-foreground px-3 py-2.5">Budget</th>
                        <th className="text-right font-medium text-muted-foreground px-3 py-2.5 hidden md:table-cell">Spend</th>
                        <th className="text-right font-medium text-muted-foreground px-3 py-2.5 hidden lg:table-cell">Impressions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_CAMPAIGNS.map((row) => (
                        <tr key={row.name} className="border-b border-border/50">
                          <td className="px-4 py-2 font-medium text-foreground">{row.name}</td>
                          <td className="px-3 py-2">
                            <Badge
                              variant="secondary"
                              className={statusColors[row.status.toLowerCase()] || ''}
                            >
                              {row.status}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-xs text-muted-foreground">{row.dates}</td>
                          <td className="px-3 py-2 text-right text-foreground">{row.budget}</td>
                          <td className="px-3 py-2 text-right text-foreground hidden md:table-cell">{row.spend}</td>
                          <td className="px-3 py-2 text-right text-foreground hidden lg:table-cell">{row.impressions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}

/** Full-screen mock dashboard with centered slot for auth modal content */
export function AuthPageBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <MockDashboardPreview className="min-h-[105vh] w-[102%] -translate-x-[1%] -translate-y-[1%]" />
      </div>
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-[4px]"
        aria-hidden
      />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-dialog-title"
          className="w-full max-w-md rounded-2xl border border-border/80 bg-card shadow-2xl p-6 sm:p-8 max-h-[min(92vh,820px)] overflow-y-auto"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
