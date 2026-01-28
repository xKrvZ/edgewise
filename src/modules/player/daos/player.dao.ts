import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { sql } from 'kysely';
import { PlayerDto } from '../dtos/player.dto';
import { PublicPlayerDto } from '../dtos/public-player.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { PlayerQueryDto } from '../dtos/player-query.dto';
import { OrderByDto } from '@/database/dtos/filter.dto';
import { DB } from '@/database/types/db';

@Injectable()
export class PlayerDao extends KyselyDao<PlayerDao> {
  static readonly TABLE = 'player' as keyof DB;

  // ==================== Private Helper Methods ====================

  private buildBaseQuery() {
    return (this.kysely as any)
      .selectFrom(PlayerDao.TABLE)
      .select((eb) => [
        'id',
        'externalId',
        'lastKnownUsername',
        'game',
        'createdAt',
        'updatedAt',
        // Always include hasOpenAbuseReports as boolean
        sql<boolean>`
          EXISTS (
            SELECT 1
            FROM abuse_report
            WHERE abuse_report."reportedPlayerId" = player.id
            AND abuse_report.status = 'pending'
          )
        `.as('hasOpenAbuseReports'),
      ]);
  }

  private buildPublicQuery() {
    return this.kysely
      .selectFrom(PlayerDao.TABLE)
      .select([
        'id',
        'externalId',
        'lastKnownUsername',
        'game',
      ]);
  }

  private buildFilterFunction(filters: { game?: string }) {
    return (query: any) => {
      let filteredQuery = query;

      if (filters.game) {
        filteredQuery = filteredQuery.where(`${PlayerDao.TABLE}.game`, '=', filters.game);
      }

      return filteredQuery;
    };
  }

  private mapOrderByField(field: string): string {
    const fieldMap: Record<string, string> = {
      id: `${PlayerDao.TABLE}.id`,
      createdAt: `${PlayerDao.TABLE}.createdAt`,
      updatedAt: `${PlayerDao.TABLE}.updatedAt`,
      lastKnownUsername: `${PlayerDao.TABLE}.lastKnownUsername`,
      game: `${PlayerDao.TABLE}.game`,
    };
    return fieldMap[field] || `${PlayerDao.TABLE}.${field}`;
  }

  private extractFilters(queryDto: PlayerQueryDto) {
    const filters: Record<string, any> = {};

    if (queryDto.game) {
      filters.game = queryDto.game;
    }

    return filters;
  }

  private getCursorField(queryDto: PlayerQueryDto): string {
    if (queryDto.orderBy?.field) {
      return this.mapOrderByField(queryDto.orderBy.field);
    }
    return `${PlayerDao.TABLE}.id`;
  }

  // ==================== Public Query Methods ====================

  async getAll(game?: string): Promise<PlayerDto[] | null> {
    let query = this.buildBaseQuery();

    if (game) {
      query = query.where('game', '=', game);
    }

    const results = await query.execute();

    return results.length > 0 ? (results as PlayerDto[]) : null;
  }

  async getAllPaginated(queryDto: PlayerQueryDto): Promise<PaginatedDto<PlayerDto>> {
    const filters = this.extractFilters(queryDto);
    const cursorField = this.getCursorField(queryDto);

    return await this.paginateWithCursor<any>(
      this.buildBaseQuery(),
      {
        cursor: queryDto.cursor,
        limit: queryDto.limit,
        direction: 'forward',
        cursorField,
        filters,
        orderBy: queryDto.orderBy,
        mapField: (field: string) => this.mapOrderByField(field),
        applyFilters: this.buildFilterFunction(filters),
      },
    ) as PaginatedDto<PlayerDto>;
  }

  async findById(id: string): Promise<PlayerDto | null> {
    const result = await this.buildBaseQuery()
      .where('id', '=', id)
      .executeTakeFirst();

    return (result as PlayerDto | undefined) ?? null;
  }

