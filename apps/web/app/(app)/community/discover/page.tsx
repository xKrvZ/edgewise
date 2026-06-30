'use client';

import { CommunityCard, CommunityCardSkeleton } from '@/components/community/community-card';
import { FeatureAnalyticsTracker } from '@/components/analytics/feature-analytics-tracker';
import { COMMUNITY_LIST_GRID_CLASS } from '@/components/community/community-list-shell';
import { useCommunityListContext } from '@/components/community/community-list-context';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/shared/empty-state';
import { useQuery } from '@/lib/hooks/use-query';
import { api } from '@/lib/api-client';
import { Compass, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

export default function DiscoverCommunitiesPage() {
  const { discoverCommunities, isLoading: contextLoading, refetchAll } = useCommunityListContext();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const hasFilters = featuredOnly || search.length > 0;

  const filteredQuery = useQuery(
    () =>
      api.communities.list({
        featured: featuredOnly || undefined,
        search: search || undefined,
      }),
    [featuredOnly, search],
    { enabled: hasFilters },
  );

  const communities = useMemo(() => {
    const source = hasFilters ? (filteredQuery.data ?? []) : discoverCommunities;
    return [...source]
      .filter((community) => community.myRole === null)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [discoverCommunities, filteredQuery.data, hasFilters]);

  const isLoading = hasFilters ? filteredQuery.isLoading : contextLoading;

  function handleJoined() {
    refetchAll();
    if (hasFilters) {
      filteredQuery.refetch();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <FeatureAnalyticsTracker feature="community" action="discover" />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search communities…"
            className="pl-9"
            aria-label="Search communities"
          />
        </div>
        <Label className="flex h-9 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-3 text-sm font-medium shadow-xs">
          <Checkbox
            checked={featuredOnly}
            onCheckedChange={(checked) => setFeaturedOnly(checked === true)}
            aria-label="Featured only"
          />
          <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />
          Featured only
        </Label>
      </div>

      {isLoading ? (
        <div className={COMMUNITY_LIST_GRID_CLASS}>
          {(['a', 'b', 'c'] as const).map((key) => (
            <CommunityCardSkeleton key={key} />
          ))}
        </div>
      ) : communities.length === 0 ? (
        <EmptyState
          icon={Compass}
          title={hasFilters ? 'No matching communities' : 'Nothing to discover'}
          message={
            hasFilters
              ? featuredOnly && search
                ? 'No featured communities match your search. Try different keywords or turn off a filter.'
                : featuredOnly
                  ? 'No featured communities are available to join right now.'
                  : 'No communities match your search. Try different keywords.'
              : "You're already in every available community, or none are open to join right now."
          }
        />
      ) : (
        <div className={COMMUNITY_LIST_GRID_CLASS}>
          {communities.map((community) => (
            <CommunityCard key={community.id} community={community} onJoined={handleJoined} />
          ))}
        </div>
      )}
    </div>
  );
}
