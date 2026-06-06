'use client';

import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PageBody } from '@/components/shared/page-body';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTableContent, CardTableFooter, CardTitle, cardTableStatePaddingClass } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiError, api } from '@/lib/api-client';
import { formatDate } from '@/lib/format';
import { userDisplayName } from '@/lib/user-display';
import type { AdminSubscriptionRow } from '@/lib/types/admin';
import { ChevronLeft, ChevronRight, CreditCard, Search } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 25;

function statusVariant(status: string): 'success' | 'secondary' | 'warning' | 'destructive' {
  switch (status.toLowerCase()) {
    case 'active':
      return 'success';
    case 'canceled':
      return 'warning';
    case 'inactive':
      return 'secondary';
    default:
      return 'secondary';
  }
}

export default function AdminSubscriptionsPage() {
  const router = useRouter();
  const [subscriptions, setSubscriptions] = useState<AdminSubscriptionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadSubscriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const page = await api.admin.subscriptions({
        limit: PAGE_SIZE,
        offset,
        search: search || undefined,
        status: statusFilter,
      });
      setSubscriptions(page.items);
      setTotal(page.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load subscriptions');
      setSubscriptions([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [offset, search, statusFilter]);

  useEffect(() => {
    void loadSubscriptions();
  }, [loadSubscriptions]);

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  return (
    <PageBody>
      <PageHeader
        eyebrow="Administration"
        title="Subscriptions"
        description="Manage subscriber plans, cancellations, and refunds across the platform."
        className="border-none pb-0"
      />

      <Card className="gap-0 overflow-hidden">
        <CardHeader className="flex flex-col gap-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">Subscribers</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:max-w-lg sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by email"
                className="pl-9"
                aria-label="Search subscribers by email"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setOffset(0);
              }}
            >
              <SelectTrigger className="w-full sm:w-[10rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="canceled">Canceled</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardTableContent>
          {isLoading ? (
            <div className={cn(cardTableStatePaddingClass, 'space-y-2')}>
              {Array.from({ length: 5 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className={cardTableStatePaddingClass}>
              <EmptyState
                variant="embedded"
                icon={CreditCard}
                title="Could not load subscriptions"
                message={error}
              />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className={cardTableStatePaddingClass}>
              <EmptyState
                variant="embedded"
                icon={CreditCard}
                title="No subscriptions found"
                message={
                  search
                    ? 'Try a different email search or status filter.'
                    : 'No subscribers match this filter.'
                }
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Period end</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((row) => (
                    <TableRow
                      key={row.userId}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/users/${row.userId}`)}
                    >
                      <TableCell className="font-medium">
                        {userDisplayName({
                          displayName: row.displayName,
                          name: row.name,
                          email: row.email,
                        })}
                      </TableCell>
                      <TableCell>{row.email}</TableCell>
                      <TableCell>{row.planName ?? '—'}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {row.currentPeriodEnd ? formatDate(row.currentPeriodEnd) : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          asChild
                          onClick={(event) => event.stopPropagation()}
                        >
                          <Link href={`/admin/users/${row.userId}`}>Manage</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <CardTableFooter>
                <p className="text-sm text-muted-foreground">
                  {total} subscriber{total === 1 ? '' : 's'}
                  {search ? ` matching "${search}"` : ''}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canPrev || isLoading}
                    onClick={() => setOffset((current) => Math.max(0, current - PAGE_SIZE))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="min-w-[7.5rem] text-center text-sm tabular-nums text-muted-foreground">
                    Page {page} of {pageCount}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canNext || isLoading}
                    onClick={() => setOffset((current) => current + PAGE_SIZE)}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardTableFooter>
            </>
          )}
        </CardTableContent>
      </Card>
    </PageBody>
  );
}
