'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardTableContent } from '@/components/ui/card';
import { formatCurrency, formatPercent, formatProfitFactor, pnlColor } from '@/lib/format';
import type { CommunityLeaderboard } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CommunityLeaderboardTableProps {
  leaderboard: CommunityLeaderboard;
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
    <Card className="overflow-hidden py-0">
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
  );
}