  async findByExternalId(externalId: string): Promise<PlayerDto | null> {
    const result = await this.buildBaseQuery()
      .where('externalId', '=', externalId)
      .executeTakeFirst();

    return (result as PlayerDto | undefined) ?? null;
  }

  async findByUsernamePaginated(
    username: string,
    game: string | undefined,
    cursor?: string,
    limit?: number,
    orderBy?: OrderByDto,
  ): Promise<PaginatedDto<PublicPlayerDto>> {
    const filters: { username: string; game?: string } = { username };
    if (game) {
      filters.game = game;
    }

    const cursorField = orderBy?.field
      ? this.mapOrderByField(orderBy.field)
      : `${PlayerDao.TABLE}.id`;

    const buildFilterFunction = (filters: { username: string; game?: string }) => {
      return (query: any) => {
        // Use ILIKE for case-insensitive partial matching
        let filteredQuery = query.where('lastKnownUsername', 'ilike', `%${filters.username}%`);
        if (filters.game) {
          filteredQuery = filteredQuery.where('game', '=', filters.game);
        }
        return filteredQuery;
      };
    };

    const result = await this.paginateWithCursor<any>(
      this.buildPublicQuery(),
      {
        cursor,
        limit,
        direction: 'forward',
        cursorField,
        filters,
        orderBy,
        mapField: (field: string) => this.mapOrderByField(field),
        applyFilters: buildFilterFunction(filters),
      },
    );

    // Map results to PublicPlayerDto
    const publicItems: PublicPlayerDto[] = result.items.map((item: any) => ({
      id: String(item.id),
      externalId: item.externalId as string,
      lastKnownUsername: item.lastKnownUsername as string,
      game: item.game as string,
    }));

    return new PaginatedDto<PublicPlayerDto>({
      items: publicItems,
      previousCursor: result.previousCursor,
      nextCursor: result.nextCursor,
    });
  }

  async findByIds(ids: string[]): Promise<Map<string, PlayerDto>> {
    if (ids.length === 0) {
      return new Map();
    }

    const players = await this.buildBaseQuery()
      .where('id', 'in', ids)
      .execute();

    const playerMap = new Map<string, PlayerDto>();
    for (const player of players) {
      if (!player.id) continue;
      const playerId = String(player.id);
      playerMap.set(playerId, {
        id: playerId,
        externalId: player.externalId as string,
        lastKnownUsername: player.lastKnownUsername as string,
        game: player.game as string,
        createdAt: player.createdAt,
        updatedAt: player.updatedAt,
        hasOpenAbuseReports: Boolean(player.hasOpenAbuseReports),
      } as PlayerDto);
    }

    return playerMap;
  }

  async getDistinctGameTypes(): Promise<string[]> {
    const results = await this.kysely
      .selectFrom(PlayerDao.TABLE)
      .select('game')
      .distinct()
      .orderBy('game', 'asc')
      .execute();

    return results.map((row) => row.game as string).filter((game) => game != null);
  }

  // ==================== Public Mutation Methods ====================

  async upsert(
    externalId: string,
    lastKnownUsername: string,
    game: string,
  ): Promise<PlayerDto> {
    const result = await (this.kysely as any)
      .insertInto(PlayerDao.TABLE)
      .values({
        externalId,
        lastKnownUsername,
        game,
        updatedAt: sql`now()`,
      })
      .onConflict((oc) =>
        oc.columns(['externalId', 'game']).doUpdateSet({
          lastKnownUsername,
          updatedAt: sql`now()`,
        }),
      )
      .returning(['id'])
      .executeTakeFirstOrThrow();

    // Fetch the full player data including hasOpenAbuseReports
    const playerId = String(result.id);
    const player = await this.findById(playerId);
    if (!player) {
      throw new Error(`Failed to retrieve player with ID ${playerId} after upsert`);
    }

    return player;
  }
}
