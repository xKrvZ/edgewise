import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IncomingHttpHeaders } from 'node:http';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { ALL_ROLES } from '@/auth/constants/roles.constants';
import { createPolarClient } from '@/auth/polar.plugin';
import billingConfig from '@/config/billing.config';
import type { InvoicesPageDto } from '@/modules/billing/dtos/invoice.dto';
import { SubscriptionDao } from '@/modules/billing/daos/subscription.dao';
import { UserAccountLimitDao } from '@/modules/billing/daos/user-account-limit.dao';
import { AccountLimitService } from '@/modules/billing/services/account-limit.service';
import { BillingService } from '@/modules/billing/services/billing.service';
import { AccountDao } from '@/modules/account/daos/account.dao';
import { PlatformAuditService } from '@/modules/platform-metrics/services/platform-audit.service';
import type { AdminUserRecord } from '../daos/admin.dao';
import { AdminDao } from '../daos/admin.dao';
import type { AdminUsersQueryDto } from '../dtos/admin-user.dto';
import {
  AdminUpdateUserRoleDto,
  AdminUpdateUserSubscriptionDto,
  AdminUpdateAccountLimitDto,
  AdminUserAccountQuotaDto,
  AdminUserDetailDto,
  AdminUserRowDto,
  AdminUsersPageDto,
  AdminUserSubscriptionDto,
} from '../dtos/admin-user.dto';
import { resolveUserAvatarUrl } from '@/modules/privacy/utils/resolve-user-avatar.util';
import {
  sanitizeAdminUserDetail,
  sanitizeAdminUserRow,
} from '@/modules/privacy/utils/sanitize-user.util';
import { StorageService } from '@/modules/storage/storage.service';
import {
  banUserAccount,
  setUserRole,
  unbanUserAccount,
} from '../utils/admin-auth-api';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly adminDao: AdminDao,
    private readonly billingService: BillingService,
    private readonly subscriptionDao: SubscriptionDao,
    private readonly accountLimitService: AccountLimitService,
    private readonly userAccountLimitDao: UserAccountLimitDao,
    private readonly accountDao: AccountDao,
    private readonly authService: AuthService,
    private readonly platformAuditService: PlatformAuditService,
    private readonly storage: StorageService,
  ) {}

  async listUsers(query: AdminUsersQueryDto): Promise<AdminUsersPageDto> {
    const limit = query.limit ?? 25;
    const offset = query.offset ?? 0;
    const { items, total } = await this.adminDao.listUsers({
      limit,
      offset,
      search: query.search,
    });

    return {
      items: await Promise.all(items.map((user) => this.toUserRow(user))),
      total,
      limit,
      offset,
    };
  }

  async getUser(userId: string): Promise<AdminUserDetailDto> {
    const user = await this.adminDao.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const subscription = await this.buildSubscriptionDto(user);
    const accountQuota = await this.buildAccountQuotaDto(user);
    const row = await this.toUserRow(user);
    return sanitizeAdminUserDetail({
      ...row,
      image: row.image ?? null,
      banReason: user.banReason,
      banExpires: user.banExpires?.toISOString() ?? null,
      anonymizedAt: user.anonymizedAt?.toISOString() ?? null,
      subscription,
      accountQuota,
    });
  }

  async listInvoices(userId: string): Promise<InvoicesPageDto> {
    const user = await this.adminDao.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.billingService.listInvoices(userId);
  }

  async updateRole(
    userId: string,
    body: AdminUpdateUserRoleDto,
    headers: IncomingHttpHeaders,
    actorUserId: string,
  ): Promise<AdminUserDetailDto> {
    if (!ALL_ROLES.includes(body.role as (typeof ALL_ROLES)[number])) {
      throw new BadRequestException('Invalid role');
    }

    const existing = await this.adminDao.findUserById(userId);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await setUserRole(this.authService, userId, body.role, headers);

    await this.platformAuditService.recordAdminRoleChanged({
      actorUserId,
      userId,
      previousRole: existing.role,
      newRole: body.role,
    });

    return this.getUser(userId);
  }

  async updateSubscription(
    userId: string,
    body: AdminUpdateUserSubscriptionDto,
    actorUserId: string,
  ): Promise<AdminUserDetailDto> {
    if (!this.billingService.isMockMode()) {
      throw new BadRequestException(
        'Subscription overrides are only available in mock billing mode. Manage Polar subscriptions in the Polar dashboard.',
      );
    }

    const existing = await this.adminDao.findUserById(userId);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await this.subscriptionDao.upsertAdminStatus(userId, body.status);

    await this.platformAuditService.recordAdminSubscriptionOverride({
      actorUserId,
      userId,
      previousStatus: existing.subscriptionStatus,
      newStatus: body.status,
    });

    return this.getUser(userId);
  }

  async updateAccountLimit(
    userId: string,
    body: AdminUpdateAccountLimitDto,
    actorUserId: string,
  ): Promise<AdminUserDetailDto> {
    if (!('maxTradingAccounts' in body)) {
      throw new BadRequestException('maxTradingAccounts is required');
    }

    const value = body.maxTradingAccounts ?? null;
    if (value != null) {
      if (!Number.isInteger(value) || value < 0 || value > 500) {
        throw new BadRequestException('maxTradingAccounts must be an integer between 0 and 500');
      }
    }

    const existing = await this.adminDao.findUserById(userId);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    const accountCount = await this.accountDao.countByUser(userId);
    const previousQuota = await this.accountLimitService.getQuota(
      userId,
      accountCount,
      existing.email,
    );

    const updated = await this.userAccountLimitDao.setOverride(userId, value);
    if (!updated) {
      throw new NotFoundException('User not found');
    }

    const nextQuota = await this.accountLimitService.getQuota(
      userId,
      accountCount,
      existing.email,
    );

    await this.platformAuditService.recordAdminAccountLimitChanged({
      actorUserId,
      userId,
      previousOverride: previousQuota.override,
      newOverride: nextQuota.override,
      previousMaxAccounts: previousQuota.maxAccounts,
      newMaxAccounts: nextQuota.maxAccounts,
    });

    return this.getUser(userId);
  }

  async banUser(
    userId: string,
    headers: IncomingHttpHeaders,
    actorUserId: string,
    banReason?: string,
  ): Promise<AdminUserDetailDto> {
    const existing = await this.adminDao.findUserById(userId);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await banUserAccount(this.authService, userId, headers, banReason);

    await this.platformAuditService.recordAdminUserBanned({
      actorUserId,
      userId,
      banReason,
    });

    return this.getUser(userId);
  }

  async unbanUser(
    userId: string,
    headers: IncomingHttpHeaders,
    actorUserId: string,
  ): Promise<AdminUserDetailDto> {
    const existing = await this.adminDao.findUserById(userId);
    if (!existing) {
      throw new NotFoundException('User not found');
    }

    await unbanUserAccount(this.authService, userId, headers);

    await this.platformAuditService.recordAdminUserUnbanned({
      actorUserId,
      userId,
    });

    return this.getUser(userId);
  }

  private async toUserRow(user: AdminUserRecord): Promise<AdminUserRowDto> {
    const image = await resolveUserAvatarUrl(this.storage, {
      userImage: user.image,
      avatarStorageKey: user.avatarStorageKey,
    });

    return sanitizeAdminUserRow({
      id: user.id,
      email: user.email,
      name: user.name || null,
      displayName: user.displayName,
      role: user.role,
      subscriptionStatus: this.resolveSubscriptionLabel(user),
      createdAt: user.createdAt.toISOString(),
      emailVerified: user.emailVerified,
      banned: Boolean(user.banned),
      image,
      deletedAt: user.deletedAt?.toISOString() ?? user.anonymizedAt?.toISOString() ?? null,
      anonymizedAt: user.anonymizedAt?.toISOString() ?? null,
    });
  }

  private resolveSubscriptionLabel(user: AdminUserRecord): string {
    if (user.subscriptionStatus) {
      return formatSubscriptionStatus(user.subscriptionStatus);
    }

    if (this.billingService.isMockMode()) {
      return 'Active';
    }

    return 'None';
  }

  private async buildSubscriptionDto(user: AdminUserRecord): Promise<AdminUserSubscriptionDto> {
    const isMock = this.billingService.isMockMode();
    const userFeatures = await this.billingService.getFeatures(user.id, user.email);

    let status = userFeatures.status;
    if (isMock && user.subscriptionStatus) {
      status = user.subscriptionStatus;
    }

    return {
      provider: isMock ? 'mock' : 'polar',
      status,
      active: isMock ? status === 'active' : userFeatures.active,
      productId: userFeatures.productId ?? user.productId,
      currentPeriodEnd: userFeatures.currentPeriodEnd ?? user.currentPeriodEnd?.toISOString() ?? null,
      polarCustomerId: userFeatures.polarCustomerId ?? user.polarCustomerId,
      polarDashboardUrl:
        (userFeatures.polarCustomerId ?? user.polarCustomerId)
          ? buildPolarDashboardUrl(userFeatures.polarCustomerId ?? user.polarCustomerId!)
          : null,
      features: userFeatures.features,
      adminEditable: isMock || Boolean(createPolarClient()),
    };
  }

  private async buildAccountQuotaDto(user: AdminUserRecord): Promise<AdminUserAccountQuotaDto> {
    const accountCount = await this.accountDao.countByUser(user.id);
    const quota = await this.accountLimitService.getQuota(user.id, accountCount, user.email);

    return {
      accountCount: quota.accountCount,
      maxAccounts: quota.maxAccounts,
      planMaxAccounts: quota.planMaxAccounts,
      maxTradingAccountsOverride: quota.override,
      planId: quota.planId,
    };
  }
}

function formatSubscriptionStatus(status: string): string {
  switch (status) {
    case 'active':
      return 'Active';
    case 'canceled':
      return 'Canceled';
    case 'inactive':
      return 'None';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
}

function buildPolarDashboardUrl(customerId: string): string {
  const base =
    billingConfig.polar.server === 'sandbox'
      ? 'https://sandbox.polar.sh'
      : 'https://polar.sh';
  return `${base}/dashboard/customers/${customerId}`;
}
