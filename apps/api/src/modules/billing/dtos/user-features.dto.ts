import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PLATFORM_FEATURES } from '../constants/features.constants';

export class UserFeaturesDto {
  @ApiProperty({ description: 'Whether the user has core platform access (journal feature)' })
  active!: boolean;

  @ApiProperty({ enum: ['mock', 'polar'] })
  provider!: 'mock' | 'polar';

  @ApiProperty({ example: 'active' })
  status!: string;

  @ApiProperty({
    enum: PLATFORM_FEATURES,
    isArray: true,
    description: 'Enabled Edgewise features for this user',
  })
  features!: (typeof PLATFORM_FEATURES)[number][];

  @ApiPropertyOptional({ nullable: true })
  productId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  currentPeriodEnd?: string | null;

  @ApiPropertyOptional({ nullable: true })
  polarCustomerId?: string | null;

  @ApiProperty({
    description: 'Billing plan used for per-account limits',
    enum: ['starter', 'pro', 'elite', 'none'],
    example: 'pro',
  })
  planId!: 'starter' | 'pro' | 'elite' | 'none';

  @ApiProperty({
    description: 'Maximum trading accounts allowed on the current plan',
    example: 5,
  })
  maxAccounts!: number;

  @ApiProperty({
    description: 'Number of trading accounts the user currently has',
    example: 2,
  })
  accountCount!: number;

  @ApiProperty({
    description: 'AI review tokens remaining this billing month (null when unlimited)',
    example: 8,
    nullable: true,
  })
  aiReviewTokensRemaining!: number | null;

  @ApiProperty({
    description: 'Monthly AI review token allowance for the current plan (null when unlimited)',
    example: 10,
    nullable: true,
  })
  aiReviewTokensLimit!: number | null;

  @ApiProperty({
    description: 'Whether the plan includes unlimited AI review tokens (Elite)',
    example: false,
  })
  aiReviewTokensUnlimited!: boolean;
}
