export const LIFT_REASONS = [
  'INCONCLUSIVE_EVIDENCE',
  'FALSE_POSITIVE',
  'MISIDENTIFICATION',
  'ISSUED_IN_ERROR',
  'POLICY_CHANGE',
  'NO_PRIOR_WARNING',
  'INTERNAL_REVIEW_DISAGREEMENT',
  'ISSUED_EXCESSIVELY',
  'ACKNOWLEDGED_REFORMED',
  'ACCOUNT_COMPROMISED',
  'APPEAL_ACCEPTED',
  'OTHER',
] as const;

export type LiftReason = (typeof LIFT_REASONS)[number];

/**
 * Lift reasons that can be manually selected when lifting a punishment via the API.
 * Excludes 'APPEAL_ACCEPTED' which is automatically set when an appeal is accepted.
 */
export const MANUAL_LIFT_REASONS = LIFT_REASONS.filter(
  (reason) => reason !== 'APPEAL_ACCEPTED',
) as readonly Exclude<LiftReason, 'APPEAL_ACCEPTED'>[];

export type ManualLiftReason = (typeof MANUAL_LIFT_REASONS)[number];
