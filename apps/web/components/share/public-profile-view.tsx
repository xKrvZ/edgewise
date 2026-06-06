'use client';

import { EquityCurveChart } from '@/components/charts/equity-curve-chart';
import { InlineStat } from '@/components/shared/inline-stat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency, formatPercent, pnlColor } from '@/lib/format';
import type { PublicProfile } from '@/lib/types';
import { UserRound } from 'lucide-react';

interface PublicProfileViewProps {
  profile: PublicProfile;
}

function initials(name?: string | null): string {
  if (!name) return 'T';
  return name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function PublicProfileView({ profile }: PublicProfileViewProps) {
  const showStats = profile.overview !== null && profile.equityCurve !== null;

  return (
    <div className="space-y-8">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div
          className="relative h-36 bg-muted sm:h-44"
          style={
            profile.headerUrl
              ? {
                  backgroundImage: `url(${profile.headerUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        />
        <div className="relative px-6 pb-6">
          <Avatar className="-mt-10 h-20 w-20 border-4 border-card shadow-sm">
            <AvatarImage src={profile.avatarUrl ?? undefined} alt={profile.displayName ?? 'Trader'} />
            <AvatarFallback className="bg-primary/15 text-lg text-primary">
              {profile.avatarUrl ? (
                <UserRound className="h-8 w-8" />
              ) : (
                initials(profile.displayName)
              )}
            </AvatarFallback>
          </Avatar>
          <div className="mt-3 space-y-2">
            <p className="text-[0.6875rem] font-semibold uppercase tracking-widest text-primary">
              Trader profile
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              {profile.displayName ?? 'Trader profile'}
            </h1>
            {profile.bio && (
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{profile.bio}</p>
            )}
            {profile.favoriteSymbols.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {profile.favoriteSymbols.map((symbol) => (
                  <Badge key={symbol} variant="secondary">
                    {symbol}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {profile.playbooks.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Playbooks
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
            {profile.playbooks.map((playbook) => (
              <Card
                key={playbook.name}
                className="transition-[border-color,box-shadow] duration-150 hover:border-primary/25 hover:shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{playbook.name}</CardTitle>
                </CardHeader>
                {playbook.description && (
                  <CardContent className="pt-0">
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {playbook.description}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </section>
      )}

      {showStats && profile.overview && profile.equityCurve && (
        <section className="space-y-6">
          <h2 className="text-[0.6875rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Trading stats
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
            <InlineStat
              label="Net P&L"
              value={formatCurrency(profile.overview.netPnl, { signed: true })}
              valueClassName={pnlColor(profile.overview.netPnl)}
            />
            <InlineStat label="Win rate" value={formatPercent(profile.overview.winRate)} />
            <InlineStat label="Total trades" value={String(profile.overview.totalTrades)} />
            <InlineStat
              label="Profit factor"
              value={
                profile.overview.profitFactor === null
                  ? '—'
                  : profile.overview.profitFactor.toFixed(2)
              }
            />
            <InlineStat
              label="Expectancy"
              value={formatCurrency(profile.overview.expectancy, { signed: true })}
              valueClassName={pnlColor(profile.overview.expectancy)}
            />
            <InlineStat
              label="Avg R"
              value={profile.overview.avgR === null ? '—' : profile.overview.avgR.toFixed(2)}
              valueClassName={pnlColor(profile.overview.avgR)}
            />
            <InlineStat
              label="Zella score"
              value={String(Math.round(profile.overview.zellaScore))}
            />
            <InlineStat
              label="Max drawdown"
              value={formatCurrency(-profile.overview.maxDrawdown)}
              valueClassName="text-destructive"
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Equity curve</CardTitle>
            </CardHeader>
            <CardContent>
              {profile.equityCurve.length === 0 ? (
                <p className="text-sm text-muted-foreground">No closed trades to chart yet.</p>
              ) : (
                <EquityCurveChart data={profile.equityCurve} height={300} />
              )}
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}
