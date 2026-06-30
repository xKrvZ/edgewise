import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Polar } from '@polar-sh/sdk';
import { createPolarClient } from '@/auth/polar.plugin';
import billingConfig from '@/config/billing.config';
import { SubscriptionDao } from '@/modules/billing/daos/subscription.dao';
import { BillingService } from '@/modules/billing/services/billing.service';
import {
  asCustomerStateLike,
  primarySubscription,
} from '@/modules/billing/utils/polar-entitlements.utils';
import { PlatformAuditService } from '@/modules/platform-metrics/services/platform-audit.service';
import type { AdminUserRecord } from '../daos/admin.dao';
import { AdminDao } from '../daos/admin.dao';
import type {
  AdminCancelSubscriptionDto,
  AdminChangePlanDto,
  AdminPlanDto,
  AdminRefundOrderDto,
  AdminRefundResultDto,
  AdminSubscriptionDetailDto,
  AdminSubscriptionRowDto,
  AdminSubscriptionsQueryDto,
  AdminSubscriptionsPageDto,
} from '../dtos/admin-billing.dto';

const MOCK_PLANS: AdminPlanDto[] = [
  {
    id: 'starter',
    name: 'Starter',
    slug: 'starter',
    productId: 'mock-starter',
  },
  {
    id: 'pro',
    name: 'Pro',
    slug: 'pro',
    productId: billingConfig.polar.productId || 'mock-pro',
  },
  {
    id: 'elite',
    name: 'Elite',
    slug: 'elite',
    productId: 'mock-elite',
  },
];

type PolarSubscriptionLike = {
  id?: string;
  status?: string;
  productId?: string;
  currentPeriodEnd?: Date | string | null;
  cancelAtPeriodEnd?: boolean;
};

@Injectable()
export class AdminBillingService {
  private readonly logger = new Logger(AdminBillingService.name);
  private readonly mockCancelAtPeriodEndUserIds = new Set<string>();

  constructor(
    private readonly adminDao: AdminDao,
    private readonly billingService: BillingService,
    private readonly subscriptionDao: SubscriptionDao,
    private readonly platformAuditService: PlatformAuditService,
  ) {}

  async getSubscription(userId: string): Promise<AdminSubscriptionDetailDto> {
    const user = await this.requireUser(userId);
    return this.buildSubscriptionDetail(user);
  }

  async listPlans(): Promise<AdminPlanDto[]> {
    if (this.billingService.isMockMode()) {
      return MOCK_PLANS;
    }

    const polarClient = this.requirePolarClient();
    return this.fetchPolarPlans(polarClient);
  }

  async changePlan(
    userId: string,
    body: AdminChangePlanDto,
    actorUserId: string,
  ): Promise<AdminSubscriptionDetailDto> {
    if (!body.productId && !body.planSlug) {
      throw new BadRequestException('productId or planSlug is required');
    }

    const user = await this.requireUser(userId);
    const previousPlan = this.resolvePlanLabel(user);
    const excludeBilling = body.excludeBilling ?? false;

    if (this.billingService.isMockMode() || excludeBilling) {
      const adminPlanOverride = excludeBilling && !this.billingService.isMockMode();
      const { planName, productId } = await this.applyLocalPlanChange(
        userId,
        user,
        body,
        adminPlanOverride,
      );

      await this.platformAuditService.recordAdminSubscriptionPlanChanged({
        actorUserId,
        userId,
        previousPlan,
        newPlan: planName,
        productId,
        excludeBilling,
      });

      return this.buildSubscriptionDetail(await this.requireUser(userId));
    }

    const polarClient = this.requirePolarClient();
    const subscriptionId = await this.resolvePolarSubscriptionId(user, polarClient);
    const productId = await this.resolveTargetProductId(body, polarClient);

    await polarClient.subscriptions.update({
      id: subscriptionId,
      subscriptionUpdate: { productId },
    });

    await this.syncPolarSubscription(userId, polarClient, false);

    const plans = await this.fetchPolarPlans(polarClient);
    const newPlan =
      plans.find((plan) => plan.productId === productId)?.name ?? productId;

    await this.platformAuditService.recordAdminSubscriptionPlanChanged({
      actorUserId,
      userId,
      previousPlan,
      newPlan,
      productId,
      excludeBilling: false,
    });

    return this.buildSubscriptionDetail(await this.requireUser(userId));
  }

