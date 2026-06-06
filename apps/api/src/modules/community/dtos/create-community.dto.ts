import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommunityDto {
  @ApiProperty({ example: 'Alpha Traders' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ example: 'A group for systematic futures traders.' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
