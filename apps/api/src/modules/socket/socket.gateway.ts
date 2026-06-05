import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { Logger } from "@nestjs/common";
import { AuthenticatedSocket } from "@/modules/socket/types/authenticated-socket.interface";
import { SocketSession } from "@/modules/socket/types/socket-session.interface";

@WebSocketGateway({
  cors: { origin: "*" },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SocketGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract access_token from handshake auth or query
      const accessToken =
        client.handshake.auth?.accessToken || client.handshake.query?.accessToken;

      // If access_token is provided, authenticate the socket
      if (accessToken && typeof accessToken === "string") {
        try {
          // Verify and decode the JWT access_token
          const payload = await this.jwtService.verifyAsync(accessToken);

          // Verify it's a socket token
          if (payload.type !== "socket") {
            this.logger.warn(
              `Socket connection rejected: Invalid token type (${client.id})`,
            );
            client.disconnect();
            return;
          }

          // Store authentication data on the socket
          // The session data structure matches what was in the token
          client.session = {
            user: {
              id: payload.sub,
            },
          } as SocketSession;

          this.logger.log(
            `Socket authenticated: User ${payload.sub}, Client ${client.id}`,
          );

          client.emit("session.user.id", client.session.user.id);
        } catch (error) {
          this.logger.warn(
            `Socket connection rejected: Access token verification failed (${client.id})`,
            error,
          );
          client.disconnect();
          return;
        }
      } else {
        // Anonymous connection - no authentication required
        this.logger.log(`Anonymous socket connected: ${client.id}`);
        client.emit("session.user.id", null);
      }
    } catch (error) {
      this.logger.error(
        `Socket connection error (${client.id}):`,
        error,
      );
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Socket disconnected: ${client.id}`);
  }
}
