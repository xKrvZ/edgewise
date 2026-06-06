import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  AnalyticsOverviewDto,
  EquityPointDto,
} from '@/modules/analytics/dtos/analytics.dto';
import { PublicPlaybookDto } from './public-playbook.dto';

export class PublicProfileDto {
  @Expose()
  @ApiProperty({ nullable: true, example: 'Demo Trader' })
  displayName: string | null;

  @Expose()
  @ApiProperty({ nullable: true })
  bio: string | null;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Presigned avatar URL when an avatar is uploaded',
  })
  avatarUrl: string | null;

  @Expose()
  @ApiProperty({
    nullable: true,
    description: 'Presigned header/banner URL when a header is uploaded',
  })
  headerUrl: string | null;

  @Expose()
  @ApiProperty({ type: String, isArray: true, example: ['ES', 'NQ'] })
  favoriteSymbols: string[];

  @Expose()
  @ApiProperty({ type: PublicPlaybookDto, isArray: true })
  @Type(() => PublicPlaybookDto)
  playbooks: PublicPlaybookDto[];

  @Expose()
  @ApiProperty({
    nullable: true,
    type: AnalyticsOverviewDto,
    description: 'Present only when stats visibility is public',
  })
  @Type(() => AnalyticsOverviewDto)
  overview: AnalyticsOverviewDto | null;

  @Expose()
  @ApiProperty({
    type: EquityPointDto,
    isArray: true,
    description: 'Present only when stats visibility is public',
  })
  @Type(() => EquityPointDto)
  equityCurve: EquityPointDto[] | null;
}
