import { PartialType } from '@nestjs/swagger';
import { CreateTradingSessionDto } from './create-trading-session.dto';

export class UpdateTradingSessionDto extends PartialType(
  CreateTradingSessionDto,
) {}