  async cancelSubscription(
    userId: string,
    body: AdminCancelSubscriptionDto,
    actorUserId: string,
  ): Promise<AdminSubscriptionDetailDto> {
    const user = await this.requireUser(userId);
    const immediate = body.immediate ?? false;

    if (this.billingService.isMockMode()) {
      if (immediate) {
        this.mockCancelAtPeriodEndUserIds.delete(userId);
        await this.subscriptionDao.upsertAdminPlan(userId, {
          status: 'inactive',
          productId: null,
          currentPeriodEnd: null,
        });
      } else {
        this.mockCancelAtPeriodEndUserIds.add(userId);
        await this.subscriptionDao.upsertAdminPlan(userId, {
          status: 'active',
          productId: user.productId,
          currentPeriodEnd:
            user.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });
      }

      await this.platformAuditService.recordAdminSubscriptionCanceled({
        actorUserId,
        userId,
        mode: immediate ? 'immediate' : 'period_end',
      });

      return this.buildSubscriptionDetail(await this.requireUser(userId));
    }

    const polarClient = this.requirePolarClient();
    const subscriptionId = await this.resolvePolarSubscriptionId(user, polarClient);

    if (immediate) {
      await polarClient.subscriptions.revoke({ id: subscriptionId });
    } else {
      await polarClient.subscriptions.update({
        id: subscriptionId,
        subscriptionUpdate: { cancelAtPeriodEnd: true },
      });
    }

    await this.syncPolarSubscription(userId, polarClient);

    await this.platformAuditService.recordAdminSubscriptionCanceled({
      actorUserId,
      userId,
      mode: immediate ? 'immediate' : 'period_end',
      subscriptionId,
    });

    return this.buildSubscriptionDetail(await this.requireUser(userId));
  }

  async refundOrder(
    userId: string,
    orderId: string,
    body: AdminRefundOrderDto,
    actorUserId: string,
  ): Promise<AdminRefundResultDto> {
    await this.requireUser(userId);

    if (this.billingService.isMockMode()) {
      const refunded = this.billingService.refundMockOrder(orderId);
      if (!refunded) {
        throw new NotFoundException('Order not found');
      }

      await this.platformAuditService.recordAdminOrderRefunded({
        actorUserId,
        userId,
        orderId,
        amount: refunded.amount,
        currency: refunded.currency,
        reason: body.reason ?? 'customer_request',
      });

      return {
        orderId,
        status: 'refunded',
        amount: refunded.amount,
        currency: refunded.currency,
      };
    }

    const polarClient = this.requirePolarClient();

    let orderAmount = body.amount ?? 0;
    let currency = 'usd';

    try {
      const order = await polarClient.orders.get({ id: orderId });
      orderAmount = body.amount ?? order.totalAmount;
      currency = order.currency;
    } catch (error) {
      this.logger.debug(
        `Polar order lookup failed for ${orderId}: ${error instanceof Error ? error.message : error}`,
      );
      if (!body.amount) {
        throw new NotFoundException('Order not found');
      }
    }

    await polarClient.refunds.create({
      orderId,
      amount: orderAmount,
      reason: body.reason ?? 'customer_request',
      comment: body.comment ?? null,
    });

    await this.platformAuditService.recordAdminOrderRefunded({
      actorUserId,
      userId,
      orderId,
      amount: orderAmount,
      currency,
      reason: body.reason ?? 'customer_request',
    });

    return {
      orderId,
      status: 'refunded',
      amount: orderAmount,
      currency,
    };
  }

