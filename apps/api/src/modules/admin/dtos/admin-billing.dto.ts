import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import { PLATFORM_FEATURES } from '@/modules/billing/constants/features.constants';

export class AdminPlanDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiPropertyOptional({ description: 'Checkout slug when available' })
  slug?: string | null;

  @ApiProperty({ nullable: true })
  productId!: string | null;
}

export class AdminSubscriptionDetailDto {
  @ApiProperty({ enum: ['mock', 'polar'] })
  provider!: 'mock' | 'polar';

  @ApiProperty()
  status!: string;

  @ApiProperty()
  active!: boolean;

  @ApiProperty({ nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  planSlug?: string | null;

  @ApiProperty({ nullable: true })
  currentPeriodEnd!: string | null;

  @ApiProperty({ nullable: true })
  polarCustomerId!: string | null;

  @ApiProperty({ nullable: true })
  polarSubscriptionId!: string | null;

  @ApiProperty({ nullable: true })
  polarDashboardUrl!: string | null;

  @ApiProperty({
    enum: PLATFORM_FEATURES,
    isArray: true,
  })
  features!: (typeof PLATFORM_FEATURES)[number][];

  @ApiProperty({
    description: 'Whether subscription can be managed from the admin UI',
  })
  managementEnabled!: boolean;

  @ApiPropertyOptional({
    description: 'True when cancellation is scheduled at period end',
  })
  cancelAtPeriodEnd?: boolean;

  @ApiProperty({ type: [AdminPlanDto] })
  plans!: AdminPlanDto[];
}

export class AdminChangePlanDto {
  @ApiPropertyOptional({ description: 'Polar product ID to switch to' })
  @ValidateIf((body: AdminChangePlanDto) => !body.planSlug)
  @IsString()
  productId?: string;

  @ApiPropertyOptional({
    description: 'Plan slug — mock: free|pro; polar: product slug when available',
  })
  @ValidateIf((body: AdminChangePlanDto) => !body.productId)
  @IsString()
  planSlug?: string;
}

export class AdminCancelSubscriptionDto {
  @ApiProperty({
    description: 'Cancel immediately (revoke) instead of at period end',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean = false;
}

export const ADMIN_REFUND_REASONS = [
  'duplicate',
  'fraudulent',
  'customer_request',
  'service_disruption',
  'satisfaction_guarantee',
  'dispute_prevention',
  'other',
] as const;

export type AdminRefundReason = (typeof ADMIN_REFUND_REASONS)[number];

export class AdminRefundOrderDto {
  @ApiPropertyOptional({
    description: 'Amount in cents — defaults to full order amount',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  amount?: number;

  @ApiPropertyOptional({ enum: ADMIN_REFUND_REASONS, default: 'customer_request' })
  @IsOptional()
  @IsIn(ADMIN_REFUND_REASONS)
  reason?: AdminRefundReason;

  @ApiPropertyOptional({ description: 'Internal admin note about the refund' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class AdminRefundResultDto {
  @ApiProperty()
  orderId!: string;

  @ApiProperty()
  status!: string;

  @ApiProperty({ description: 'Refunded amount in cents' })
  amount!: number;

  @ApiProperty()
  currency!: string;
}

export class AdminSubscriptionsQueryDto {
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

  @ApiPropertyOptional({ description: 'Filter by email (contains, case-insensitive)' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by subscription status',
    default: 'active',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class AdminSubscriptionRowDto {
  @ApiProperty()
  userId!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ nullable: true })
  name!: string | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Trader profile display name when set',
  })
  displayName?: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty({ nullable: true })
  productId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  planName?: string | null;

  @ApiProperty({ nullable: true })
  currentPeriodEnd!: string | null;

  @ApiProperty({ enum: ['mock', 'polar'] })
  provider!: 'mock' | 'polar';
}

export class AdminSubscriptionsPageDto {
  @ApiProperty({ type: [AdminSubscriptionRowDto] })
  items!: AdminSubscriptionRowDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;
}

export class AdminPlansResponseDto {
  @ApiProperty({ type: [AdminPlanDto] })
  plans!: AdminPlanDto[];
}
