import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class AdminAuditQueryDto {
  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;
}

export class AdminAuditEntryDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ example: 'admin.user.banned' })
  type!: string;

  @ApiProperty({ example: 'Banned by administrator' })
  label!: string;

  @ApiPropertyOptional({ example: 'Spam account' })
  detail!: string | null;

  @ApiProperty({ example: 'admin' })
  source!: string;

  @ApiProperty({ example: '2026-06-05T12:00:00.000Z' })
  occurredAt!: string;

  @ApiPropertyOptional()
  subjectUserId!: string | null;

  @ApiPropertyOptional({ example: 'demo@tradejournal.app' })
  subjectEmail!: string | null;

  @ApiPropertyOptional({ example: 'Demo Trader' })
  subjectName!: string | null;

  @ApiPropertyOptional({ example: 'EdgeTrader' })
  subjectDisplayName!: string | null;

  @ApiPropertyOptional()
  actorUserId!: string | null;

  @ApiPropertyOptional({ example: 'admin@tradejournal.app' })
  actorEmail!: string | null;

  @ApiPropertyOptional({ example: 'Platform Admin' })
  actorName!: string | null;

  @ApiPropertyOptional({ example: 'AdminDisplay' })
  actorDisplayName!: string | null;

  @ApiProperty({ type: Object })
  payload!: Record<string, unknown>;
}

export class AdminAuditPageDto {
  @ApiProperty({ type: [AdminAuditEntryDto] })
  items!: AdminAuditEntryDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  limit!: number;

  @ApiProperty()
  offset!: number;
}
