'use client';

import { AccountSettingsNav, AccountSettingsTabs } from '@/components/account/account-settings-nav';
import {
  marketingContainerClass,
  marketingSectionPaddingCompactClass,
} from '@/components/marketing/marketing-section';
import {
  ACCOUNT_SECTION_SUBTITLES,
  ACCOUNT_SECTION_TITLES,
  type AccountSection,
} from '@/lib/account-sections';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface AccountSettingsLayoutProps {
  activeSection: AccountSection;
  onSectionChange: (section: AccountSection) => void;
  children: ReactNode;
  className?: string;
}

export function AccountSettingsLayout({
  activeSection,
  onSectionChange,
  children,
  className,
}: AccountSettingsLayoutProps) {
  return (
    <div className={cn(marketingContainerClass, marketingSectionPaddingCompactClass, className)}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <aside className="w-full shrink-0 lg:w-[min(280px,25%)] lg:sticky lg:top-24 lg:self-start">
            <AccountSettingsNav
              activeSection={activeSection}
              onSectionChange={onSectionChange}
            />
            <AccountSettingsTabs
              activeSection={activeSection}
              onSectionChange={onSectionChange}
              className="mt-6"
            />
          </aside>

          <div className="min-w-0 flex-1 space-y-8">
            <header className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                {ACCOUNT_SECTION_TITLES[activeSection]}
              </h1>
              {ACCOUNT_SECTION_SUBTITLES[activeSection] ? (
                <p className="max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
                  {ACCOUNT_SECTION_SUBTITLES[activeSection]}
                </p>
              ) : null}
            </header>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
