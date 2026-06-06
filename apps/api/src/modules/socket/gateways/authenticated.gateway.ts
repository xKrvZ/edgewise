import {
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedSocket } from '@/modules/socket/types/authenticated-socket.interface';
import { SocketSession } from '@/modules/socket/types/socket-session.interface';

/**
 * Reusable base class for authenticated socket.io gateways.
 *
 * Centralises the short-lived JWT handshake so individual gateways no longer
 * replicate connection-time auth. Concrete gateways extend this class, declare
 * their own `@WebSocketGateway()`/`@WebSocketServer()` (decorators must live on
 * the concrete class), and override the {@link onConnected}/{@link onDisconnected}
 * hooks instead of `handleConnection`/`handleDisconnect`.
 *
 * Auth flow (shared across all gateways): the cookie-authenticated client calls
 * `POST /api/socket/token` to obtain a short-lived JWT (`{ sub, type: 'socket' }`),
 * then connects with `auth: { accessToken }`. The token is verified here and the
 * resolved session is attached to `client.session`.
 *
 * Set {@link requireAuth} to `false` to permit anonymous connections (the socket
 * connects with `session` left undefined); the default is to reject any socket
 * without a valid token.
 */
export abstract class AuthenticatedSocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  protected readonly logger = new Logger(this.constructor.name);

  /** When true (default) sockets without a valid token are disconnected. */
  protected readonly requireAuth: boolean = true;

  constructor(protected readonly jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    const accessToken =
      client.handshake.auth?.accessToken ?? client.handshake.query?.accessToken;

    if (!accessToken || typeof accessToken !== 'string') {
      if (this.requireAuth) {
        this.logger.warn(`Socket rejected: missing token (${client.id})`);
        client.disconnect();
        return;
      }
      this.logger.log(`Anonymous socket connected: ${client.id}`);
      await this.onConnected(client, null);
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(accessToken);

      if (payload.type !== 'socket') {
        this.logger.warn(`Socket rejected: invalid token type (${client.id})`);
        client.disconnect();
        return;
      }

      client.session = { user: { id: payload.sub } } as SocketSession;
      this.logger.log(
        `Socket authenticated: user ${payload.sub} (${client.id})`,
      );
      await this.onConnected(client, client.session);
    } catch (error) {
      this.logger.warn(
        `Socket rejected: token verification failed (${client.id})`,
        error as Error,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.onDisconnected(client);
    this.logger.log(`Socket disconnected: ${client.id}`);
  }

  /**
   * Invoked after a socket successfully connects. `session` is the authenticated
   * session, or `null` for an anonymous connection (only possible when
   * {@link requireAuth} is `false`). Override to perform per-socket setup.
   */
  protected onConnected(
    _client: AuthenticatedSocket,
    _session: SocketSession | null,
  ): void | Promise<void> {}

  /** Invoked when a socket disconnects. Override to perform per-socket cleanup. */
  protected onDisconnected(_client: AuthenticatedSocket): void {}
}
