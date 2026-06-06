'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 pl-4">#</TableHead>
              <TableHead>Trader</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Net P&L</TableHead>
              <TableHead className="text-right">Win rate</TableHead>
              <TableHead className="text-right">Trades</TableHead>
              <TableHead className="pr-4 text-right">Profit factor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.entries.map((entry) => (
              <TableRow key={entry.userId}>
                <TableCell
                  className={cn(
                    'pl-4 font-semibold tabular-nums',
                    entry.rank <= 3 && 'text-primary',
                  )}
                >
                  {entry.rank}
                </TableCell>
                <TableCell className="font-medium">{entry.displayName}</TableCell>
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
                <TableCell className="pr-4 text-right tabular-nums">
                  {formatProfitFactor(entry.profitFactor)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
