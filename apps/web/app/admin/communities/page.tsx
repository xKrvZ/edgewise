'use client';

import { PageHeader } from '@/components/app/page-header';
import { EmptyState } from '@/components/shared/empty-state';
import { PageBody } from '@/components/shared/page-body';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTableContent,
  CardTableFooter,
  CardTitle,
  cardTableStatePaddingClass,
} from '@/components/ui/card';
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
import type { AdminCommunityRow } from '@/lib/types/admin';
import { ChevronLeft, ChevronRight, Search, Star, UsersRound } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

const PAGE_SIZE = 25;

type DiscoverFilter = 'all' | 'visible' | 'hidden';

export default function AdminCommunitiesPage() {
  const router = useRouter();
  const [communities, setCommunities] = useState<AdminCommunityRow[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [discoverFilter, setDiscoverFilter] = useState<DiscoverFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [togglingFeaturedId, setTogglingFeaturedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setOffset(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setOffset(0);
  }, [discoverFilter]);

  const loadCommunities = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const page = await api.admin.communities.list({
        limit: PAGE_SIZE,
        offset,
        search: search || undefined,
        discoverHidden:
          discoverFilter === 'all'
            ? undefined
            : discoverFilter === 'hidden',
      });
      setCommunities(page.items);
      setTotal(page.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load communities');
      setCommunities([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [discoverFilter, offset, search]);

  useEffect(() => {
    void loadCommunities();
  }, [loadCommunities]);

  async function toggleFeatured(community: AdminCommunityRow, event: React.MouseEvent) {
    event.stopPropagation();
    setTogglingFeaturedId(community.id);

    try {
      const updated = community.featured
        ? await api.admin.communities.unfeature(community.id)
        : await api.admin.communities.feature(community.id);
      setCommunities((current) =>
        current.map((row) => (row.id === updated.id ? updated : row)),
      );
      toast.success(updated.featured ? 'Community featured' : 'Community unfeatured');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to update featured status');
    } finally {
      setTogglingFeaturedId(null);
    }
  }

  const page = Math.floor(offset / PAGE_SIZE) + 1;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = offset > 0;
  const canNext = offset + PAGE_SIZE < total;

  return (
    <PageBody>
      <PageHeader
        eyebrow="Administration"
        title="Communities"
        description="Moderate communities, posts, and discover visibility."
        className="border-none pb-0"
      />

      <Card className="gap-0 overflow-hidden">
        <CardHeader className="flex flex-col gap-4 border-b border-border/60 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base font-semibold">All communities</CardTitle>
          <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search by name"
                className="pl-9"
                aria-label="Search communities by name"
              />
            </div>
            <Select
              value={discoverFilter}
              onValueChange={(value) => setDiscoverFilter(value as DiscoverFilter)}
            >
              <SelectTrigger className="w-full sm:w-[10rem]" aria-label="Filter discover visibility">
                <SelectValue placeholder="Discover" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="visible">On discover</SelectItem>
                <SelectItem value="hidden">Hidden</SelectItem>
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
                icon={UsersRound}
                title="Could not load communities"
                message={error}
              />
            </div>
          ) : communities.length === 0 ? (
            <div className={cardTableStatePaddingClass}>
              <EmptyState
                variant="embedded"
                icon={UsersRound}
                title="No communities found"
                message={search ? 'Try a different search.' : 'No communities match this filter.'}
              />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Name</TableHead>
                    <TableHead>Creator</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Posts</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Discover</TableHead>
                    <TableHead>Updated</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {communities.map((community) => (
                    <TableRow
                      key={community.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/admin/communities/${community.id}`)}
                    >
                      <TableCell className="font-medium">{community.name}</TableCell>
                      <TableCell className="text-muted-foreground">{community.creatorEmail}</TableCell>
                      <TableCell>{community.memberCount}</TableCell>
                      <TableCell>{community.postCount}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={community.featured ? 'Unfeature community' : 'Feature community'}
                          disabled={togglingFeaturedId === community.id}
                          onClick={(event) => void toggleFeatured(community, event)}
                        >
                          <Star
                            className={cn(
                              'h-4 w-4',
                              community.featured
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-muted-foreground',
                            )}
                          />
                        </Button>
                      </TableCell>
                      <TableCell>
                        {community.discoverHiddenAt ? (
                          <Badge variant="secondary">Hidden</Badge>
                        ) : (
                          <Badge variant="success">Visible</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(community.updatedAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <CardTableFooter>
                <p className="text-sm text-muted-foreground">
                  {total} communit{total === 1 ? 'y' : 'ies'}
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
