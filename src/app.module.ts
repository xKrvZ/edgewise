import {
  Module,
  ClassSerializerInterceptor,
} from "@nestjs/common";
import { ConfigModule, ConfigService, registerAs } from "@nestjs/config";
import appConfig from "@/config/app.config";
import sqlConfig from "@/config/sql.config";
import redisConfig from "@/config/redis.config";
import { SocketModule } from "@/modules/socket/socket.module";
import { PlayerModule } from "@/modules/player/player.module";
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
        auth: betterAuth({
          database: await postgresService.getPool(),
          ...authOptions,
        })
      }),
      inject: [PostgresService],
    }),
    SocketModule,
    PlayerModule,
  ],
  providers: [
    {
      provide: "APP_FILTER",
      useClass: AllExceptionFilter,
    },
    {
      provide: "APP_INTERCEPTOR",
      useClass: ClassSerializerInterceptor,
    },
  ],
})
export class AppModule {}
