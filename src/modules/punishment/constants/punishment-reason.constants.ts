export const PUNISHMENT_REASONS = [
  'CHEATING',
  'BUG_ABUSE',
  'HARASSMENT_BULLYING_OR_TARGETTED_ABUSE',
  'HATE_SPEECH_SLURS_OR_BAD_LANGUAGE',
  'CHAT_SPAMMING',
  'IMPERSONATING_STAFF',
  'SCAMMING',
  'BAN_EVASION',
  'ACCOUNT_SHARING',
  'INAPPROPRIATE_NAME_OR_COSMETIC',
  'BREAKING_ECONOMY',
  'ABUSE_REPORT_ACCEPTED',
  'OTHER',
] as const;

export type PunishmentReason = (typeof PUNISHMENT_REASONS)[number];

/**
 * Punishment reasons that can be manually selected when creating a punishment via the API.
 * Excludes 'ABUSE_REPORT_ACCEPTED' which is automatically set when a punishment is created from an abuse report.
 */
export const MANUAL_PUNISHMENT_REASONS = PUNISHMENT_REASONS.filter(
  (reason) => reason !== 'ABUSE_REPORT_ACCEPTED',
) as readonly Exclude<PunishmentReason, 'ABUSE_REPORT_ACCEPTED'>[];

export type ManualPunishmentReason = (typeof MANUAL_PUNISHMENT_REASONS)[number];
