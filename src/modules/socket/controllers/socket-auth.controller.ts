import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  SerializeOptions,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Session, UserSession } from '@thallesp/nestjs-better-auth';
import { SocketAuthService } from '../services/socket-auth.service';
import { SocketTokenDto } from '../dtos/socket-token.dto';

@ApiTags('socket')
@Controller('socket')
@SerializeOptions({ excludeExtraneousValues: true })
export class SocketAuthController {
  constructor(private readonly socketAuthService: SocketAuthService) {}

  @Post('token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate socket authentication token',
    description:
      'Generates and returns an access token for authenticating WebSocket connections. Requires an authenticated session.',
  })
  @ApiResponse({
    status: 200,
    description: 'Socket token generated successfully',
    type: SocketTokenDto,
  })
  @ApiResponse({
    status: 401,
    description: 'User is not authenticated',
  })
  async generateSocketToken(@Session() session: UserSession | null): Promise<SocketTokenDto> {
    if (!session) {
      throw new UnauthorizedException('Authentication required');
    }

    return await this.socketAuthService.generateSocketToken(session);
  }
}
