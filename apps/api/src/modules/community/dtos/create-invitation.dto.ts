import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsIn, IsNotEmpty, IsUUID, ValidateIf } from 'class-validator';
import { INVITATION_ROLES } from '../constants/community.constants';

export class CreateInvitationDto {
  @ApiPropertyOptional({ example: 'trader@example.com' })
  @ValidateIf((dto: CreateInvitationDto) => !dto.userId)
  @IsEmail()
  @IsNotEmpty()
  email?: string;

  @ApiPropertyOptional({ description: 'Invite an existing user by ID' })
  @ValidateIf((dto: CreateInvitationDto) => !dto.email)
  @IsUUID()
  userId?: string;

  @ApiProperty({ enum: INVITATION_ROLES, example: 'member' })
  @IsIn([...INVITATION_ROLES])
  role: (typeof INVITATION_ROLES)[number];
}
