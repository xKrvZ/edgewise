'use client';

import type { CommunityMember, CommunityMemberRole } from '@/lib/types';

export function canModerateCommunityMember(
  myRole: CommunityMemberRole,
  myUserId: string | undefined,
  member: Pick<CommunityMember, 'userId' | 'role'>,
): boolean {
  if (!myUserId || !['owner', 'mentor'].includes(myRole)) {
    return false;
  }

  if (member.userId === myUserId) {
    return false;
  }

  if (member.role === 'owner') {
    return false;
  }

  if (myRole === 'mentor' && member.role !== 'member') {
    return false;
  }

  return true;
}
