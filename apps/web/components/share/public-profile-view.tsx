'use client';

import { EquityCurveChart } from '@/components/charts/equity-curve-chart';
import { marketingCardClass } from '@/components/marketing/marketing-section';
import { PublicShareProfileHeader } from '@/components/share/public-share-profile-header';
import { PublicShowcasedTradesTable } from '@/components/share/public-showcased-trades-table';
import { InlineStat } from '@/components/shared/inline-stat';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCurrency, formatPercent, pnlColor } from '@/lib/format';
import { buildProfileTabHref, type PublicProfileTab } from '@/lib/share';
import type { PublicPlaybook, PublicProfile } from '@/lib/types';
import { userDisplayName } from '@/lib/user-display';
import { cn } from '@/lib/utils';
import { LineChart } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ReactNode } from 'react';
import { useCallback, useMemo } from 'react';

interface PublicProfileViewProps {
  profile: PublicProfile;
  profileToken: string;
}

const TAB_LABELS: Record<PublicProfileTab, string> = {
  about: 'About',
  statistics: 'Statistics',
  trades: 'Trades',
};

const shareTabsListClass =
  'h-auto w-full justify-start gap-1 border border-slate-200 bg-white p-1 shadow-none sm:w-fit';
const shareTabsTriggerClass =
  'px-3.5 py-1.5 text-slate-600 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 data-[state=active]:shadow-none';

interface PublicProfileFieldRowProps {
  label: string;
  children: ReactNode;
}

function PublicProfileFieldRow({ label, children }: PublicProfileFieldRowProps) {
  return (
    <div className="space-y-1.5 py-4 first:pt-0 last:pb-0">
      <p className="text-sm font-semibold text-slate-900">{label}</p>
      <div className="text-sm text-slate-500">{children}</div>
    </div>
  );
}

