import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

/** Payload for the client → server `candles:unsubscribe` event. */
export class CandlesUnsubscribeDto {
  @ApiProperty({ description: 'The requestId of the stream to cancel' })
  @IsString()
  @MaxLength(128)
  requestId: string;
}
