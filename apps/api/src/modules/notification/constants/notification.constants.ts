export const NOTIFICATION_TYPES = ['comment', 'reply'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
