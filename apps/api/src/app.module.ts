import {
  Module,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { ConfigModule, ConfigService, registerAs } from "@nestjs/config";
import appConfig from "@/config/app.config";
import sqlConfig from "@/config/sql.config";
import redisConfig from "@/config/redis.config";
import s3Config from "@/config/s3.config";
import { SocketModule } from "@/modules/socket/socket.module";
import { EmailModule } from "@/modules/email/email.module";
import { AllExceptionFilter } from "@/filters/all-exception.filter";
import cookieConfig from "@/config/cookie.config";
import { CacheModule } from "@nestjs/cache-manager";
import { ScheduleModule } from "@nestjs/schedule";
import { KeyvAnyRedis } from "keyv-anyredis";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { JwtModule } from "@nestjs/jwt";
import Keyv from "keyv";
import { RedisModule } from "@/redis/redis.module";
import Redis from "ioredis";
import { REDIS_CLIENT } from "@/redis/constants/redis.constants";
import { DATABASE_POOL } from "./postgres/constants/postgres.constants";
import { KyselyModule } from "nestjs-kysely";
import { PostgresModule } from "./postgres/postgres.module";
import { PostgresDialect } from "kysely";
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { PostgresService } from "./postgres/services/postgres.service";
import { authOptions } from "./auth";
import { betterAuth } from "better-auth";
import { AccountModule } from "@/modules/account/account.module";
import { TradeModule } from "@/modules/trade/trade.module";
import { TagModule } from "@/modules/tag/tag.module";
import { MistakeModule } from "@/modules/mistake/mistake.module";
import { PlaybookModule } from "@/modules/playbook/playbook.module";
import { ScreenshotModule } from "@/modules/screenshot/screenshot.module";
import { TradingSessionModule } from "@/modules/trading-session/trading-session.module";
import { BacktestModule } from "@/modules/backtest/backtest.module";
import { JournalEntryModule } from "@/modules/journal-entry/journal-entry.module";
import { AnalyticsModule } from "@/modules/analytics/analytics.module";
import { AnalyticsCacheModule } from "@/modules/analytics/cache/analytics-cache.module";
import { StorageModule } from "@/modules/storage/storage.module";
import { AiReviewModule } from "@/modules/ai-review/ai-review.module";
import { HealthModule } from "@/modules/health/health.module";
import { MarketDataModule } from "@/modules/market-data/market-data.module";
import { SharingModule } from "@/modules/sharing/sharing.module";
import { CommunityModule } from "@/modules/community/community.module";
import { CommentModule } from "@/modules/comment/comment.module";
import { NotificationModule } from "@/modules/notification/notification.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      isGlobal: true,
      load: [
        registerAs('app', () => appConfig),
        registerAs('cookie', () => cookieConfig),
        registerAs('sql', () => sqlConfig), 
        registerAs('redis', () => redisConfig),
        registerAs('s3', () => s3Config),
        registerAs('email', () => require('@/config/email.config').default),
      ],
    }),
    EventEmitterModule.forRoot(),
    RedisModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (redisClient: Redis) => {
        return {
          stores: [
            new Keyv({
              store: new KeyvAnyRedis(redisClient),
            }),
          ],
        };
      },
      inject: [REDIS_CLIENT],
      isGlobal: true,
    }),
    PostgresModule,
    ScheduleModule.forRoot(),
    KyselyModule.forRootAsync({
      imports: [PostgresModule],
      inject: [DATABASE_POOL],
      useFactory: (postgresPool: any) => ({
        dialect: new PostgresDialect({
          pool: postgresPool,
        }),
      }),
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>("app.secret"),
      }),
      inject: [ConfigService],
      global: true,
    }),
    AuthModule.forRootAsync({
      imports: [PostgresModule],
      useFactory: async (postgresService: PostgresService) => ({
        disableTrustedOriginsCors: true,
        auth: betterAuth({
          database: await postgresService.getPool(),
          ...authOptions,
        }),
      }),
      inject: [PostgresService],
    }),
    SocketModule,
    EmailModule,
    StorageModule,
    AccountModule,
    TradeModule,
    TagModule,
    MistakeModule,
    PlaybookModule,
    ScreenshotModule,
    TradingSessionModule,
    BacktestModule,
    JournalEntryModule,
    AnalyticsCacheModule,
    AnalyticsModule,
    AiReviewModule,
    HealthModule,
    MarketDataModule,
    SharingModule,
    CommunityModule,
    CommentModule,
    NotificationModule,
  ],
  providers: [
    {
      provide: "APP_FILTER",
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
