import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server } from 'socket.io';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { AuthenticatedSocketGateway } from '@/modules/socket/gateways/authenticated.gateway';
import { AuthenticatedSocket } from '@/modules/socket/types/authenticated-socket.interface';
import { MarketDataService } from '@/modules/market-data/services/market-data.service';
import {
  INTERVAL_MS,
  MAX_CANDLES,
  REPLAY_BASE_TICK_MS,
} from '@/modules/market-data/constants/market-data.constants';
import { CandlesSubscribeDto } from '@/modules/market-data/dtos/candles-subscribe.dto';
import { CandlesUnsubscribeDto } from '@/modules/market-data/dtos/candles-unsubscribe.dto';

/**
 * Authenticated, namespaced ({@link /market-data}) gateway that streams OHLCV
 * candles to the frontend. Reuses the SAME short-lived JWT handshake as
 * {@link SocketGateway}: the client first calls `POST /api/socket/token`
 * (cookie-authenticated), then connects with `auth: { accessToken }`.
 *
 * EVENT CONTRACT (single source of truth, shared with apps/web):
 *   client → server  `candles:subscribe`   { requestId, symbol, interval, from, to, mode, speed? }
 *   server → client  `candles:snapshot`    { requestId, candles }            // mode "snapshot"
 *   server → client  `candles:tick`        { requestId, candle }             // mode "replay", in order
 *   server → client  `candles:complete`    { requestId }                     // end of a replay stream
 *   client → server  `candles:unsubscribe` { requestId }                     // cancel an in-flight replay
 *   server → client  `candles:error`       { requestId, message }
 */
@WebSocketGateway({
  namespace: 'market-data',
  cors: { origin: true, credentials: true },
})
export class MarketDataGateway extends AuthenticatedSocketGateway {
  @WebSocketServer()
  server: Server;

  /** Active replay timers, keyed by socket id then requestId. */
  private readonly streams = new Map<string, Map<string, NodeJS.Timeout>>();

  constructor(
    jwtService: JwtService,
    private readonly marketDataService: MarketDataService,
  ) {
    super(jwtService);
  }

  protected onConnected(client: AuthenticatedSocket): void {
    this.streams.set(client.id, new Map());
  }

  protected onDisconnected(client: AuthenticatedSocket): void {
    this.clearClientStreams(client.id);
  }

  @SubscribeMessage('candles:subscribe')
  async handleSubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: unknown,
  ): Promise<void> {
    if (!client.session?.user?.id) {
      client.disconnect();
      return;
    }

    const dto = this.validate(CandlesSubscribeDto, body);
    if (!dto) {
      this.emitError(client, this.requestIdOf(body), 'Invalid subscribe payload');
      return;
    }

    if (dto.to <= dto.from) {
      this.emitError(client, dto.requestId, '`to` must be greater than `from`');
      return;
    }

    // Bound the candle count before generating anything.
    const step = INTERVAL_MS[dto.interval];
    const estimated = Math.floor((dto.to - dto.from) / step) + 1;
    if (estimated > MAX_CANDLES) {
      this.emitError(
        client,
        dto.requestId,
        `Requested window is too large (max ${MAX_CANDLES} candles)`,
      );
      return;
    }

    let candles;
    try {
      candles = await this.marketDataService.getCandles(
        dto.symbol,
        dto.from,
        dto.to,
        dto.interval,
      );
    } catch (error) {
      this.logger.error(
        `getCandles failed for ${dto.symbol}/${dto.interval}`,
        error as Error,
      );
      this.emitError(client, dto.requestId, 'Failed to load market data');
      return;
    }

    if (dto.mode === 'snapshot') {
      client.emit('candles:snapshot', {
        requestId: dto.requestId,
        candles,
      });
      return;
    }

    this.startReplay(client, dto.requestId, candles, dto.speed ?? 1);
  }

  @SubscribeMessage('candles:unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() body: unknown,
  ): void {
    const dto = this.validate(CandlesUnsubscribeDto, body);
    if (!dto) return;
    this.clearStream(client.id, dto.requestId);
  }

  /** Streams candles in order at a cadence derived from `speed`. */
  private startReplay(
    client: AuthenticatedSocket,
    requestId: string,
    candles: { time: number }[],
    speed: number,
  ): void {
    // Replace any existing stream for this requestId.
    this.clearStream(client.id, requestId);

    if (candles.length === 0) {
      client.emit('candles:complete', { requestId });
      return;
    }

    const delay = Math.max(1, Math.round(REPLAY_BASE_TICK_MS / speed));
    let index = 0;

    const timer = setInterval(() => {
      if (index >= candles.length) {
        this.clearStream(client.id, requestId);
        client.emit('candles:complete', { requestId });
        return;
      }
      client.emit('candles:tick', {
        requestId,
        candle: candles[index],
      });
      index++;
    }, delay);

    const clientStreams =
      this.streams.get(client.id) ?? new Map<string, NodeJS.Timeout>();
    clientStreams.set(requestId, timer);
    this.streams.set(client.id, clientStreams);
  }

  private clearStream(clientId: string, requestId: string): void {
    const clientStreams = this.streams.get(clientId);
    const timer = clientStreams?.get(requestId);
    if (timer) {
      clearInterval(timer);
      clientStreams?.delete(requestId);
    }
  }

  private clearClientStreams(clientId: string): void {
    const clientStreams = this.streams.get(clientId);
    if (clientStreams) {
      for (const timer of clientStreams.values()) clearInterval(timer);
    }
    this.streams.delete(clientId);
  }

  private emitError(
    client: AuthenticatedSocket,
    requestId: string,
    message: string,
  ): void {
    client.emit('candles:error', { requestId, message });
  }

  private requestIdOf(body: unknown): string {
    if (
      body &&
      typeof body === 'object' &&
      typeof (body as { requestId?: unknown }).requestId === 'string'
    ) {
      return (body as { requestId: string }).requestId;
    }
    return '';
  }

  /** Validates a plain payload against a DTO; returns null on any violation. */
  private validate<T extends object>(
    cls: new () => T,
    body: unknown,
  ): T | null {
    if (!body || typeof body !== 'object') return null;
    const instance = plainToInstance(cls, body, {
      enableImplicitConversion: true,
    });
    const errors = validateSync(instance as object, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });
    return errors.length === 0 ? instance : null;
  }
}
