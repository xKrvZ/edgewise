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
}
