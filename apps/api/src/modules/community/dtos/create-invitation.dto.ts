import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty } from 'class-validator';
import { INVITATION_ROLES } from '../constants/community.constants';

export class CreateInvitationDto {
  @ApiProperty({ example: 'trader@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: INVITATION_ROLES, example: 'member' })
  @IsIn([...INVITATION_ROLES])
  role: (typeof INVITATION_ROLES)[number];
}
