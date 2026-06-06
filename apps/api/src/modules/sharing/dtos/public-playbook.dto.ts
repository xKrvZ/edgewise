import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class PublicPlaybookDto {
  @Expose()
  @ApiProperty({ example: 'NY Open Breakout' })
  name: string;

  @Expose()
  @ApiProperty({ nullable: true, example: 'Fade the first 15m range on ES.' })
  description: string | null;
}
