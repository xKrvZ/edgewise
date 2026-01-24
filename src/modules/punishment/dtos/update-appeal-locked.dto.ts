import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateAppealLockedDto {
  @ApiProperty({
    description: 'Whether to lock appeals for this punishment',
    example: true,
  })
  @IsBoolean()
  appealLocked: boolean;
}
