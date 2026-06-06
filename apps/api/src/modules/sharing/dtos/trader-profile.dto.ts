import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  MAX_FAVORITE_SYMBOLS,
  STATS_VISIBILITIES,
  type StatsVisibility,
} from '../constants/sharing.constants';

export class TraderProfileDto {
  @Expose()
  @ApiProperty({ nullable: true, example: 'Demo Trader' })
  displayName: string | null;

  @Expose()
  @ApiProperty({ nullable: true, example: 'Futures trader focused on NY session breakouts.' })
  bio: string | null;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Presigned avatar URL for preview in profile settings',
  })
  avatarUrl: string | null;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Presigned header URL for preview in profile settings',
  })
  headerUrl: string | null;

  @Expose()
  @ApiProperty({ type: String, isArray: true, example: ['ES', 'NQ'] })
  favoriteSymbols: string[];

  @Expose()
  @ApiProperty({ example: false })
  sharePlaybooks: boolean;

  @Expose()
  @ApiProperty({ type: String, isArray: true })
  sharedPlaybookIds: string[];

  @Expose()
  @ApiProperty({ enum: STATS_VISIBILITIES })
  statsVisibility: StatsVisibility;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Opaque profile share token for the public profile URL',
  })
  statsShareToken: string | null;
}

export class UpdateTraderProfileDto {
  @ApiPropertyOptional({ example: 'Demo Trader', maxLength: 80 })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  displayName?: string | null;

  @ApiPropertyOptional({
    example: 'Futures trader focused on NY session breakouts.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string | null;

  @ApiPropertyOptional({
    description: 'Set after uploading avatar via presigned URL; null removes avatar',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  avatarStorageKey?: string | null;

  @ApiPropertyOptional({
    description: 'Set after uploading header via presigned URL; null removes header',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  headerStorageKey?: string | null;

  @ApiPropertyOptional({ type: String, isArray: true, example: ['ES', 'NQ'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(16, { each: true })
  @ArrayMaxSize(MAX_FAVORITE_SYMBOLS)
  favoriteSymbols?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  sharePlaybooks?: boolean;

  @ApiPropertyOptional({
    type: String,
    isArray: true,
    description: 'Playbook ids to show on the public profile when sharePlaybooks is true',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  sharedPlaybookIds?: string[];

  @ApiPropertyOptional({ enum: STATS_VISIBILITIES })
  @IsOptional()
  @IsIn(STATS_VISIBILITIES)
  statsVisibility?: StatsVisibility;
}
