import type { PlatformFeature } from '@/lib/features';

export interface UserFeaturesStatus {
  active: boolean;
  provider: 'mock' | 'polar';
  status: string;
  features: PlatformFeature[];
  productId?: string | null;
  currentPeriodEnd?: string | null;
  polarCustomerId?: string | null;
}

/** @deprecated Use UserFeaturesStatus — retained for deprecated /billing/entitlements alias. */
export interface EntitlementGrant {
  id: string;
  benefitId: string;
  grantedAt: string;
  slug?: string | null;
}

/** @deprecated Use UserFeaturesStatus */
export interface EntitlementsStatus {
  active: boolean;
  provider: 'mock' | 'polar';
  status: string;
  entitlements: EntitlementGrant[];
  entitlementSlugs: string[];
  productId?: string | null;
  currentPeriodEnd?: string | null;
  polarCustomerId?: string | null;
}

export interface SubscriptionStatus extends UserFeaturesStatus {}

export interface InvoiceRow {
  id: string;
  createdAt: string;
  amount: number;
  currency: string;
  status: string;
  invoiceNumber?: string;
  invoiceUrl?: string;
}

export interface InvoicesPage {
  items: InvoiceRow[];
  provider: 'mock' | 'polar';
}

export interface BillingUrlResponse {
  url: string;
}
