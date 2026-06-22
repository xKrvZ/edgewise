export type BillingPlanId = 'starter' | 'pro' | 'elite' | 'none';

export const BILLING_PLAN_LABELS: Record<BillingPlanId, string> = {
  starter: 'Starter',
  pro: 'Pro',
  elite: 'Elite',
  none: 'No plan',
};

export function formatPlanLabel(planId: BillingPlanId | undefined | null): string | undefined {
  if (!planId || planId === 'none') {
    return undefined;
  }
  return BILLING_PLAN_LABELS[planId];
}

/** Whether the user's plan allows creating new communities (Elite only). */
export function canCreateCommunity(planId: BillingPlanId | undefined | null): boolean {
  return planId === 'elite';
}
