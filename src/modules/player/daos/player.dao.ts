import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { sql } from 'kysely';
import { PlayerDto } from '../dtos/player.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { PlayerQueryDto } from '../dtos/player-query.dto';
import { DB } from '@/database/types/db';

@Injectable()
export class PlayerDao extends KyselyDao<PlayerDao> {
  static readonly TABLE = 'player' as keyof DB;

  // ==================== Private Helper Methods ====================

  private buildBaseQuery() {
    return this.kysely
      .selectFrom(PlayerDao.TABLE)
      .select([
        'id',
        'externalId',
        'lastKnownUsername',
        'game',
        'createdAt',
        'updatedAt',
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
    const result = await this.kysely
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
      .returning([
        'id',
        'externalId',
        'lastKnownUsername',
        'game',
        'createdAt',
        'updatedAt',
      ])
      .executeTakeFirstOrThrow();

    return result as PlayerDto;
  }
}
