'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatPercent, formatRelativeTime } from '@/lib/format';
import type { Account, AccountType, ChallengeStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  XCircle,
} from 'lucide-react';

interface AccountCardProps {
  account: Account;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  className?: string;
}

const TYPE_LABELS: Record<AccountType, string> = {
  live: 'Live',
  paper: 'Paper',
  prop: 'Prop Firm',
};

const TYPE_BADGE_CLASS: Record<AccountType, string> = {
  live: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  paper: 'border-slate-200 bg-slate-50 text-slate-600',
  prop: 'border-primary/20 bg-primary/5 text-primary',
};

const STATUS_META: Record<
  Exclude<ChallengeStatus, 'active'>,
  { label: string; className: string; Icon: typeof AlertTriangle }
> = {
  passed: {
    label: 'Passed',
    className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    Icon: CheckCircle2,
  },
  failed: {
    label: 'Failed',
    className: 'border-red-200 bg-red-50 text-red-700',
    Icon: XCircle,
  },
};

function hasRiskLimits(account: Account): boolean {
  return (
    account.profitTarget != null || account.dailyLossLimit != null || account.maxLossLimit != null
  );
}

function accountAvatarLabel(account: Account): string {
  const source = account.firmName ?? account.broker ?? account.name;
  const words = source.trim().split(/\s+/);
  if (words.length >= 2) {
    return `${words[0][0] ?? ''}${words[1][0] ?? ''}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function accountSubtitle(account: Account): string {
  const platform = account.firmName ?? account.broker ?? TYPE_LABELS[account.type];
  return `${platform} · ${formatCurrency(account.startingBalance, { compact: true })} starting`;
}

export function AccountCard({ account, onView, onEdit, onDelete, className }: AccountCardProps) {
  const showRisk = hasRiskLimits(account);
  const profit = account.currentBalance - account.startingBalance;
  const profitPct =
    account.profitTarget != null && account.profitTarget > 0
      ? Math.max(0, Math.min(100, (profit / account.profitTarget) * 100))
      : 0;

  const drawdownUsed = Math.max(0, account.startingBalance - account.currentBalance);
  const drawdownPct =
    account.maxLossLimit != null && account.maxLossLimit > 0
      ? Math.max(0, Math.min(100, (drawdownUsed / account.maxLossLimit) * 100))
      : 0;

  const statusMeta =
    account.challengeStatus && account.challengeStatus !== 'active'
      ? STATUS_META[account.challengeStatus]
      : null;

  return (
    <article
      className={cn(
        'flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5',
        className,
      )}
    >
      <div className="flex flex-1 flex-col">
        <div className="mb-4 flex items-start justify-between gap-3">
          <Badge variant="outline" className={cn('font-medium', TYPE_BADGE_CLASS[account.type])}>
            {TYPE_LABELS[account.type]}
          </Badge>
          <button
            type="button"
            className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            aria-label="Journal options"
            onClick={onEdit}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700">
            {accountAvatarLabel(account)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-slate-950">{account.name}</h3>
            <p className="mt-0.5 truncate text-sm text-slate-500">{accountSubtitle(account)}</p>
            {statusMeta ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Badge variant="outline" className={cn('gap-1', statusMeta.className)}>
                  <statusMeta.Icon className="h-3 w-3" />
                  {statusMeta.label}
                </Badge>
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          {showRisk && account.profitTarget != null ? (
            <div>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">Profit target</span>
                <div className="flex items-center gap-1.5 tabular-nums">
                  <span className="text-slate-600">
                    {formatCurrency(profit, { signed: true })} /{' '}
                    {formatCurrency(account.profitTarget)}
                  </span>
                  <span className="font-medium text-emerald-600">{formatPercent(profitPct, 0)}</span>
                </div>
              </div>
              <Progress
                value={profitPct}
                className="h-1.5 bg-emerald-100 [&>[data-slot=progress-indicator]]:bg-emerald-500"
              />
            </div>
          ) : null}

          {showRisk && account.maxLossLimit != null ? (
            <div>
              <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-500">
                  Loss used{account.trailingDrawdown ? ' (trailing)' : ''}
                </span>
                <div className="flex items-center gap-1.5 tabular-nums">
                  <span className="text-slate-600">
                    {formatCurrency(drawdownUsed)} / {formatCurrency(account.maxLossLimit)}
                  </span>
                  <span className="font-medium text-slate-500">{formatPercent(drawdownPct, 0)}</span>
                </div>
              </div>
              <Progress
                value={drawdownPct}
                className={cn(
                  'h-1.5 bg-slate-100',
                  drawdownPct >= 80
                    ? '[&>[data-slot=progress-indicator]]:bg-red-500'
                    : drawdownPct >= 50
                      ? '[&>[data-slot=progress-indicator]]:bg-amber-500'
                      : '[&>[data-slot=progress-indicator]]:bg-slate-400',
                )}
              />
            </div>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Balance</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-950">
                {formatCurrency(account.currentBalance)}
              </p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-500">Daily loss limit</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-950">
                {account.dailyLossLimit != null ? formatCurrency(account.dailyLossLimit) : '—'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-500">
          Updated {formatRelativeTime(account.updatedAt)}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-slate-200 bg-white text-slate-700"
            onClick={onView}
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-8 w-8 border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onDelete}
            aria-label="Delete journal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}

/** Shared horizontal padding for journal list header and row cells. */
export const JOURNAL_LIST_CELL_PADDING = 'px-5';

export const JOURNAL_LIST_HEAD_CLASS = cn(
  JOURNAL_LIST_CELL_PADDING,
  'py-3 text-left align-middle text-xs font-medium tracking-wide text-slate-500 uppercase',
);

export const JOURNAL_LIST_BODY_CELL_CLASS = cn(
  JOURNAL_LIST_CELL_PADDING,
  'py-4 align-middle',
);

export function AccountListColGroup() {
  return (
    <colgroup className="hidden sm:table-column-group">
      <col />
      <col className="w-[7.5rem]" />
      <col className="w-[7.5rem]" />
      <col className="w-[6.5rem]" />
      <col className="w-[9.5rem]" />
    </colgroup>
  );
}

interface AccountListRowProps {
  account: Account;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AccountListHeader() {
  return (
    <thead className="hidden border-b border-slate-100 sm:table-header-group">
      <tr>
        <th scope="col" className={JOURNAL_LIST_HEAD_CLASS}>
          Journal
        </th>
        <th scope="col" className={cn(JOURNAL_LIST_HEAD_CLASS, 'text-right')}>
          Balance
        </th>
        <th scope="col" className={cn(JOURNAL_LIST_HEAD_CLASS, 'text-right')}>
          Daily loss
        </th>
        <th scope="col" className={JOURNAL_LIST_HEAD_CLASS}>
          Updated
        </th>
        <th scope="col" className={cn(JOURNAL_LIST_HEAD_CLASS, 'text-right')}>
          <span className="sr-only">Actions</span>
        </th>
      </tr>
    </thead>
  );
}

export function AccountListRow({ account, onView, onEdit, onDelete }: AccountListRowProps) {
  return (
    <tr className="block border-b border-slate-100 last:border-b-0 sm:table-row">
      <td className={cn(JOURNAL_LIST_BODY_CELL_CLASS, 'block sm:table-cell')}>
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700">
            {accountAvatarLabel(account)}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-slate-950">{account.name}</p>
              <Badge variant="outline" className={cn('font-medium', TYPE_BADGE_CLASS[account.type])}>
                {TYPE_LABELS[account.type]}
              </Badge>
            </div>
            <p className="truncate text-sm text-slate-500">{accountSubtitle(account)}</p>
          </div>
        </div>
      </td>

      <td className={cn(JOURNAL_LIST_BODY_CELL_CLASS, 'block sm:table-cell')}>
        <div className="rounded-lg bg-slate-50 px-3 py-2 sm:rounded-none sm:bg-transparent sm:p-0 sm:text-right">
          <p className="text-xs text-slate-500 sm:sr-only">Balance</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-950 sm:mt-0">
            {formatCurrency(account.currentBalance)}
          </p>
        </div>
      </td>

      <td className={cn(JOURNAL_LIST_BODY_CELL_CLASS, 'block sm:table-cell')}>
        <div className="rounded-lg bg-slate-50 px-3 py-2 sm:rounded-none sm:bg-transparent sm:p-0 sm:text-right">
          <p className="text-xs text-slate-500 sm:sr-only">Daily loss limit</p>
          <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-950 sm:mt-0">
            {account.dailyLossLimit != null ? formatCurrency(account.dailyLossLimit) : '—'}
          </p>
        </div>
      </td>

      <td className={cn(JOURNAL_LIST_BODY_CELL_CLASS, 'block text-xs text-slate-500 sm:table-cell')}>
        <span className="sm:hidden">Updated </span>
        {formatRelativeTime(account.updatedAt)}
      </td>

      <td className={cn(JOURNAL_LIST_BODY_CELL_CLASS, 'block sm:table-cell')}>
        <div className="flex items-center gap-1 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-8 w-8 border-slate-200 bg-white text-slate-700"
            onClick={onView}
            aria-label="View journal"
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-8 w-8 border-slate-200 bg-white text-slate-700"
            onClick={onEdit}
            aria-label="Edit journal"
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="h-8 w-8 border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={onDelete}
            aria-label="Delete journal"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </td>
    </tr>
  );
}
