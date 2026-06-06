import { Injectable, Logger } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { InjectRedis } from '@/redis/decorators/redis.decorator';

/**
 * Best-effort Redis cache for analytics responses.
 *
 * Correctness comes from a per-user version counter (`analytics:ver:{userId}`):
 * cache keys embed the current version, so bumping it on any trade write
 * abandons every previously cached entry for that user (stale keys then expire
 * via TTL). Every Redis interaction is wrapped so a cache outage degrades to a
 * normal (uncached) computation rather than failing the request.
 */
@Injectable()
export class AnalyticsCacheService {
  private readonly logger = new Logger(AnalyticsCacheService.name);

  /** Safety-net expiry; invalidation is driven by version bumps, not TTL. */
  private readonly ttlSeconds = 300;

  constructor(@InjectRedis() private readonly redis: Redis) {}

  /**
   * Returns the cached value for `suffix` under the user's current cache
   * version, otherwise computes it via `compute`, stores it, and returns it.
   * Never throws on cache failure — it falls back to computing.
   */
  async resolve<T>(
    userId: string,
    suffix: string,
    compute: () => Promise<T>,
  ): Promise<T> {
    const key = await this.buildKey(userId, suffix);

    if (key) {
      try {
        const hit = await this.redis.get(key);
        if (hit !== null) {
          return JSON.parse(hit) as T;
        }
      } catch (error) {
        this.logger.warn(`Cache read failed (${suffix})`, error as Error);
      }
    }

    const value = await compute();

    if (key) {
      try {
        await this.redis.set(key, JSON.stringify(value), 'EX', this.ttlSeconds);
      } catch (error) {
        this.logger.warn(`Cache write failed (${suffix})`, error as Error);
      }
    }

    return value;
  }

  /**
   * Invalidates all cached analytics for a user by bumping their version
   * counter. Best-effort: a failure leaves entries to expire via TTL.
   */
  async invalidateUser(userId: string): Promise<void> {
    try {
      await this.redis.incr(this.versionKey(userId));
    } catch (error) {
      this.logger.warn(
        `Failed to invalidate analytics cache for user ${userId}`,
        error as Error,
      );
    }
  }

  /** Drops a single version-scoped cache entry (e.g. backtest analytics). */
  async invalidateSuffix(userId: string, suffix: string): Promise<void> {
    const key = await this.buildKey(userId, suffix);
    if (!key) {
      return;
    }
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.warn(`Failed to invalidate cache (${suffix})`, error as Error);
    }
  }

  private versionKey(userId: string): string {
    return `analytics:ver:${userId}`;
  }

  /**
   * Builds a version-scoped cache key, or returns null (caching disabled for
   * this call) when the version lookup itself fails so computation can proceed.
   */
  private async buildKey(
    userId: string,
    suffix: string,
  ): Promise<string | null> {
    try {
      const version = (await this.redis.get(this.versionKey(userId))) ?? '0';
      return `analytics:${userId}:v${version}:${suffix}`;
    } catch (error) {
      this.logger.warn('Cache version lookup failed', error as Error);
      return null;
    }
  }
}
