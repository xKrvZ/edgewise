import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';
import { ALL_ROLES } from '@/auth/constants/roles.constants';
import { PLATFORM_FEATURES } from '@/modules/billing/constants/features.constants';

/** Persisted subscription rows with status = active (see AdminUsersQueryDto.subscriptionActive). */
export const ADMIN_USER_SUBSCRIPTION_ACTIVE_FILTERS = ['active', 'inactive'] as const;
export type AdminUserSubscriptionActiveFilter =
  (typeof ADMIN_USER_SUBSCRIPTION_ACTIVE_FILTERS)[number];

/** Billing plan slugs for admin user list filtering (includes users with no mapped plan). */
export const ADMIN_USER_PLAN_FILTERS = ['starter', 'pro', 'elite', 'none'] as const;
export type AdminUserPlanFilter = (typeof ADMIN_USER_PLAN_FILTERS)[number];

export class AdminUsersQueryDto {
  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 25;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number = 0;

  @ApiPropertyOptional({ description: 'Filter users by email (contains, case-insensitive)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    enum: ADMIN_USER_SUBSCRIPTION_ACTIVE_FILTERS,
    description:
      'Filter by persisted subscription status. Active = user_subscription.status is active. Inactive = no row or any other status (inactive, canceled, etc.).',
  })
  @IsOptional()
  @IsIn(ADMIN_USER_SUBSCRIPTION_ACTIVE_FILTERS)
  subscriptionActive?: AdminUserSubscriptionActiveFilter;

  @ApiPropertyOptional({
    enum: ADMIN_USER_PLAN_FILTERS,
    description:
      'Filter by billing plan derived from user_subscription.productId (and mock/demo defaults when no product is stored).',
  })
  @IsOptional()
  @IsIn(ADMIN_USER_PLAN_FILTERS)
  plan?: AdminUserPlanFilter;

  @ApiPropertyOptional({
    enum: ALL_ROLES,
    description: 'Filter by platform role (legacy lowercase user and empty roles match User).',
  })
  @IsOptional()
  @IsIn(ALL_ROLES)
  role?: (typeof ALL_ROLES)[number];
}

export class AdminUserRowDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Trader profile display name when set',
  })
  displayName?: string | null;

  @ApiProperty({ nullable: true })
  role!: string | null;

  @ApiProperty({ nullable: true })
  subscriptionStatus!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  emailVerified!: boolean;

  @ApiProperty()
  banned!: boolean;

  @ApiPropertyOptional({ nullable: true, description: 'Resolved user avatar URL' })
  image?: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Set when the user requested account erasure',
  })
  deletedAt?: string | null;
}

export class AdminUsersPageDto {
  @ApiProperty({ type: [AdminUserRowDto] })
  items!: AdminUserRowDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;
}

export class AdminUserSubscriptionDto {
  @ApiProperty({ enum: ['mock', 'polar'] })
  provider!: 'mock' | 'polar';

  @ApiProperty({ example: 'active' })
  status!: string;

  @ApiProperty()
  active!: boolean;

  @ApiProperty({ nullable: true })
  productId!: string | null;

  @ApiProperty({ nullable: true })
  currentPeriodEnd!: string | null;

  @ApiProperty({ nullable: true })
  polarCustomerId!: string | null;

  @ApiProperty({ nullable: true, description: 'Link to Polar dashboard when customer exists' })
  polarDashboardUrl!: string | null;

  @ApiProperty({
    enum: PLATFORM_FEATURES,
    isArray: true,
    description: 'Enabled Edgewise features for this user',
  })
  features!: (typeof PLATFORM_FEATURES)[number][];

  @ApiProperty({
    description: 'Mock billing only — Polar subscriptions are managed in the Polar dashboard',
  })
  adminEditable!: boolean;
}

export class AdminUserAccountQuotaDto {
  @ApiProperty({ description: 'Number of trading accounts the user currently has' })
  accountCount!: number;

  @ApiProperty({ description: 'Effective max trading accounts (override or plan default)' })
  maxAccounts!: number;

  @ApiProperty({ description: 'Max trading accounts included on the current plan' })
  planMaxAccounts!: number;

  @ApiProperty({
    nullable: true,
    description: 'Admin override when set; null means use plan default',
  })
  maxTradingAccountsOverride!: number | null;

  @ApiProperty({
    enum: ['starter', 'pro', 'elite', 'none'],
    description: 'Billing plan used when no override is set',
  })
  planId!: 'starter' | 'pro' | 'elite' | 'none';
}

export class AdminUserDetailDto extends AdminUserRowDto {
  @ApiProperty({ nullable: true })
  banReason!: string | null;

  @ApiProperty({ nullable: true })
  banExpires!: string | null;

  @ApiProperty({ type: AdminUserSubscriptionDto })
  subscription!: AdminUserSubscriptionDto;

  @ApiProperty({ type: AdminUserAccountQuotaDto })
  accountQuota!: AdminUserAccountQuotaDto;
}

export class AdminUpdateUserRoleDto {
  @ApiProperty({ enum: ALL_ROLES })
  @IsString()
  @IsIn(ALL_ROLES)
  role!: string;
}

export const ADMIN_SUBSCRIPTION_STATUSES = ['active', 'inactive', 'canceled'] as const;
export type AdminSubscriptionStatus = (typeof ADMIN_SUBSCRIPTION_STATUSES)[number];

export class AdminUpdateUserSubscriptionDto {
  @ApiProperty({ enum: ADMIN_SUBSCRIPTION_STATUSES })
  @IsIn(ADMIN_SUBSCRIPTION_STATUSES)
  status!: AdminSubscriptionStatus;
}

export class AdminBanUserDto {
  @ApiPropertyOptional({ example: 'Terms of service violation' })
  @IsOptional()
  @IsString()
  banReason?: string;
}

export class AdminUpdateAccountLimitDto {
  @ApiPropertyOptional({
    nullable: true,
    minimum: 0,
    maximum: 500,
    description: 'Per-user max trading accounts. Pass null to clear override and use plan default.',
    example: 25,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null && value !== undefined)
  @IsInt()
  @Min(0)
  @Max(500)
  maxTradingAccounts?: number | null;
}
