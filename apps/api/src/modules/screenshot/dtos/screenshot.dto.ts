import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import {
  MEDIA_VISIBILITIES,
  type MediaVisibility,
} from '@/modules/screenshot/constants/screenshot.constants';
import {
  MEDIA_KINDS,
  type MediaKind,
} from '@/modules/storage/constants/storage.constants';

export class ScreenshotDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() userId: string;
  @Expose() @ApiProperty({ nullable: true }) tradeId: string | null;
  @Expose() @ApiProperty({ nullable: true }) playbookId: string | null;
  @Expose() @ApiProperty({ enum: MEDIA_KINDS, example: 'image' }) kind: MediaKind;
  @Expose() @ApiProperty({ description: 'Display URL (presigned for uploads)', example: 'https://cdn.example.com/chart.png' }) url: string;
  @Expose() @ApiProperty({ nullable: true }) contentType: string | null;
  @Expose() @ApiProperty({ nullable: true }) sizeBytes: number | null;
  @Expose() @ApiProperty({ nullable: true }) caption: string | null;
  @Expose()
  @ApiProperty({ enum: MEDIA_VISIBILITIES, example: 'private' })
  visibility: MediaVisibility;
  @Expose() @ApiProperty({ type: String, format: 'date-time' }) createdAt: Date;
}

export class CreateScreenshotDto {
  @ApiPropertyOptional({
    description: 'External media URL (use this OR storageKey)',
    example: 'https://cdn.example.com/chart.png',
  })
  @IsOptional()
  @IsUrl({ require_tld: false })
  @MaxLength(2048)
  url?: string;

  @ApiPropertyOptional({
    description: 'Object key returned by /screenshots/upload-url (use this OR url)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  storageKey?: string;

  @ApiPropertyOptional({ enum: MEDIA_KINDS, default: 'image' })
  @IsOptional()
  @IsString()
  kind?: MediaKind;

  @ApiPropertyOptional({ example: 'image/png' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  contentType?: string;

  @ApiPropertyOptional({ example: 482910 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sizeBytes?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  tradeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  playbookId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(280)
  caption?: string;

  @ApiPropertyOptional({
    enum: MEDIA_VISIBILITIES,
    default: 'private',
    description: 'Whether this item appears on the trade share link',
  })
  @IsOptional()
  @IsIn(MEDIA_VISIBILITIES)
  visibility?: MediaVisibility;
}

export class UpdateScreenshotDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(280)
  caption?: string;

  @ApiPropertyOptional({
    enum: MEDIA_VISIBILITIES,
    description: 'Whether this item appears on the trade share link',
  })
  @IsOptional()
  @IsIn(MEDIA_VISIBILITIES)
  visibility?: MediaVisibility;
}

export class ScreenshotQueryDto {
  @ApiPropertyOptional({ description: 'Filter by trade id' })
  @IsOptional()
  @IsUUID()
  tradeId?: string;

  @ApiPropertyOptional({ description: 'Filter by playbook id' })
  @IsOptional()
  @IsUUID()
  playbookId?: string;
}

export class RequestUploadDto {
  @ApiProperty({ example: 'entry-chart.png' })
  @IsString()
  @MaxLength(255)
  filename: string;

  @ApiProperty({ example: 'image/png' })
  @IsString()
  @MaxLength(128)
  contentType: string;

  @ApiProperty({ enum: MEDIA_KINDS, example: 'image' })
  @IsString()
  kind: MediaKind;

  @ApiProperty({ example: 482910, description: 'File size in bytes' })
  @IsInt()
  @Min(1)
  @Max(2_147_483_647)
  sizeBytes: number;
}

export class UploadTargetDto {
  @Expose() @ApiProperty({ description: 'Presigned PUT URL to upload the file to' }) uploadUrl: string;
  @Expose() @ApiProperty({ description: 'Object key to send back to POST /screenshots' }) storageKey: string;
  @Expose() @ApiProperty({ description: 'Seconds until the upload URL expires' }) expiresIn: number;
}
