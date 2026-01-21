import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
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

  @ApiProperty({
    description: 'Note text explaining the review decision. This note will be attached to the appeal.',
    example: 'Appeal accepted. The punishment has been lifted as the player provided sufficient evidence.',
  })
  @IsString()
  @IsNotEmpty()
  note: string;
}
