export const COMMUNITY_MEMBER_ROLES = ['owner', 'mentor', 'member'] as const;
export type CommunityMemberRole = (typeof COMMUNITY_MEMBER_ROLES)[number];

export const COMMUNITY_JOIN_POLICIES = ['public', 'invite_only'] as const;
export type CommunityJoinPolicy = (typeof COMMUNITY_JOIN_POLICIES)[number];

export const COMMUNITY_LEADERBOARD_VISIBILITY = ['public', 'members', 'mentors'] as const;
export type CommunityLeaderboardVisibility =
  (typeof COMMUNITY_LEADERBOARD_VISIBILITY)[number];

export const INVITATION_ROLES = ['mentor', 'member'] as const;
export type InvitationRole = (typeof INVITATION_ROLES)[number];

export const INVITATION_STATUSES = ['pending', 'accepted', 'rejected', 'expired'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

export const LEADERBOARD_DEFAULT_DAYS = 30;

export const MAX_COMMUNITY_LOGO_BYTES = 2 * 1024 * 1024;
export const MAX_COMMUNITY_HEADER_BYTES = 5 * 1024 * 1024;

export const COMMUNITY_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/avif',
] as const;

export const COMMUNITY_POST_TITLE_MAX_LENGTH = 200;
export const COMMUNITY_POST_CONTENT_MAX_LENGTH = 50_000;

export const COMMUNITY_POST_VISIBILITY = ['public', 'private'] as const;
export type CommunityPostVisibility = (typeof COMMUNITY_POST_VISIBILITY)[number];

export const COMMUNITY_POST_COMMENT_MAX_BODY_LENGTH = 2000;

export const COMMUNITY_POST_COMMENT_REACTION_TYPES = ['like', 'dislike'] as const;
export type CommunityPostCommentReactionType =
  (typeof COMMUNITY_POST_COMMENT_REACTION_TYPES)[number];

export const MAX_COMMUNITY_POST_HEADER_BYTES = 5 * 1024 * 1024;
export const MAX_COMMUNITY_POST_CONTENT_IMAGE_BYTES = 5 * 1024 * 1024;

export const COMMUNITY_PLAYBOOK_TEMPLATE_VISIBILITY = ['public', 'members_only'] as const;
export type CommunityPlaybookTemplateVisibility =
  (typeof COMMUNITY_PLAYBOOK_TEMPLATE_VISIBILITY)[number];

export const COMMUNITY_PLAYBOOK_TEMPLATE_NAME_MAX_LENGTH = 120;
export const COMMUNITY_PLAYBOOK_TEMPLATE_CHECKLIST_ITEM_MAX_LENGTH = 280;
