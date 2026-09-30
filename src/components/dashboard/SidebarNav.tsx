import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, type LucideIcon } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface SidebarLinkItem {
  path: string;
  label: string;
  icon: LucideIcon;
  /** Opens in a new tab (e.g. the external help center). */
  external?: boolean;
}

export interface SidebarGroupItem {
  id: string;
  label: string;
  icon: LucideIcon;
  children: SidebarLinkItem[];
  /** Rendered after the label when the sidebar is expanded (e.g. plan label). */
  badge?: ReactNode;
}

function itemClass(active: boolean, collapsed: boolean, nested = false) {
  return cn(
    'flex w-full items-center gap-3 rounded-lg px-3 text-sm transition-colors',
    nested ? 'py-2' : 'py-2.5 font-medium',
    collapsed && 'justify-center',
    active
      ? 'bg-sidebar-accent text-sidebar-foreground'
      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
  );
}

/**
 * Label tooltip for the collapsed icon rail (same component as the open/close sidebar
 * toggle). Renders children untouched when the sidebar is expanded and labels are visible.
 * side="right" flips automatically to the left in RTL, where the rail sits on the right edge.
 */
export function SidebarTooltip({ label, enabled, children }: { label: string; enabled: boolean; children: ReactNode }) {
  if (!enabled) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

interface SidebarNavLinkProps {
  item: SidebarLinkItem;
  active: boolean;
  collapsed: boolean;
  nested?: boolean;
  onNavigate: () => void;
}

export function SidebarNavLink({ item, active, collapsed, nested, onNavigate }: SidebarNavLinkProps) {
  const Icon = item.icon;
  const content = (
    <>
      <Icon className={cn('shrink-0', nested ? 'h-4 w-4' : 'h-5 w-5')} />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </>
  );

  if (item.external) {
    return (
      <SidebarTooltip label={item.label} enabled={collapsed}>
        <a
          href={item.path}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={collapsed ? item.label : undefined}
          onClick={onNavigate}
          className={itemClass(false, collapsed, nested)}
        >
          {content}
        </a>
      </SidebarTooltip>
    );
  }

  return (
    <SidebarTooltip label={item.label} enabled={collapsed}>
      <Link
        to={item.path}
        aria-label={collapsed ? item.label : undefined}
        aria-current={active ? 'page' : undefined}
        onClick={onNavigate}
        className={itemClass(active, collapsed, nested)}
      >
        {content}
      </Link>
    </SidebarTooltip>
  );
}

interface SidebarNavGroupProps {
  group: SidebarGroupItem;
  collapsed: boolean;
  isActive: (path: string) => boolean;
  onNavigate: () => void;
  /** Controlled by the parent so only one group is open at a time. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SidebarNavGroup({ group, collapsed, isActive, onNavigate, open, onOpenChange }: SidebarNavGroupProps) {
  const childActive = group.children.some((child) => !child.external && isActive(child.path));

  if (group.children.length === 0) return null;

  // Icon rail: the group icon links to its first in-app section (never an external
  // link like the help center, which would navigate the dashboard tab away).
  if (collapsed) {
    const Icon = group.icon;
    const first = group.children.find((child) => !child.external) ?? group.children[0];
    if (first.external) return null;
    return (
      <SidebarTooltip label={group.label} enabled>
        <Link
          to={first.path}
          aria-label={group.label}
          onClick={onNavigate}
          className={itemClass(childActive, true)}
        >
          <Icon className="h-5 w-5 shrink-0" />
        </Link>
      </SidebarTooltip>
    );
  }

  const Icon = group.icon;
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger className={itemClass(childActive && !open, false)}>
        <Icon className="h-5 w-5 shrink-0" />
        <span className={cn('truncate text-start', childActive && 'text-sidebar-foreground')}>{group.label}</span>
        {group.badge}
        <ChevronDown
          className={cn(
            'ms-auto h-4 w-4 shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ms-5 mt-1 space-y-1 border-s border-sidebar-border ps-3">
          {group.children.map((child) => (
            <SidebarNavLink
              key={child.path}
              item={child}
              active={!child.external && isActive(child.path)}
              collapsed={false}
              nested
              onNavigate={onNavigate}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
