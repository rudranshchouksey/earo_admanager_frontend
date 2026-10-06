import type { SessionFlags } from '@/hooks/useSessionFlags';

// Single source of truth for which Account / Billing sections a user can open.
// Used by the sidebar (DashboardLayout) and the Account page route guard.

export type AccountSection = 'profile' | 'users' | 'advertisers' | 'company';
export type BillingSection = 'payment-method' | 'payments' | 'invoices';

type Flags = Pick<SessionFlags, 'role' | 'isPro' | 'isAgency'>;

export function getAccountSections({ role, isPro, isAgency }: Flags): AccountSection[] {
  const sections: AccountSection[] = ['profile'];
  if (isPro && role === 'ADMIN') sections.push('users');
  if (isAgency && (role === 'ADMIN' || role === 'EDITOR')) sections.push('advertisers');
  if (role === 'ADMIN') sections.push('company');
  return sections;
}

export function getBillingSections({ role }: Flags): BillingSection[] {
  return role === 'ADMIN' ? ['payment-method', 'payments', 'invoices'] : [];
}
