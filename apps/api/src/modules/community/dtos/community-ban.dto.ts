import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BanCommunityMemberDto {
  @ApiPropertyOptional({ maxLength: 500, description: 'Optional reason shown to moderators' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class CommunityBannedMemberDto {
  @Expose()
  @ApiProperty()
  id: string;

  @Expose()
  @ApiProperty()
  userId: string;

  @Expose()
  @ApiProperty()
  displayName: string;

  @Expose()
  @ApiProperty({ nullable: true, description: 'Resolved banned user avatar URL' })
  avatarUrl: string | null;

  @Expose()
  @ApiProperty()
  bannedBy: string;

  @Expose()
  @ApiProperty()
  bannedByDisplayName: string;

  @Expose()
  @ApiProperty({ type: String, format: 'date-time' })
  bannedAt: Date;

  @Expose()
  @ApiProperty({ nullable: true })
  reason: string | null;
}
