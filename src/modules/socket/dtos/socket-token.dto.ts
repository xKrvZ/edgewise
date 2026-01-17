import { ApiProperty } from '@nestjs/swagger';

export class SocketTokenDto {
  @ApiProperty({
    description: 'Access token for socket authentication',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 60,
  })
  expiresIn: number;
}
