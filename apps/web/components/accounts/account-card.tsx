'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/format';
import type { Account, ChallengeStatus } from '@/lib/types';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Pencil,
  Trash2,
  Wallet,
  XCircle,
} from 'lucide-react';

interface AccountCardProps {
  account: Account;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const TYPE_LABELS = {
  live: 'Live',
  paper: 'Paper',
  prop: 'Prop',
} as const;

const STATUS_META: Record<
  ChallengeStatus,
  { label: string; className: string; Icon: typeof AlertTriangle }
> = {
  active: { label: 'Active', className: 'bg-chart-2/20 text-chart-2', Icon: AlertTriangle },
  passed: { label: 'Passed', className: 'bg-success/20 text-success', Icon: CheckCircle2 },
  failed: { label: 'Failed', className: 'bg-destructive/20 text-destructive', Icon: XCircle },
};

function hasRiskLimits(account: Account): boolean {
  return (
    account.profitTarget != null || account.dailyLossLimit != null || account.maxLossLimit != null
  );
}

export function AccountCard({ account, onView, onEdit, onDelete }: AccountCardProps) {
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
  const drawdownRemaining =
    account.maxLossLimit != null ? Math.max(0, account.maxLossLimit - drawdownUsed) : 0;

  const warnings: string[] = [];
  if (showRisk && account.challengeStatus === 'active') {
    if (account.maxLossLimit != null && drawdownPct >= 80) {
      warnings.push(`Only ${formatCurrency(drawdownRemaining)} of max loss remaining.`);
    }
    if (
      account.dailyLossLimit != null &&
      account.maxLossLimit != null &&
      drawdownRemaining <= account.dailyLossLimit
    ) {
      warnings.push('A single max daily loss could breach your limit.');
    }
    if (account.profitTarget != null && profitPct >= 90 && profitPct < 100) {
      warnings.push('Almost at the profit target — protect your gains.');
    }
  }

  const statusMeta = account.challengeStatus ? STATUS_META[account.challengeStatus] : null;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between">
        <div>
          <CardTitle className="text-base">{account.name}</CardTitle>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {account.broker ?? TYPE_LABELS[account.type]} ·{' '}
            {formatCurrency(account.startingBalance, { compact: true })} starting
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline" className="gap-1">
            <Wallet className="h-3 w-3" />
            {TYPE_LABELS[account.type]}
          </Badge>
          {statusMeta && (
            <Badge className={cn('gap-1 border-transparent', statusMeta.className)}>
              <statusMeta.Icon className="h-3 w-3" />
              {statusMeta.label}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showRisk && account.profitTarget != null && (
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Profit target</span>
              <span className="tabular-nums">
                {formatCurrency(profit, { signed: true })} / {formatCurrency(account.profitTarget)}
              </span>
            </div>
            <Progress value={profitPct} className="[&>[data-slot=progress-indicator]]:bg-success" />
          </div>
        )}

        {showRisk && account.maxLossLimit != null && (
          <div>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Loss used{account.trailingDrawdown ? ' (trailing)' : ''}
              </span>
              <span className="tabular-nums">
                {formatCurrency(drawdownUsed)} / {formatCurrency(account.maxLossLimit)}
              </span>
            </div>
            <Progress
              value={drawdownPct}
              className={cn(
                '[&>[data-slot=progress-indicator]]:bg-success',
                drawdownPct >= 80 && '[&>[data-slot=progress-indicator]]:bg-destructive',
                drawdownPct >= 50 &&
                  drawdownPct < 80 &&
                  '[&>[data-slot=progress-indicator]]:bg-warning',
              )}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-md border px-3 py-2">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="font-medium tabular-nums">{formatCurrency(account.currentBalance)}</p>
          </div>
          <div className="rounded-md border px-3 py-2">
            <p className="text-xs text-muted-foreground">Daily loss limit</p>
            <p className="font-medium tabular-nums">
              {account.dailyLossLimit != null ? formatCurrency(account.dailyLossLimit) : '—'}
            </p>
          </div>
        </div>

        {warnings.length > 0 && (
          <div className="space-y-1 rounded-md border border-warning/30 bg-warning/10 p-2.5">
            {warnings.map((w) => (
              <p key={w} className="flex items-start gap-1.5 text-xs text-warning">
                <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                {w}
              </p>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-1">
          <Button variant="outline" size="sm" onClick={onView}>
            <Eye className="h-4 w-4" />
            View
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onEdit} aria-label="Edit journal">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            onClick={onDelete}
            aria-label="Delete journal"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
