import type {
  CommunityDetail,
  CommunityLeaderboardVisibility,
  CommunityMemberRole,
} from '@/lib/types';

const MENTOR_ROLES: CommunityMemberRole[] = ['owner', 'mentor'];

export function getLeaderboardVisibility(
  community: Pick<CommunityDetail, 'leaderboardVisibility'>,
): CommunityLeaderboardVisibility {
  return community.leaderboardVisibility ?? 'mentors';
}

export function canViewLeaderboard(
  community: Pick<CommunityDetail, 'leaderboardVisibility'>,
  myRole: CommunityMemberRole | null,
): boolean {
  const visibility = getLeaderboardVisibility(community);

  if (visibility === 'public') {
    return true;
  }

  if (!myRole) {
    return false;
  }

  if (visibility === 'members') {
    return true;
  }

  return MENTOR_ROLES.includes(myRole);
}

export function canFetchLeaderboard(
  community: Pick<CommunityDetail, 'leaderboardVisibility'>,
  myRole: CommunityMemberRole | null,
): boolean {
  return canViewLeaderboard(community, myRole);
}

export const LEADERBOARD_VISIBILITY_LABELS: Record<CommunityLeaderboardVisibility, string> = {
  public: 'Public',
  members: 'Members only',
  mentors: 'Mentors only',
};

export const LEADERBOARD_VISIBILITY_HELP: Record<CommunityLeaderboardVisibility, string> = {
  public: 'Anyone viewing this community can see performance rankings.',
  members: 'Only community members can see the leaderboard.',
  mentors: 'Only community owners and mentors can see the leaderboard.',
};
