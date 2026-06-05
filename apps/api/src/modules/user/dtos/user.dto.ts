import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserDto {
  @Expose()
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  name: string;

  @Expose()
  @ApiProperty({
    description: 'User role',
    example: 'admin',
  })
  role: string;
}
