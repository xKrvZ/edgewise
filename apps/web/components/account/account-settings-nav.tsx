'use client';

import { ACCOUNT_SECTIONS, type AccountSection } from '@/lib/account-sections';
import { useUserDisplayLabel } from '@/lib/hooks/use-user-display-label';
import { cn } from '@/lib/utils';
import { BookOpen, CreditCard, Settings2, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const SECTION_ICONS: Record<AccountSection, LucideIcon> = {
  profile: User,
  account: Settings2,
  billing: CreditCard,
  'trading-accounts': BookOpen,
};

interface AccountSettingsNavProps {
  activeSection: AccountSection;
  onSectionChange: (section: AccountSection) => void;
  className?: string;
}

export function AccountSettingsNav({
  activeSection,
  onSectionChange,
  className,
}: AccountSettingsNavProps) {
  const { label: displayName } = useUserDisplayLabel();

  return (
    <nav className={cn('space-y-6', className)} aria-label="Account settings">
      <div className="space-y-1.5">
        <p className="text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">
          Welcome back{displayName ? `, ${displayName}` : ''}! 👋
        </p>
        <p className="flex items-center gap-1.5 text-sm text-slate-500">
          <Settings2 className="h-3.5 w-3.5" aria-hidden="true" />
          Manage your account
        </p>
      </div>

      <ul className="hidden space-y-1 lg:block">
        {ACCOUNT_SECTIONS.map(({ id, label }) => {
          const isActive = activeSection === id;
          const Icon = SECTION_ICONS[id];
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onSectionChange(id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

interface AccountSettingsTabsProps {
  activeSection: AccountSection;
  onSectionChange: (section: AccountSection) => void;
  className?: string;
}

export function AccountSettingsTabs({
  activeSection,
  onSectionChange,
  className,
}: AccountSettingsTabsProps) {
  return (
    <div
      className={cn(
        'flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 lg:hidden',
        className,
      )}
      role="tablist"
      aria-label="Account settings sections"
    >
      {ACCOUNT_SECTIONS.map(({ id, label }) => {
        const isActive = activeSection === id;
        const Icon = SECTION_ICONS[id];
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSectionChange(id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
              isActive
                ? 'bg-primary/10 text-primary'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950',
            )}
          >
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
