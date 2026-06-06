import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class EntitlementGrantDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  benefitId!: string;

  @ApiProperty()
  grantedAt!: string;

  @ApiPropertyOptional({ description: 'Resolved slug from benefit metadata when present' })
  slug?: string | null;
}

export class EntitlementsDto {
  @ApiProperty()
  active!: boolean;

  @ApiProperty({ enum: ['mock', 'polar'] })
  provider!: 'mock' | 'polar';

  @ApiProperty({ example: 'active' })
  status!: string;

  @ApiProperty({ type: [EntitlementGrantDto] })
  entitlements!: EntitlementGrantDto[];

  @ApiProperty({ type: [String], description: 'Convenience list of entitlement slugs' })
  entitlementSlugs!: string[];

  @ApiPropertyOptional({ nullable: true })
  productId?: string | null;

  @ApiPropertyOptional({ nullable: true })
  currentPeriodEnd?: string | null;

  @ApiPropertyOptional({ nullable: true })
  polarCustomerId?: string | null;
}
