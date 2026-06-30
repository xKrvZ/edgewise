'use client';

import { ListMetricsBar } from '@/components/shared/list-metrics-bar';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardTableContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { formatCurrency, formatPercent, formatProfitFactor, pnlColor } from '@/lib/format';
import type { CommunityLeaderboard, CommunityLeaderboardEntry } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CommunityLeaderboardTableProps {
  leaderboard: CommunityLeaderboard;
}

function LeaderboardEntryMetrics({ entry }: { entry: CommunityLeaderboardEntry }) {
  return (
    <ListMetricsBar
      ariaLabel={`${entry.displayName} leaderboard stats`}
      className="mt-3"
      metrics={[
        {
          label: 'Net P&L',
          value: formatCurrency(entry.netPnl),
          valueClassName: pnlColor(entry.netPnl),
        },
        { label: 'Win rate', value: formatPercent(entry.winRate) },
        { label: 'Trades', value: String(entry.tradeCount) },
        { label: 'Profit factor', value: formatProfitFactor(entry.profitFactor) },
      ]}
    />
  );
}

function LeaderboardEntryCard({ entry }: { entry: CommunityLeaderboardEntry }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            'w-8 shrink-0 text-center text-lg font-semibold tabular-nums',
            entry.rank <= 3 && 'text-primary',
          )}
        >
          {entry.rank}
        </span>
        <UserAvatar
          name={entry.displayName}
          avatarUrl={entry.avatarUrl}
          className="h-10 w-10 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate font-medium">{entry.displayName}</span>
            <Badge variant="secondary" className="shrink-0 capitalize">
              {entry.role}
            </Badge>
          </div>
        </div>
      </div>
      <LeaderboardEntryMetrics entry={entry} />
    </div>
  );
}

export function CommunityLeaderboardTable({ leaderboard }: CommunityLeaderboardTableProps) {
  if (leaderboard.entries.length === 0) {
    return (
      <Card className="border-dashed bg-muted/20 shadow-none">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No closed trades in the last {leaderboard.periodDays} days.
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-3 md:hidden">
        {leaderboard.entries.map((entry) => (
          <LeaderboardEntryCard key={entry.userId} entry={entry} />
        ))}
      </div>

      <Card className="hidden overflow-hidden py-0 md:block">
        <CardTableContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Trader</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Net P&L</TableHead>
                <TableHead className="text-right">Win rate</TableHead>
                <TableHead className="text-right">Trades</TableHead>
                <TableHead className="text-right">Profit factor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.entries.map((entry) => (
                <TableRow key={entry.userId}>
                  <TableCell
                    className={cn('font-semibold tabular-nums', entry.rank <= 3 && 'text-primary')}
                  >
                    {entry.rank}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        name={entry.displayName}
                        avatarUrl={entry.avatarUrl}
                        className="h-8 w-8 shrink-0"
                      />
                      <span className="font-medium">{entry.displayName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {entry.role}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn('text-right tabular-nums', pnlColor(entry.netPnl))}>
                    {formatCurrency(entry.netPnl)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatPercent(entry.winRate)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{entry.tradeCount}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatProfitFactor(entry.profitFactor)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardTableContent>
      </Card>
    </>
  );
}
