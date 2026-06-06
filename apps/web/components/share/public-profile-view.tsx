'use client';

import { EquityCurveChart } from '@/components/charts/equity-curve-chart';
import { InlineStat } from '@/components/shared/inline-stat';
import { marketingCardClass } from '@/components/marketing/marketing-section';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent, pnlColor } from '@/lib/format';
import type { PublicProfile } from '@/lib/types';
import { userDisplayName, userInitials } from '@/lib/user-display';
import { cn } from '@/lib/utils';
import { BookOpen, LineChart, TrendingUp } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';

interface PublicProfileViewProps {
  profile: PublicProfile;
}

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

interface PublicProfileSectionProps {
  title: string;
  icon?: ComponentType<{ className?: string }>;
  children: ReactNode;
}

function PublicProfileSection({ title, icon: Icon, children }: PublicProfileSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          </div>
        ) : null}
        <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">{title}</h2>
      </div>
      <div className={cn(marketingCardClass, 'overflow-hidden')}>{children}</div>
    </section>
  );
}

export function PublicProfileView({ profile }: PublicProfileViewProps) {
  const displayName = userDisplayName({ displayName: profile.displayName });
  const avatarInitials = userInitials({ displayName: profile.displayName });
  const showStats = profile.overview !== null && profile.equityCurve !== null;
  const hasAboutContent =
    Boolean(profile.bio) || profile.favoriteSymbols.length > 0 || Boolean(profile.displayName);

  return (
    <div className="space-y-8">
      {/* Banner with integrated avatar — mirrors private profile layout */}
      <div
        className={cn(
          'relative flex min-h-32 flex-col items-start justify-center gap-4 overflow-hidden rounded-2xl px-4 py-5 sm:min-h-36 sm:flex-row sm:items-center sm:justify-between sm:px-6',
          profile.headerUrl ? 'bg-slate-200' : 'bg-slate-100',
        )}
        style={
          profile.headerUrl
            ? {
                backgroundImage: `url(${profile.headerUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : undefined
        }
      >
        {profile.headerUrl ? (
          <div
            className="pointer-events-none absolute inset-0 bg-linear-to-r from-slate-950/50 via-slate-950/25 to-transparent"
            aria-hidden="true"
          />
        ) : null}

        <div className="relative z-10 flex min-w-0 flex-1 items-center gap-4">
          <Avatar className="h-20 w-20 shrink-0 bg-primary text-primary-foreground shadow-md ring-4 ring-white sm:h-24 sm:w-24">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-primary text-lg font-semibold text-primary-foreground sm:text-xl">
              {avatarInitials}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 space-y-1">
            <p
              className={cn(
                'text-[0.6875rem] font-bold tracking-widest uppercase',
                profile.headerUrl ? 'text-white/80' : 'text-primary',
              )}
            >
              Trader profile
            </p>
            <h1
              className={cn(
                'truncate text-xl font-bold tracking-tight sm:text-2xl',
                profile.headerUrl ? 'text-white' : 'text-slate-950',
              )}
            >
              {displayName}
            </h1>
          </div>
        </div>
      </div>

      {/* About card */}
      {hasAboutContent ? (
        <div className={cn(marketingCardClass, 'px-4 py-6 sm:px-6')}>
          <h2 className="text-lg font-bold text-slate-900">About</h2>

          <div className="mt-4 divide-y divide-slate-100">
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
        </div>
      ) : null}

      {/* Playbooks */}
      {profile.playbooks.length > 0 ? (
        <PublicProfileSection title="Playbooks" icon={BookOpen}>
          <div className="divide-y divide-slate-100">
            {profile.playbooks.map((playbook) => (
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
        </PublicProfileSection>
      ) : null}

      {/* Trading stats */}
      {showStats && profile.overview && profile.equityCurve ? (
        <PublicProfileSection title="Trading stats" icon={TrendingUp}>
          <div className="space-y-6 px-4 py-5 sm:px-5 sm:py-6">
            <p className="text-xs text-slate-500">
              Aggregate performance shared by this trader. Individual trades are never exposed.
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
                <CardTitle className="text-base font-semibold text-slate-900">Equity curve</CardTitle>
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
        </PublicProfileSection>
      ) : null}
    </div>
  );
}
