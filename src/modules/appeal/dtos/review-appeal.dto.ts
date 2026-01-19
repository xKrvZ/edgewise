import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';
import { AppealStatus } from './appeal.dto';

export class ReviewAppealDto {
  @ApiProperty({
    description: 'Status of the appeal review',
    enum: ['accepted', 'denied'],
    example: 'accepted',
  })
  @IsEnum(['accepted', 'denied'])
  @IsNotEmpty()
  status: 'accepted' | 'denied';
}