function PublicProfilePlaybooksSection({ playbooks }: { playbooks: PublicPlaybook[] }) {
  if (playbooks.length === 0) {
    return null;
  }

  return (
    <div className={cn(marketingCardClass, 'overflow-hidden')}>
      <div className="divide-y divide-slate-100">
        {playbooks.map((playbook) => (
          <div key={playbook.name} className="space-y-1.5 px-4 py-4 sm:px-5 sm:py-5">
            <p className="text-sm font-semibold text-slate-900">{playbook.name}</p>
            {playbook.description ? (
              <p className="text-sm leading-relaxed text-slate-500">{playbook.description}</p>
            ) : (
              <p className="text-sm text-slate-400">No description provided.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PublicProfileAboutPanel({ profile }: { profile: PublicProfile }) {
  const hasAboutContent =
    Boolean(profile.bio) || profile.favoriteSymbols.length > 0 || Boolean(profile.displayName);

  return (
    <div className="space-y-4">
      <div className={cn(marketingCardClass, 'px-4 py-6 sm:px-6')}>
        {hasAboutContent ? (
          <div className="divide-y divide-slate-100">
            {profile.bio ? (
              <PublicProfileFieldRow label="Bio">
                <p className="max-w-2xl leading-relaxed text-slate-600">{profile.bio}</p>
              </PublicProfileFieldRow>
            ) : null}

            {profile.displayName ? (
              <PublicProfileFieldRow label="Display name">
                <span className="text-slate-600">{profile.displayName}</span>
              </PublicProfileFieldRow>
            ) : null}

            {profile.favoriteSymbols.length > 0 ? (
              <PublicProfileFieldRow label="Favorite symbols">
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {profile.favoriteSymbols.map((symbol) => (
                    <Badge
                      key={symbol}
                      variant="secondary"
                      className="border-slate-200 bg-slate-50 font-medium text-slate-700"
                    >
                      {symbol}
                    </Badge>
                  ))}
                </div>
              </PublicProfileFieldRow>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No profile details shared yet.</p>
        )}
      </div>

      <PublicProfilePlaybooksSection playbooks={profile.playbooks} />
    </div>
  );
}

function resolveActiveTab(
  tabParam: string | null,
  pageParam: string | null,
  visibleTabs: PublicProfileTab[],
): PublicProfileTab {
  if (tabParam && visibleTabs.includes(tabParam as PublicProfileTab)) {
    return tabParam as PublicProfileTab;
  }

  const page = pageParam ? Number.parseInt(pageParam, 10) : 1;
  if (page > 1 && visibleTabs.includes('trades')) {
    return 'trades';
  }

  return 'about';
}

export function PublicProfileView({ profile, profileToken }: PublicProfileViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const displayName = userDisplayName({ displayName: profile.displayName });
  const showStatistics = profile.overview !== null && profile.equityCurve !== null;
  const showTradesTab = profile.showcasedTrades.total > 0;
  const showcasedTrades = profile.showcasedTrades;

  const visibleTabs = useMemo(() => {
    const tabs: PublicProfileTab[] = ['about'];
    if (showStatistics) {
      tabs.push('statistics');
    }
    if (showTradesTab) {
      tabs.push('trades');
    }
    return tabs;
  }, [showStatistics, showTradesTab]);

  const activeTab = resolveActiveTab(
    searchParams.get('tab'),
    searchParams.get('page'),
    visibleTabs,
  );

  const handleTabChange = useCallback(
    (tab: PublicProfileTab) => {
      if (tab === activeTab) {
        return;
      }
      router.push(buildProfileTabHref(profileToken, tab));
    },
    [activeTab, profileToken, router],
  );

  const showTabNav = visibleTabs.length > 1;

  return (
    <div className="space-y-6">
      <PublicShareProfileHeader
        displayName={displayName}
        avatarUrl={profile.avatarUrl}
        headerUrl={profile.headerUrl}
      />

      {showTabNav ? (
        <div className="space-y-3">
          <div className="sm:hidden">
            <Select value={activeTab} onValueChange={(value) => handleTabChange(value as PublicProfileTab)}>
              <SelectTrigger className="h-9 w-full border-slate-200 bg-white text-slate-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibleTabs.map((tab) => (
                  <SelectItem key={tab} value={tab}>
                    {TAB_LABELS[tab]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={(value) => handleTabChange(value as PublicProfileTab)}
            className="gap-6"
          >
            <TabsList className={cn(shareTabsListClass, 'hidden sm:inline-flex')}>
              {visibleTabs.map((tab) => (
                <TabsTrigger key={tab} value={tab} className={shareTabsTriggerClass}>
                  {TAB_LABELS[tab]}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="about" className="mt-0 space-y-4">
              <PublicProfileAboutPanel profile={profile} />
            </TabsContent>

            {showStatistics && profile.overview && profile.equityCurve ? (
              <TabsContent value="statistics" className="mt-0 space-y-4">
                <div className={cn(marketingCardClass, 'space-y-6 px-4 py-5 sm:px-5 sm:py-6')}>
                  <p className="text-xs text-slate-500">
                    Aggregate performance shared by this trader. Individual trades are never
                    exposed.
                  </p>

                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
                    <InlineStat
                      label="Net P&L"
                      value={formatCurrency(profile.overview.netPnl, { signed: true })}
                      valueClassName={pnlColor(profile.overview.netPnl)}
                      className="border-slate-200 shadow-none"
                    />
                    <InlineStat
                      label="Win rate"
                      value={formatPercent(profile.overview.winRate)}
                      className="border-slate-200 shadow-none"
                    />
                    <InlineStat
                      label="Total trades"
                      value={String(profile.overview.totalTrades)}
                      className="border-slate-200 shadow-none"
                    />
                    <InlineStat
                      label="Profit factor"
                      value={
                        profile.overview.profitFactor === null
                          ? '—'
                          : profile.overview.profitFactor.toFixed(2)
                      }
                      className="border-slate-200 shadow-none"
                    />
                    <InlineStat
                      label="Expectancy"
                      value={formatCurrency(profile.overview.expectancy, { signed: true })}
                      valueClassName={pnlColor(profile.overview.expectancy)}
                      className="border-slate-200 shadow-none"
                    />
                    <InlineStat
                      label="Avg R"
                      value={profile.overview.avgR === null ? '—' : profile.overview.avgR.toFixed(2)}
                      valueClassName={pnlColor(profile.overview.avgR)}
                      className="border-slate-200 shadow-none"
                    />
                    <InlineStat
                      label="Trader score"
                      value={String(Math.round(profile.overview.traderScore))}
                      className="border-slate-200 shadow-none"
                    />
                    <InlineStat
                      label="Max drawdown"
                      value={formatCurrency(-profile.overview.maxDrawdown)}
                      valueClassName="text-destructive"
                      className="border-slate-200 shadow-none"
                    />
                  </div>

                  <Card className="border-slate-200 shadow-none">
                    <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <LineChart className="h-4 w-4" aria-hidden="true" />
                      </div>
                      <CardTitle className="text-base font-semibold text-slate-900">
                        Equity curve
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {profile.equityCurve.length === 0 ? (
                        <p className="text-sm text-slate-500">No closed trades to chart yet.</p>
                      ) : (
                        <EquityCurveChart data={profile.equityCurve} height={300} />
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            ) : null}

            {showTradesTab ? (
              <TabsContent value="trades" className="mt-0 space-y-4">
                <div className={cn(marketingCardClass, 'overflow-hidden')}>
                  <PublicShowcasedTradesTable profileToken={profileToken} page={showcasedTrades} />
                </div>
              </TabsContent>
            ) : null}
          </Tabs>
        </div>
      ) : (
        <PublicProfileAboutPanel profile={profile} />
      )}
    </div>
  );
}