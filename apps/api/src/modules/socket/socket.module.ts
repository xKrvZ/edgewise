import { Module } from "@nestjs/common";
import { SocketGateway } from "./socket.gateway";
import { SocketAuthController } from "./controllers/socket-auth.controller";
import { SocketAuthService } from "./services/socket-auth.service";

@Module({
  controllers: [SocketAuthController],
  providers: [SocketGateway, SocketAuthService],
  exports: [SocketGateway, SocketAuthService],
})
export class SocketModule {}
