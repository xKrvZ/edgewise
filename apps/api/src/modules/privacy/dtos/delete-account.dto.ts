import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { DELETE_ACCOUNT_CONFIRMATION } from '../constants/privacy.constants';

export class DeleteAccountDto {
  @ApiProperty({
    description: `Type "${DELETE_ACCOUNT_CONFIRMATION}" or your account email to confirm deletion`,
    example: DELETE_ACCOUNT_CONFIRMATION,
  })
  @IsString()
  @MinLength(1)
  confirmation!: string;
}
