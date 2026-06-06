import type { INestApplicationContext } from "@nestjs/common";
import { Logger } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { ServerOptions } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";

const logger = new Logger("SocketIOAdapter");

export class SocketIOAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter> | undefined;
  private readonly app: INestApplicationContext & {
    getHttpServer?: () => unknown;
  };

  constructor(
    app: INestApplicationContext & { getHttpServer?: () => unknown },
  ) {
    super(app);
    this.app = app;
  }

  connect(redisClient: Redis): void {
    try {
      this.adapterConstructor = createAdapter(
        redisClient.duplicate(),
        redisClient.duplicate(),
      );
    } catch (err) {
      logger.warn(
        `Redis adapter unavailable; WebSockets will run without cross-instance sync (${err instanceof Error ? err.message : err})`,
      );
    }
  }

  createIOServer(port: number, options?: ServerOptions): any {
    // AbstractWsAdapter only unwraps the real Node HTTP server when the passed
    // value is `instanceof NestApplication`. With duplicate @nestjs/core copies
    // in the dependency tree that check fails, so `this.httpServer` ends up being
    // the Nest application proxy (which lacks EventEmitter methods like
    // `listeners`) and engine.io's `attach` throws. Re-resolve the underlying
    // HTTP server defensively so the gateway can attach correctly.
    const current = this.httpServer as { listeners?: unknown } | undefined;
    if (!current || typeof current.listeners !== "function") {
      const real = this.app?.getHttpServer?.();
      if (real) {
        (this as unknown as { httpServer: unknown }).httpServer = real;
      }
    }

    const server = super.createIOServer(port, options);
    if (this.adapterConstructor) {
      try {
        server.adapter(this.adapterConstructor);
      } catch (err) {
        logger.warn(
          `Could not attach Redis adapter; WebSockets will run in single-instance mode (${err instanceof Error ? err.message : err})`,
        );
      }
    }
    return server;
  }
}
