import { ApiProperty } from '@nestjs/swagger';

export class HealthDto {
  @ApiProperty({ example: 'ok', description: 'Service health status' })
  status: string;
}
