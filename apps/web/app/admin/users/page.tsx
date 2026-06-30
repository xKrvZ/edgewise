'use client';

import { PageHeader } from '@/components/app/page-header';
import { UserAvatar } from '@/components/shared/user-avatar';
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
import { BILLING_PLAN_LABELS, type BillingPlanId } from '@/lib/billing-plans';
import { formatDate } from '@/lib/format';
import { ALL_ROLES, displayPlatformRole } from '@/lib/roles';
import { userDisplayName } from '@/lib/user-display';
import type { AdminUserRow } from '@/lib/types/admin';
import { ChevronLeft, ChevronRight, Search, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useMemo, useState } from 'react';

const PAGE_SIZE = 25;

type SubscriptionActiveFilter = 'all' | 'active' | 'inactive';
type PlanFilter = 'all' | BillingPlanId;
type RoleFilter = 'all' | (typeof ALL_ROLES)[number];

const PLAN_FILTER_OPTIONS: PlanFilter[] = ['all', 'starter', 'pro', 'elite', 'none'];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [subscriptionFilter, setSubscriptionFilter] = useState<SubscriptionActiveFilter>('all');
  const [planFilter, setPlanFilter] = useState<PlanFilter>('all');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasActiveFilters = useMemo(
    () =>
      subscriptionFilter !== 'all' ||
      planFilter !== 'all' ||
      roleFilter !== 'all' ||
      search.length > 0,
    [planFilter, roleFilter, search.length, subscriptionFilter],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setOffset(0);
  }, [planFilter, roleFilter, subscriptionFilter]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const page = await api.admin.users.list({
        limit: PAGE_SIZE,
        offset,
        search: search || undefined,
        subscriptionActive:
          subscriptionFilter === 'all' ? undefined : subscriptionFilter,
        plan: planFilter === 'all' ? undefined : planFilter,
        role: roleFilter === 'all' ? undefined : roleFilter,
      });
      setUsers(page.items);
      setTotal(page.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load users');
      setUsers([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [offset, planFilter, roleFilter, search, subscriptionFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  function clearFilters() {
    setSearchInput('');
    setSearch('');
    setSubscriptionFilter('all');
    setPlanFilter('all');
    setRoleFilter('all');
    setOffset(0);
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  return (
    <PageBody>
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Manage platform accounts, roles, and subscription status."
        className="border-none pb-0"
      />

      <Card className="gap-0 overflow-hidden">
        <CardHeader className="flex flex-col gap-4 border-b border-border/60">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold">All users</CardTitle>
            {hasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="self-start sm:self-auto"
                onClick={clearFilters}
              >
                <X className="h-4 w-4" />
                Clear filters
              </Button>
            ) : null}
          </div>
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative min-w-0 w-full flex-2">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by email"
                className="w-full pl-9"
                aria-label="Search users by email"
              />
            </div>
            <Select
              value={subscriptionFilter}
              onValueChange={(value) => setSubscriptionFilter(value as SubscriptionActiveFilter)}
            >
              <SelectTrigger className="w-full min-w-0 sm:flex-1" aria-label="Filter by subscription status">
                <SelectValue placeholder="Subscription" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subscriptions</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={planFilter}
              onValueChange={(value) => setPlanFilter(value as PlanFilter)}
            >
              <SelectTrigger className="w-full min-w-0 sm:flex-1" aria-label="Filter by plan">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                {PLAN_FILTER_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option === 'all' ? 'All plans' : BILLING_PLAN_LABELS[option]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={roleFilter}
              onValueChange={(value) => setRoleFilter(value as RoleFilter)}
            >
              <SelectTrigger className="w-full min-w-0 sm:flex-1" aria-label="Filter by role">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                {ALL_ROLES.map((role) => (
                  <SelectItem key={role} value={role}>
                    {displayPlatformRole(role)}
                  </SelectItem>
                ))}
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
                icon={Users}
                title="Could not load users"
                message={error}
              />
            </div>
          ) : users.length === 0 ? (
            <div className={cardTableStatePaddingClass}>
              <EmptyState
                variant="embedded"
                icon={Users}
                title="No users found"
                message={
                  hasActiveFilters
                    ? 'No users match the current filters. Try adjusting or clearing them.'
                    : 'No users are registered yet.'
                }
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/users/${user.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <UserAvatar
                            displayName={user.displayName}
                            name={user.name}
                            email={user.email}
                            image={user.image}
                            className="h-8 w-8 shrink-0"
                          />
                          <span className="font-medium">
                            {userDisplayName({
                              displayName: user.displayName,
                              name: user.name,
                              email: user.email,
                            })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{displayPlatformRole(user.role)}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.subscriptionStatus ?? '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <CardTableFooter>
                <p className="text-sm text-muted-foreground">
                  {total} user{total === 1 ? '' : 's'}
                  {search ? ` matching "${search}"` : ''}
                  {hasActiveFilters && !search ? ' matching filters' : ''}
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
