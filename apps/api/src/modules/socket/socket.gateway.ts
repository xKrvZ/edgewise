import { WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { AuthenticatedSocketGateway } from "@/modules/socket/gateways/authenticated.gateway";
import { AuthenticatedSocket } from "@/modules/socket/types/authenticated-socket.interface";
import { SocketSession } from "@/modules/socket/types/socket-session.interface";

@WebSocketGateway({
  cors: { origin: "*" },
})
export class SocketGateway extends AuthenticatedSocketGateway {
  @WebSocketServer()
  server: Server;

  /** Permits anonymous connections; a valid token upgrades the socket to an authenticated session. */
  protected readonly requireAuth = false;

  constructor(jwtService: JwtService) {
    super(jwtService);
  }

  protected onConnected(
    client: AuthenticatedSocket,
    session: SocketSession | null,
  ): void {
    client.emit("session.user.id", session?.user.id ?? null);
  }
}
