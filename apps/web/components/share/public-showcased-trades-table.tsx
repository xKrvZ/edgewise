'use client';

import { HideFromProfileButton } from '@/components/share/hide-from-profile-button';
import { useIsOwnPublicProfile } from '@/components/share/use-is-own-public-profile';
import { DirectionBadge } from '@/components/trades/direction-badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { buildProfileTabHref, tradeShareUrl } from '@/lib/share';
import { formatCurrency, formatDate, formatR, pnlColor } from '@/lib/format';
import type { Page, PublicShowcasedTrade } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PublicShowcasedTradesTableProps {
  profileToken: string;
  page: Page<PublicShowcasedTrade>;
}

export function PublicShowcasedTradesTable({
  profileToken,
  page,
}: PublicShowcasedTradesTableProps) {
  const router = useRouter();
  const { isOwner } = useIsOwnPublicProfile(profileToken);
  const { items: trades, total, page: currentPage, limit, pageCount } = page;

  const rangeStart = total === 0 ? 0 : (currentPage - 1) * limit + 1;
  const rangeEnd = Math.min(currentPage * limit, total);
  const canPrev = currentPage > 1;
  const canNext = currentPage < pageCount;

  function profileHref(nextPage: number) {
    return buildProfileTabHref(profileToken, 'trades', { page: nextPage, limit });
  }

  function goToPage(nextPage: number) {
    router.push(profileHref(nextPage));
  }

  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-100 hover:bg-transparent">
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-500">
                Symbol
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-500">
                Direction
              </TableHead>
              <TableHead className="whitespace-nowrap text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                P&amp;L
              </TableHead>
              <TableHead className="whitespace-nowrap text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                R-Multiple
              </TableHead>
              <TableHead className="whitespace-nowrap text-xs font-semibold uppercase tracking-wide text-slate-500">
                Date
              </TableHead>
              <TableHead className="w-20 text-right">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trades.map((trade) => {
              const href = tradeShareUrl(trade.shareToken);
              const hasPnl = trade.pnl !== null && trade.status !== 'open';
              const tradeDate = trade.exitTime ?? trade.entryTime;

              return (
                <TableRow
                  key={trade.shareToken}
                  className="cursor-pointer border-slate-100 hover:bg-slate-50/80"
                  onClick={() => router.push(href)}
                >
                  <TableCell className="whitespace-nowrap font-mono font-semibold text-slate-900">
                    {trade.symbol}
                  </TableCell>
                  <TableCell>
                    <DirectionBadge direction={trade.direction} />
                  </TableCell>
                  <TableCell
                    className={cn(
                      'whitespace-nowrap text-right tabular-nums font-medium',
                      hasPnl ? pnlColor(trade.pnl) : 'text-slate-400 capitalize',
                    )}
                  >
                    {hasPnl ? formatCurrency(trade.pnl, { signed: true }) : trade.status}
                  </TableCell>
                  <TableCell
                    className={cn(
                      'whitespace-nowrap text-right tabular-nums',
                      pnlColor(trade.rMultiple),
                    )}
                  >
                    {formatR(trade.rMultiple)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-slate-500">
                    {formatDate(tradeDate)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5">
                      {isOwner ? (
                        <HideFromProfileButton tradeId={trade.tradeId} symbol={trade.symbol} />
                      ) : null}
                      <Link
                        href={href}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-primary"
                        aria-label={`View ${trade.symbol} trade`}
                      >
                        <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 ? (
        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-xs text-slate-500">
            Showing {rangeStart}–{rangeEnd} of {total}
            <span className="hidden sm:inline"> · </span>
            <span className="block sm:inline">
              Page {currentPage} of {pageCount}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canPrev}
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => goToPage(currentPage - 1)}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!canNext}
              className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              onClick={() => goToPage(currentPage + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
