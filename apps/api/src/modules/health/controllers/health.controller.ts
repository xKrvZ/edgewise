import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { HealthDto } from '../dtos/health.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @AllowAnonymous()
  @ApiOperation({ summary: 'Public liveness probe for the API' })
  @ApiOkResponse({ type: HealthDto })
  check(): HealthDto {
    return { status: 'ok' };
  }
}
