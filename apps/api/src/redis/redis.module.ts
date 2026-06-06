import { Global, Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '@/redis/constants/redis.constants';

const logger = new Logger('RedisModule');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('redis.host');
        const port = configService.get<number>('redis.port');
        const password = configService.get<string>('redis.password');
        const db = configService.get<number>('redis.db');

        const client = new Redis({
          port,
          host,
          password,
          db,
          // Avoid crashing the process when Redis is down (e.g. Docker not running).
          maxRetriesPerRequest: null,
          retryStrategy: (times) => Math.min(times * 200, 5_000),
        });

        client.on('error', (err) => {
          logger.warn(`Redis unavailable: ${err.message}`);
        });

        return client;
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}