  async listSubscriptions(
    query: AdminSubscriptionsQueryDto,
  ): Promise<AdminSubscriptionsPageDto> {
    const limit = query.limit ?? 25;
    const offset = query.offset ?? 0;
    const status = query.status ?? 'active';

    const { items, total } = await this.adminDao.listSubscribers({
      limit,
      offset,
      search: query.search,
      status,
    });

    const plans = this.billingService.isMockMode()
      ? MOCK_PLANS
      : await this.fetchPolarPlansSafe();

    return {
      items: items.map((user) => this.toSubscriptionRow(user, plans)),
      total,
      limit,
      offset,
    };
  }

  private async buildSubscriptionDetail(
    user: AdminUserRecord,
  ): Promise<AdminSubscriptionDetailDto> {
    const isMock = this.billingService.isMockMode();
    const hasLocalOverride = !isMock && user.adminPlanOverride === true;
    const userFeatures = await this.billingService.getFeatures(user.id, user.email);
    const plans = isMock ? MOCK_PLANS : await this.fetchPolarPlansSafe();

    let status = userFeatures.status;
    if ((isMock || hasLocalOverride) && user.subscriptionStatus) {
      status = user.subscriptionStatus;
    }

    let cancelAtPeriodEnd: boolean | undefined;
    if (isMock) {
      cancelAtPeriodEnd = this.mockCancelAtPeriodEndUserIds.has(user.id);
    } else if (user.polarSubscriptionId && !hasLocalOverride) {
      cancelAtPeriodEnd = await this.fetchCancelAtPeriodEnd(user.polarSubscriptionId);
    }

    const planSlug = this.resolvePlanSlug(user, plans);
    const managementEnabled = isMock || Boolean(createPolarClient());

    return {
      provider: isMock ? 'mock' : 'polar',
      status,
      active: isMock || hasLocalOverride ? status === 'active' : userFeatures.active,
      productId: hasLocalOverride
        ? user.productId
        : (userFeatures.productId ?? user.productId),
      planSlug,
      currentPeriodEnd: hasLocalOverride
        ? (user.currentPeriodEnd?.toISOString() ?? null)
        : (userFeatures.currentPeriodEnd ?? user.currentPeriodEnd?.toISOString() ?? null),
      polarCustomerId: userFeatures.polarCustomerId ?? user.polarCustomerId,
      polarSubscriptionId: user.polarSubscriptionId,
      polarDashboardUrl:
        (userFeatures.polarCustomerId ?? user.polarCustomerId)
          ? buildPolarDashboardUrl(userFeatures.polarCustomerId ?? user.polarCustomerId!)
          : null,
      features: userFeatures.features,
      managementEnabled,
      cancelAtPeriodEnd,
      adminPlanOverride: hasLocalOverride,
      plans,
    };
  }

  private toSubscriptionRow(
    user: AdminUserRecord,
    plans: AdminPlanDto[],
  ): AdminSubscriptionRowDto {
    const plan = plans.find(
      (entry) =>
        (entry.productId && entry.productId === user.productId) ||
        this.resolvePlanSlug(user, plans) === entry.slug,
    );

    return {
      userId: user.id,
      email: user.email,
      name: user.name || null,
      displayName: user.displayName,
      status: user.subscriptionStatus ?? 'inactive',
      productId: user.productId,
      planName: plan?.name ?? (user.subscriptionStatus === 'active' ? 'Pro' : 'No plan'),
      currentPeriodEnd: user.currentPeriodEnd?.toISOString() ?? null,
      provider: this.billingService.isMockMode() ? 'mock' : 'polar',
    };
  }

  private resolvePlanLabel(user: AdminUserRecord): string | null {
    if (!user.subscriptionStatus || user.subscriptionStatus === 'inactive') {
      return 'No plan';
    }
    return user.productId ?? 'Pro';
  }

  private resolvePlanSlug(user: AdminUserRecord, plans: AdminPlanDto[]): string | null {
    if (!user.subscriptionStatus || user.subscriptionStatus === 'inactive') {
      return 'none';
    }

    const matched = plans.find((plan) => plan.productId && plan.productId === user.productId);
    return matched?.slug ?? (user.subscriptionStatus === 'active' ? 'pro' : null);
  }

