'use client';

import { CommunityPostOverviewCard } from '@/components/community/community-post-overview-card';
import { CommunityPostTable } from '@/components/community/community-post-table';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/auth-client';
import type { CommunityMemberRole, CommunityPostSummary } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FileText, LayoutGrid, Plus, Table2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const MENTOR_ROLES: CommunityMemberRole[] = ['owner', 'mentor'];

type PostListView = 'cards' | 'table';

interface CommunityPostListProps {
  communityId: string;
  posts: CommunityPostSummary[];
  myRole: CommunityMemberRole;
}

function PostListViewToggle({
  view,
  onChange,
}: {
  view: PostListView;
  onChange: (view: PostListView) => void;
}) {
  const options: { value: PostListView; label: string; icon: typeof LayoutGrid }[] = [
    { value: 'cards', label: 'Cards', icon: LayoutGrid },
    { value: 'table', label: 'Table', icon: Table2 },
  ];

  return (
    <div
      role="group"
      aria-label="Posts view"
      className="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/60 p-1"
    >
      {options.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          type="button"
          variant="ghost"
          size="sm"
          aria-pressed={view === value}
          className={cn(
            'h-7 gap-1.5 rounded-md px-2.5 text-xs font-medium',
            view === value
              ? 'bg-card text-foreground shadow-xs'
              : 'text-muted-foreground hover:text-foreground',
          )}
          onClick={() => onChange(value)}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {label}
        </Button>
      ))}
    </div>
  );
}

export function CommunityPostList({ communityId, posts, myRole }: CommunityPostListProps) {
  const { data: session } = useSession();
  const canCreate = MENTOR_ROLES.includes(myRole);
  const isCommunityOwner = myRole === 'owner';
  const basePath = `/community/${communityId}/posts`;
  const [view, setView] = useState<PostListView>('cards');

  if (posts.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No posts yet"
        message={
          canCreate
            ? 'Share updates, lessons, and recaps with your community.'
            : 'Posts from mentors and owners will appear here.'
        }
        action={
          canCreate ? (
            <Button asChild>
              <Link href={`${basePath}/new`}>
                <Plus className="mr-2 h-4 w-4" />
                Write a post
              </Link>
            </Button>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PostListViewToggle view={view} onChange={setView} />
        {canCreate ? (
          <Button asChild size="sm">
            <Link href={`${basePath}/new`}>
              <Plus className="mr-2 h-4 w-4" />
              Write a post
            </Link>
          </Button>
        ) : null}
      </div>

      {view === 'cards' ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {posts.map((post) => (
            <CommunityPostOverviewCard key={post.id} communityId={communityId} post={post} />
          ))}
        </div>
      ) : (
        <CommunityPostTable
          communityId={communityId}
          posts={posts}
          currentUserId={session?.user?.id}
          isCommunityOwner={isCommunityOwner}
        />
      )}
    </div>
  );
}
