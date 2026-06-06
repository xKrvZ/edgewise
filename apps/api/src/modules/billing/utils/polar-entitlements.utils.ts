type BenefitGrantLike = {
  id?: string;
  benefitId?: string;
  grantedAt?: Date | string;
  benefitMetadata?: Record<string, unknown>;
};

type SubscriptionLike = {
  status?: string;
  productId?: string;
  currentPeriodEnd?: Date | string | null;
};

type CustomerStateLike = {
  id?: string;
  grantedBenefits?: BenefitGrantLike[];
  activeSubscriptions?: SubscriptionLike[];
};

export function asCustomerStateLike(state: unknown): CustomerStateLike | null {
  if (!state || typeof state !== 'object') {
    return null;
  }
  return state as CustomerStateLike;
}

export function benefitMatchesEntitlementSlug(
  grant: BenefitGrantLike,
  slug: string,
): boolean {
  const metadata = grant.benefitMetadata ?? {};
  const candidates = [
    metadata.slug,
    metadata.feature,
    metadata.entitlement,
    metadata.name,
  ];
  const normalized = slug.toLowerCase();
  return candidates.some(
    (value) => typeof value === 'string' && value.toLowerCase() === normalized,
  );
}

/**
 * Polar entitlements are represented as granted benefit grants on customer state.
 * When no explicit benefits exist, an active subscription is treated as access.
 */
export function hasEntitlementAccess(
  state: CustomerStateLike | unknown,
  entitlementSlug?: string | null,
): boolean {
  const record = asCustomerStateLike(state);
  if (!record) {
    return false;
  }

  const grantedBenefits = record.grantedBenefits ?? [];
  if (grantedBenefits.length > 0) {
    if (!entitlementSlug) {
      return true;
    }
    return grantedBenefits.some((grant) =>
      benefitMatchesEntitlementSlug(grant, entitlementSlug),
    );
  }

  return (record.activeSubscriptions?.length ?? 0) > 0;
}

export function extractEntitlementSlugs(state: CustomerStateLike): string[] {
  const slugs = new Set<string>();
  for (const grant of state.grantedBenefits ?? []) {
    const metadata = grant.benefitMetadata ?? {};
    for (const key of ['slug', 'feature', 'entitlement', 'name'] as const) {
      const value = metadata[key];
      if (typeof value === 'string' && value.trim()) {
        slugs.add(value);
      }
    }
  }
  if (slugs.size === 0 && (state.activeSubscriptions?.length ?? 0) > 0) {
    slugs.add('subscription');
  }
  return [...slugs];
}

export function primarySubscription(state: CustomerStateLike): SubscriptionLike | null {
  return state.activeSubscriptions?.[0] ?? null;
}