  private async applyLocalPlanChange(
    userId: string,
    user: AdminUserRecord,
    body: AdminChangePlanDto,
    adminPlanOverride: boolean,
  ): Promise<{ planName: string; productId: string | null }> {
    const plan = await this.resolveLocalPlanChange(body);

    if (plan.slug !== 'none' && plan.slug !== 'free') {
      this.mockCancelAtPeriodEndUserIds.delete(userId);
    }

    const isInactive = plan.slug === 'none' || plan.slug === 'free';
    await this.subscriptionDao.upsertAdminPlan(userId, {
      status: isInactive ? 'inactive' : 'active',
      productId: plan.productId,
      currentPeriodEnd: isInactive
        ? null
        : (user.currentPeriodEnd ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      adminPlanOverride,
    });

    return { planName: plan.name, productId: plan.productId };
  }

  private async resolveLocalPlanChange(body: AdminChangePlanDto): Promise<AdminPlanDto> {
    if (this.billingService.isMockMode()) {
      return this.resolveMockPlan(body);
    }

    if (this.isNonePlanRequest(body)) {
      return { id: 'none', name: 'No plan', slug: 'none', productId: null };
    }

    const polarClient = this.requirePolarClient();
    const productId = await this.resolveTargetProductId(body, polarClient);
    const plans = await this.fetchPolarPlans(polarClient);
    const matched = plans.find((plan) => plan.productId === productId);

    return (
      matched ?? {
        id: productId,
        name: productId,
        slug: body.planSlug ?? null,
        productId,
      }
    );
  }

  private isNonePlanRequest(body: AdminChangePlanDto): boolean {
    const value = (body.planSlug ?? body.productId ?? '').toLowerCase();
    return value === 'none' || value === 'free' || value === 'inactive';
  }

  private resolveMockPlan(body: AdminChangePlanDto): AdminPlanDto {
    const slug = (body.planSlug ?? body.productId ?? '').toLowerCase();
    if (slug === 'free' || slug === 'inactive' || slug === 'none') {
      return { id: 'none', name: 'No plan', slug: 'none', productId: null };
    }
    if (slug === 'team') {
      return MOCK_PLANS.find((plan) => plan.slug === 'elite')!;
    }
    if (slug === 'pro' || slug === 'active' || slug === billingConfig.polar.productId) {
      return MOCK_PLANS.find((plan) => plan.slug === 'pro')!;
    }
    if (slug === 'starter') {
      return MOCK_PLANS.find((plan) => plan.slug === 'starter')!;
    }
    if (slug === 'elite') {
      return MOCK_PLANS.find((plan) => plan.slug === 'elite')!;
    }

    const byProduct = MOCK_PLANS.find((plan) => plan.productId === body.productId);
    if (byProduct) {
      return byProduct;
    }

    const bySlug = MOCK_PLANS.find((plan) => plan.slug === body.planSlug);
    if (bySlug) {
      return bySlug;
    }

    throw new BadRequestException('Unknown plan. Use starter, pro, or elite in mock billing mode.');
  }

  private async resolveTargetProductId(
    body: AdminChangePlanDto,
    polarClient: Polar,
  ): Promise<string> {
    if (body.productId) {
      return body.productId;
    }

    const plans = await this.fetchPolarPlans(polarClient);
    const matched = plans.find((plan) => plan.slug === body.planSlug);
    if (matched?.productId) {
      return matched.productId;
    }

    throw new BadRequestException('Unknown plan. Provide a valid productId or planSlug.');
  }

  private async resolvePolarSubscriptionId(
    user: AdminUserRecord,
    polarClient: Polar,
  ): Promise<string> {
    if (user.polarSubscriptionId) {
      return user.polarSubscriptionId;
    }

    const state = await this.billingService.fetchCustomerState(user.id);
    const record = asCustomerStateLike(state);
    const subscription = primarySubscription(record ?? {});
    if (subscription && typeof (subscription as PolarSubscriptionLike).id === 'string') {
      return (subscription as PolarSubscriptionLike).id!;
    }

    const iterator = await polarClient.subscriptions.list({
      externalCustomerId: user.id,
      limit: 1,
      ...(billingConfig.polar.organizationId
        ? { organizationId: [billingConfig.polar.organizationId] }
        : {}),
    });

    for await (const page of iterator) {
      const first = page.result.items[0];
      if (first?.id) {
        return first.id;
      }
    }

    throw new BadRequestException('No Polar subscription found for this user');
  }

  private async syncPolarSubscription(
    userId: string,
    polarClient: Polar,
    adminPlanOverride = false,
  ): Promise<void> {
    const state = await polarClient.customers.getStateExternal({ externalId: userId });
    const record = asCustomerStateLike(state);
    const subscription = primarySubscription(record ?? {}) as PolarSubscriptionLike | null;

    if (!subscription) {
      return;
    }

    const periodEnd = subscription.currentPeriodEnd;
    await this.subscriptionDao.upsertFromPolar({
      userId,
      status: subscription.status ?? 'active',
      polarCustomerId: record?.id ?? null,
      polarSubscriptionId: subscription.id ?? null,
      productId: subscription.productId ?? null,
      currentPeriodEnd:
        periodEnd instanceof Date
          ? periodEnd
          : typeof periodEnd === 'string'
            ? new Date(periodEnd)
            : null,
      adminPlanOverride,
    });
  }

  private async fetchCancelAtPeriodEnd(subscriptionId: string): Promise<boolean | undefined> {
    const polarClient = createPolarClient();
    if (!polarClient) {
      return undefined;
    }

    try {
      const subscription = await polarClient.subscriptions.get({ id: subscriptionId });
      return Boolean((subscription as PolarSubscriptionLike).cancelAtPeriodEnd);
    } catch (error) {
      this.logger.debug(
        `Polar subscription lookup failed for ${subscriptionId}: ${error instanceof Error ? error.message : error}`,
      );
      return undefined;
    }
  }

  private async fetchPolarPlansSafe(): Promise<AdminPlanDto[]> {
    const polarClient = createPolarClient();
    if (!polarClient) {
      return billingConfig.polar.productId
        ? [
            {
              id: billingConfig.polar.productId,
              name: 'Pro',
              slug: billingConfig.polar.checkoutSlug,
              productId: billingConfig.polar.productId,
            },
          ]
        : [];
    }

    try {
      return await this.fetchPolarPlans(polarClient);
    } catch (error) {
      this.logger.debug(
        `Polar products unavailable: ${error instanceof Error ? error.message : error}`,
      );
      return [];
    }
  }

  private async fetchPolarPlans(polarClient: Polar): Promise<AdminPlanDto[]> {
    const request = {
      limit: 50,
      ...(billingConfig.polar.organizationId
        ? { organizationId: [billingConfig.polar.organizationId] }
        : {}),
    };

    const iterator = await polarClient.products.list(request);
    const plans: AdminPlanDto[] = [];

    for await (const page of iterator) {
      for (const product of page.result.items) {
        plans.push({
          id: product.id,
          name: product.name,
          slug: typeof product.metadata?.slug === 'string' ? product.metadata.slug : null,
          productId: product.id,
        });
      }
    }

    if (plans.length === 0 && billingConfig.polar.productId) {
      plans.push({
        id: billingConfig.polar.productId,
        name: 'Pro',
        slug: billingConfig.polar.checkoutSlug,
        productId: billingConfig.polar.productId,
      });
    }

    return plans;
  }

  private requirePolarClient(): Polar {
    const polarClient = createPolarClient();
    if (!polarClient) {
      throw new ServiceUnavailableException(
        'Polar billing is not configured. Set POLAR_ACCESS_TOKEN and BILLING_PROVIDER=polar.',
      );
    }
    return polarClient;
  }

  private async requireUser(userId: string): Promise<AdminUserRecord> {
    const user = await this.adminDao.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}

function buildPolarDashboardUrl(customerId: string): string {
  const base =
    billingConfig.polar.server === 'sandbox'
      ? 'https://sandbox.polar.sh'
      : 'https://polar.sh';
  return `${base}/dashboard/customers/${customerId}`;
}
