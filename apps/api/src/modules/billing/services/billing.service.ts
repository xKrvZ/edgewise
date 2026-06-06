import { Injectable, Logger } from '@nestjs/common';
import { createPolarClient } from '@/auth/polar.plugin';
import billingConfig from '@/config/billing.config';
import { DEFAULT_ACCESS_FEATURE } from '../constants/features.constants';
import type { UserFeaturesDto } from '../dtos/user-features.dto';
import type { EntitlementsDto } from '../dtos/entitlements.dto';
import type { InvoiceRowDto, InvoicesPageDto } from '../dtos/invoice.dto';
import { SubscriptionDao } from '../daos/subscription.dao';
import { FeatureAccessService } from './feature-access.service';
import {
  asCustomerStateLike,
  extractEntitlementSlugs,
  primarySubscription,
} from '../utils/polar-entitlements.utils';

type PolarOrderLike = {
  id: string;
  createdAt: Date;
  totalAmount: number;
  currency: string;
  status: string;
  invoiceNumber: string | null;
  isInvoiceGenerated: boolean;
};

const MOCK_INVOICES: InvoiceRowDto[] = [
  {
    id: 'mock-invoice-1',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 2900,
    currency: 'usd',
    status: 'paid',
    invoiceNumber: 'INV-MOCK-0001',
  },
  {
    id: 'mock-invoice-2',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 2900,
    currency: 'usd',
    status: 'paid',
    invoiceNumber: 'INV-MOCK-0002',
  },
];

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly refundedMockOrderIds = new Set<string>();

  constructor(
    private readonly subscriptionDao: SubscriptionDao,
    private readonly featureAccess: FeatureAccessService,
  ) {}

  isMockMode(): boolean {
    return this.featureAccess.isMockMode();
  }

  async hasActiveSubscription(userId: string, email?: string | null): Promise<boolean> {
    return this.featureAccess.hasPlatformAccess(userId, email);
  }

  async getFeatures(userId: string, email?: string | null): Promise<UserFeaturesDto> {
    const provider = this.featureAccess.getProviderKind();
    const features = await this.featureAccess.listFeatures(userId, email);
    const active = features.includes(DEFAULT_ACCESS_FEATURE);

    if (this.isMockMode()) {
      const stored = await this.subscriptionDao.findByUserId(userId);
      return {
        active,
        provider,
        status: active ? 'active' : 'inactive',
        features,
        productId: billingConfig.polar.productId || null,
        currentPeriodEnd: stored?.currentPeriodEnd?.toISOString() ?? null,
        polarCustomerId: null,
      };
    }

    const state = await this.fetchCustomerState(userId);
    const record = asCustomerStateLike(state);
    if (!record) {
      return {
        active: email === billingConfig.demoUserEmail,
        provider,
        status: 'inactive',
        features,
        productId: null,
        currentPeriodEnd: null,
        polarCustomerId: null,
      };
    }

    const subscription = primarySubscription(record);
    const periodEnd = subscription?.currentPeriodEnd;

    return {
      active,
      provider,
      status: active ? (subscription?.status ?? 'active') : 'inactive',
      features,
      productId: subscription?.productId ?? null,
      currentPeriodEnd:
        periodEnd instanceof Date
          ? periodEnd.toISOString()
          : typeof periodEnd === 'string'
            ? periodEnd
            : null,
      polarCustomerId: record.id ?? null,
    };
  }

  /** @deprecated Use getFeatures — retained for backward-compatible API alias. */
  async getEntitlements(userId: string, email?: string | null): Promise<EntitlementsDto> {
    const userFeatures = await this.getFeatures(userId, email);
    const polarSlugs = userFeatures.features.map(
      (feature) => billingConfig.featureToPolarSlug[feature],
    );

    if (this.isMockMode()) {
      return {
        active: userFeatures.active,
        provider: userFeatures.provider,
        status: userFeatures.status,
        entitlements: userFeatures.active
          ? polarSlugs.map((slug, index) => ({
              id: `mock-feature-${index}`,
              benefitId: `mock-benefit-${slug}`,
              grantedAt: new Date().toISOString(),
              slug,
            }))
          : [],
        entitlementSlugs: polarSlugs,
        productId: userFeatures.productId,
        currentPeriodEnd: userFeatures.currentPeriodEnd,
        polarCustomerId: userFeatures.polarCustomerId,
      };
    }

    const state = await this.fetchCustomerState(userId);
    const record = asCustomerStateLike(state);
    const grantedBenefits = record?.grantedBenefits ?? [];

    return {
      active: userFeatures.active,
      provider: userFeatures.provider,
      status: userFeatures.status,
      entitlements: grantedBenefits.map((grant) => ({
        id: grant.id ?? '',
        benefitId: grant.benefitId ?? '',
        grantedAt:
          grant.grantedAt instanceof Date
            ? grant.grantedAt.toISOString()
            : typeof grant.grantedAt === 'string'
              ? grant.grantedAt
              : new Date().toISOString(),
        slug:
          (typeof grant.benefitMetadata?.slug === 'string' && grant.benefitMetadata.slug) ||
          (typeof grant.benefitMetadata?.feature === 'string' && grant.benefitMetadata.feature) ||
          (typeof grant.benefitMetadata?.entitlement === 'string' &&
            grant.benefitMetadata.entitlement) ||
          null,
      })),
      entitlementSlugs: record ? extractEntitlementSlugs(record) : polarSlugs,
      productId: userFeatures.productId,
      currentPeriodEnd: userFeatures.currentPeriodEnd,
      polarCustomerId: userFeatures.polarCustomerId,
    };
  }

  refundMockOrder(orderId: string): InvoiceRowDto | null {
    const invoice = MOCK_INVOICES.find((row) => row.id === orderId);
    if (!invoice) {
      return null;
    }

    this.refundedMockOrderIds.add(orderId);
    return { ...invoice, status: 'refunded' };
  }

  isMockOrderRefunded(orderId: string): boolean {
    return this.refundedMockOrderIds.has(orderId);
  }

  async listInvoices(userId: string): Promise<InvoicesPageDto> {
    if (this.isMockMode()) {
      return {
        provider: 'mock',
        items: MOCK_INVOICES.map((invoice) =>
          this.refundedMockOrderIds.has(invoice.id)
            ? { ...invoice, status: 'refunded' }
            : invoice,
        ),
      };
    }

    const polarClient = createPolarClient();
    if (!polarClient) {
      return { provider: 'polar', items: [] };
    }

    try {
      const orders = await this.fetchOrdersForCustomer(polarClient, userId);
      const items = await Promise.all(
        orders.map((order) => this.mapOrderToInvoiceRow(polarClient, order)),
      );
      return { provider: 'polar', items };
    } catch (error) {
      this.logger.debug(
        `Polar invoices unavailable for user ${userId}: ${error instanceof Error ? error.message : error}`,
      );
      return { provider: 'polar', items: [] };
    }
  }

  async fetchCustomerState(userId: string): Promise<unknown | null> {
    const polarClient = createPolarClient();
    if (!polarClient) {
      return null;
    }

    try {
      return await polarClient.customers.getStateExternal({ externalId: userId });
    } catch (error) {
      this.logger.debug(
        `Polar customer state unavailable for user ${userId}: ${error instanceof Error ? error.message : error}`,
      );
      return null;
    }
  }

  private async fetchOrdersForCustomer(
    polarClient: NonNullable<ReturnType<typeof createPolarClient>>,
    userId: string,
  ): Promise<PolarOrderLike[]> {
    const request = {
      externalCustomerId: userId,
      limit: 50,
      sorting: ['-created_at' as const],
      ...(billingConfig.polar.organizationId
        ? { organizationId: [billingConfig.polar.organizationId] }
        : {}),
    };

    const iterator = await polarClient.orders.list(request);
    const orders: PolarOrderLike[] = [];

    for await (const page of iterator) {
      orders.push(...page.result.items);
    }

    return orders;
  }

  private async mapOrderToInvoiceRow(
    polarClient: NonNullable<ReturnType<typeof createPolarClient>>,
    order: PolarOrderLike,
  ): Promise<InvoiceRowDto> {
    let invoiceUrl: string | undefined;

    if (order.isInvoiceGenerated) {
      try {
        const invoice = await polarClient.orders.invoice({ id: order.id });
        invoiceUrl = invoice.url;
      } catch (error) {
        this.logger.debug(
          `Invoice URL unavailable for order ${order.id}: ${error instanceof Error ? error.message : error}`,
        );
      }
    }

    return {
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      amount: order.totalAmount,
      currency: order.currency,
      status: order.status,
      invoiceNumber: order.invoiceNumber ?? undefined,
      invoiceUrl,
    };
  }
}
