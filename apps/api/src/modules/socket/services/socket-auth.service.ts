import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SocketTokenDto } from '../dtos/socket-token.dto';
import { UserSession } from '@thallesp/nestjs-better-auth';

@Injectable()
export class SocketAuthService {
  constructor(private readonly jwtService: JwtService) {}

  async generateSocketToken(session: UserSession): Promise<SocketTokenDto> {
    const expiresIn = 60; // 60 seconds - token should only be used to authenticate socket, then forgotten

    const payload = {
      sub: session.user.id,
      type: 'socket',
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      expiresIn: `${expiresIn}s`,
    });

    return {
      accessToken,
      expiresIn: expiresIn,
    };
  }
}
