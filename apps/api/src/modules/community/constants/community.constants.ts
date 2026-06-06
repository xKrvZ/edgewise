export const COMMUNITY_MEMBER_ROLES = ['owner', 'mentor', 'member'] as const;
export type CommunityMemberRole = (typeof COMMUNITY_MEMBER_ROLES)[number];

export const INVITATION_ROLES = ['mentor', 'member'] as const;
export type InvitationRole = (typeof INVITATION_ROLES)[number];

export const INVITATION_STATUSES = ['pending', 'accepted', 'rejected', 'expired'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const LEADERBOARD_DEFAULT_DAYS = 30;
