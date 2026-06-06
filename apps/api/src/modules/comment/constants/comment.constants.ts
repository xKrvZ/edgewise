export const COMMENT_TARGET_TYPES = ['trade', 'playbook'] as const;
export type CommentTargetType = (typeof COMMENT_TARGET_TYPES)[number];

export const COMMENT_MAX_BODY_LENGTH = 2000;
