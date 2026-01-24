import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateAppealDto {
  @ApiProperty({
    description: 'Punishment ID being appealed',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  punishmentId: string;

  @ApiPropertyOptional({
    description: 'Description/reason for the appeal',
    example: 'I believe this punishment was issued in error. I was not online at the time of the incident.',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
