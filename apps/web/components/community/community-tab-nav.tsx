'use client';

import { CommunityLeaveConsentDialog } from '@/components/community/community-leave-consent-dialog';
import { useCommunityDetail } from '@/components/community/community-detail-context';
import { canViewLeaderboard } from '@/components/community/community-leaderboard.util';
import { useCommunityLeave } from '@/components/community/use-community-leave';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CommunityLeaderboardVisibility, CommunityMemberRole } from '@/lib/types';
import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';

interface CommunityTabNavProps {
  communityId: string;
  myRole: CommunityMemberRole | null;
  leaderboardVisibility: CommunityLeaderboardVisibility;
}

type TabId = 'overview' | 'leaderboard' | 'members' | 'posts' | 'playbooks' | 'settings';

const TAB_LABELS: Record<TabId, string> = {
  overview: 'Overview',
  leaderboard: 'Leaderboard',
  members: 'Members',
  posts: 'Posts',
  playbooks: 'Playbooks',
  settings: 'Settings',
};

function resolveActiveTab(pathname: string, basePath: string): TabId {
  if (pathname === `${basePath}/leaderboard`) {
    return 'leaderboard';
  }

  if (pathname === `${basePath}/members` || pathname.startsWith(`${basePath}/members/`)) {
    return 'members';
  }

  if (pathname === `${basePath}/posts`) {
    return 'posts';
  }

  if (pathname === `${basePath}/playbooks`) {
    return 'playbooks';
  }

  if (pathname === `${basePath}/settings`) {
    return 'settings';
  }

  return 'overview';
}

export function CommunityTabNav({
  communityId,
  myRole,
  leaderboardVisibility,
}: CommunityTabNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { community } = useCommunityDetail();
  const leave = useCommunityLeave();
  const basePath = `/community/${communityId}`;
  const activeTab = resolveActiveTab(pathname, basePath);
  const isMember = myRole !== null;
  const isOwner = myRole === 'owner';
  const isModerator = myRole === 'owner' || myRole === 'mentor';
  const canLeave = isMember && !isOwner;
  const showLeaderboard = canViewLeaderboard({ leaderboardVisibility }, myRole);

  const tabs = useMemo(() => {
    const items: { id: TabId; href: string; label: string }[] = [
      { id: 'overview', href: basePath, label: TAB_LABELS.overview },
      { id: 'playbooks', href: `${basePath}/playbooks`, label: TAB_LABELS.playbooks },
    ];

    if (isMember) {
      items.push({ id: 'posts', href: `${basePath}/posts`, label: TAB_LABELS.posts });
    }

    if (showLeaderboard) {
      items.push({
        id: 'leaderboard',
        href: `${basePath}/leaderboard`,
        label: TAB_LABELS.leaderboard,
      });
    }

    if (isMember) {
      items.push({ id: 'members', href: `${basePath}/members`, label: TAB_LABELS.members });
    }

    if (isModerator) {
      items.push({ id: 'settings', href: `${basePath}/settings`, label: TAB_LABELS.settings });
    }

    return items;
  }, [basePath, isMember, isModerator, showLeaderboard]);

  const selectValue = tabs.some((tab) => tab.id === activeTab) ? activeTab : 'overview';

  const handleTabChange = (value: string) => {
    const tab = tabs.find((t) => t.id === value);
    if (tab && tab.id !== selectValue) {
      router.push(tab.href);
    }
  };

  const openLeaveDialog = () => {
    leave.openLeaveDialog({
      communityId: community.id,
      communityName: community.name,
      logoUrl: community.logoUrl,
    });
  };

  if (tabs.length <= 1 && !canLeave) {
    return null;
  }

  return (
    <>
      <div className="mt-4 w-full">
        <div className="space-y-2 sm:hidden">
          {tabs.length > 1 ? (
            <Select value={selectValue} onValueChange={handleTabChange}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tabs.map((tab) => (
                  <SelectItem key={tab.id} value={tab.id}>
                    {tab.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : null}

          {canLeave ? (
            <Button
              type="button"
              variant="destructive"
              className="h-9 w-full"
              onClick={openLeaveDialog}
            >
              <LogOut className="h-4 w-4" />
              Leave community
            </Button>
          ) : null}
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {tabs.length > 1 ? (
            <Tabs value={selectValue} className="w-fit">
              <TabsList className="h-auto w-fit max-w-full justify-start gap-1 p-1">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} asChild className="px-3.5 py-1.5">
                    <Link href={tab.href}>{tab.label}</Link>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : null}

          {canLeave ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="h-9 shrink-0"
              onClick={openLeaveDialog}
            >
              <LogOut className="h-4 w-4" />
              Leave community
            </Button>
          ) : null}
        </div>
      </div>

      <CommunityLeaveConsentDialog
        open={leave.open}
        onOpenChange={leave.setOpen}
        community={leave.community}
        confirming={leave.leaving}
        onConfirm={leave.handleLeave}
      />
    </>
  );
}
