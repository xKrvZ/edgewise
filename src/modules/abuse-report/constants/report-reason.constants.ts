import { PUNISHMENT_REASONS, PunishmentReason } from '../../punishment/constants/punishment-reason.constants';

/**
 * Report reasons that can be used when creating an abuse report.
 * Includes all punishment reasons except 'OTHER' and 'ABUSE_REPORT_ACCEPTED'.
 */
export const REPORT_REASONS = PUNISHMENT_REASONS.filter(
  (reason) => reason !== 'OTHER' && reason !== 'ABUSE_REPORT_ACCEPTED',
) as readonly Exclude<PunishmentReason, 'OTHER' | 'ABUSE_REPORT_ACCEPTED'>[];

export type ReportReason = (typeof REPORT_REASONS)[number];
