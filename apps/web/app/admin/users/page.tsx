'use client';

import { PageHeader } from '@/components/app/page-header';
import { UserAvatar } from '@/components/shared/user-avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { PageBody } from '@/components/shared/page-body';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTableContent, CardTableFooter, CardTitle, cardTableStatePaddingClass } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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
import { displayPlatformRole } from '@/lib/roles';
import { userDisplayName } from '@/lib/user-display';
import type { AdminUserRow } from '@/lib/types/admin';
import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';

const PAGE_SIZE = 25;

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const page = await api.admin.users.list({
        limit: PAGE_SIZE,
        offset,
        search: search || undefined,
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
  }, [offset, search]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

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
        <CardHeader className="flex flex-col gap-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">All users</CardTitle>
          <div className="relative w-full sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by email"
              className="pl-9"
              aria-label="Search users by email"
            />
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
                message={search ? 'Try a different email search.' : 'No users match this filter.'}
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
