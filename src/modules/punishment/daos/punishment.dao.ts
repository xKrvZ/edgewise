import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { PunishmentDto } from '../dtos/punishment.dto';
import { CreatePunishmentDto } from '../dtos/create-punishment.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { PunishmentQueryDto } from '../dtos/punishment-query.dto';
import { PlayerDao } from '@/modules/player/daos/player.dao';
import { UserDao } from '@/modules/user/daos/user.dao';
import { sql } from 'kysely';
import { DB } from '@/database/types/db';

@Injectable()
export class PunishmentDao extends KyselyDao<PunishmentDao> {
  static readonly TABLE = 'punishment' as keyof DB;

  // ==================== Private Helper Methods ====================

  private parseIncludes(include?: string): Set<string> {
    if (!include) {
      return new Set();
    }
    return new Set(include.split(',').map((i) => i.trim().toLowerCase()));
  }

  private buildBaseQuery(includes?: Set<string>) {
    const includePlayer = includes?.has('player') ?? false;
    const includeUser = includes?.has('user') ?? false;

    return (this.kysely as any)
      .selectFrom(PunishmentDao.TABLE)
      .select((eb) => {
        const selects: any[] = [
          'id',
          'punishmentType',
          'banType',
          'reason',
          'expiry',
          'createdAt',
          'lifted',
          'liftedAt',
          'liftReason',
          'relatedAbuseReportId',
          'playerId',
          'issuedById',
          'liftedById',
        ];

        // Conditionally include player subquery
        if (includePlayer) {
          selects.push(
            eb
              .selectFrom(PlayerDao.TABLE)
              .select((eb) => [
                eb.fn('json_build_object', [
                  sql.lit('id'),
                  eb.ref('player.id'),
                  sql.lit('lastKnownUsername'),
                  eb.ref('player.lastKnownUsername'),
                  sql.lit('externalId'),
                  eb.ref('player.externalId'),
                ]),
              ])
              .where('player.id', '=', eb.ref('punishment.playerId'))
              .as('player'),
          );
        }

        // Conditionally include user subqueries (issuedBy and liftedBy)
        if (includeUser) {
          selects.push(
            eb
              .selectFrom(UserDao.TABLE)
              .select((eb) => [
                eb.fn('json_build_object', [
                  sql.lit('id'),
                  eb.ref('user.id'),
                  sql.lit('name'),
                  eb.ref('user.name'),
                  sql.lit('role'),
                  eb.fn('COALESCE', [eb.ref('user.role'), sql.lit('')]),
                ]),
              ])
              .where('user.id', '=', eb.ref('punishment.issuedById'))
              .as('issuedBy'),
          );
          selects.push(
            eb
              .selectFrom(UserDao.TABLE)
              .select((eb) => [
                eb.fn('json_build_object', [
                  sql.lit('id'),
                  eb.ref('user.id'),
                  sql.lit('name'),
                  eb.ref('user.name'),
                  sql.lit('role'),
                  eb.fn('COALESCE', [eb.ref('user.role'), sql.lit('')]),
                ]),
              ])
              .where('user.id', '=', eb.ref('punishment.liftedById'))
              .as('liftedBy'),
          );
        }

        return selects;
      });
  }

  private mapRowToDto(row: any, includes?: Set<string>): PunishmentDto {
    const includePlayer = includes?.has('player') ?? false;
    const includeUser = includes?.has('user') ?? false;

    return {
      id: row.id,
      punishmentType: row.punishmentType as 'ban' | 'mute' | 'kick',
      banType: row.banType as 'permanent' | 'temporary' | null | undefined,
      reason: row.reason,
      expiry: row.expiry ? row.expiry.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      player: includePlayer && row.player
        ? {
            id: row.player.id,
            lastKnownUsername: row.player.lastKnownUsername,
            externalId: row.player.externalId ?? undefined,
          }
        : undefined,
      issuedBy: includeUser ? row.issuedBy ?? undefined : undefined,
      lifted: row.lifted,
      liftedBy: includeUser ? row.liftedBy ?? undefined : undefined,
      liftedAt: row.liftedAt ? row.liftedAt.toISOString() : null,
      liftReason: row.liftReason ?? null,
      relatedAbuseReportId: row.relatedAbuseReportId ?? null,
    } as PunishmentDto;
  }

  private buildFilterFunction(
    filters: {
      punishmentType?: 'ban' | 'mute' | 'kick';
      lifted?: boolean;
      playerId?: string;
      issuedById?: string;
    },
  ) {
    return (query: any) => {
      let filteredQuery = query;

      if (filters.punishmentType) {
        filteredQuery = filteredQuery.where('punishmentType', '=', filters.punishmentType);
      }

      if (filters.lifted !== undefined) {
        filteredQuery = filteredQuery.where('lifted', '=', filters.lifted);
      }

      if (filters.playerId) {
        filteredQuery = filteredQuery.where('playerId', '=', filters.playerId);
      }

      if (filters.issuedById) {
        filteredQuery = filteredQuery.where('issuedById', '=', filters.issuedById);
      }

      return filteredQuery;
    };
  }

  private mapOrderByField(field: string): string {
    const fieldMap: Record<string, string> = {
      id: 'id',
      createdAt: 'createdAt',
      punishmentType: 'punishmentType',
      lifted: 'lifted',
      liftedAt: 'liftedAt',
    };
    return fieldMap[field] || field;
  }

  private extractFilters(queryDto: PunishmentQueryDto) {
    const filters: Record<string, any> = {};

    if (queryDto.punishmentType !== undefined) {
      filters.punishmentType = queryDto.punishmentType;
    }
    if (queryDto.lifted !== undefined) {
      filters.lifted = queryDto.lifted;
    }
    if (queryDto.playerId) {
      filters.playerId = queryDto.playerId;
    }
    if (queryDto.issuedById) {
      filters.issuedById = queryDto.issuedById;
    }

    return filters;
  }

  private getCursorField(queryDto: PunishmentQueryDto): string {
    if (queryDto.orderBy?.field) {
      return this.mapOrderByField(queryDto.orderBy.field);
    }
    return 'id';
  }

  // ==================== Public Query Methods ====================

  async getAll(
    filters?: {
      punishmentType?: 'ban' | 'mute' | 'kick';
      lifted?: boolean;
    },
    includes?: Set<string>,
  ): Promise<PunishmentDto[] | null> {
    let query = this.buildBaseQuery(includes);

    if (filters?.punishmentType) {
      query = query.where('punishmentType', '=', filters.punishmentType);
    }

    if (filters?.lifted !== undefined) {
      query = query.where('lifted', '=', filters.lifted);
    }

    const results = await query.execute();

    if (results.length === 0) {
      return null;
    }

    return results.map((row: any) => this.mapRowToDto(row, includes));
  }

  async getAllPaginated(
    queryDto: PunishmentQueryDto,
    includes?: Set<string>,
  ): Promise<PaginatedDto<PunishmentDto>> {
    const filters = this.extractFilters(queryDto);
    const cursorField = this.getCursorField(queryDto);

    return await this.paginateWithCursor<PunishmentDto>(
      this.buildBaseQuery(includes),
      {
        cursor: queryDto.cursor,
        limit: queryDto.limit,
        direction: 'forward',
        cursorField: cursorField,
        filters,
        orderBy: queryDto.orderBy,
        mapField: (field: string) => this.mapOrderByField(field),
        applyFilters: this.buildFilterFunction(filters),
      },
    );
  }

  async findById(id: string, includes?: Set<string>): Promise<PunishmentDto | null> {
    const result = await this.buildBaseQuery(includes)
      .where('id', '=', id)
      .executeTakeFirst();

    if (!result) {
      return null;
    }

    return this.mapRowToDto(result, includes);
  }

  async findByPlayerId(playerId: string, includes?: Set<string>): Promise<PunishmentDto[] | null> {
    const results = await this.buildBaseQuery(includes)
      .where('playerId', '=', playerId)
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results.map((row: any) => this.mapRowToDto(row, includes));
  }

  async findByIssuedBy(issuedById: string, includes?: Set<string>): Promise<PunishmentDto[] | null> {
    const results = await this.buildBaseQuery(includes)
      .where('issuedById', '=', issuedById)
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results.map((row: any) => this.mapRowToDto(row, includes));
  }

  // ==================== Public Mutation Methods ====================

  async create(
    data: CreatePunishmentDto,
    issuedById: string,
    includes?: Set<string>,
  ): Promise<PunishmentDto> {
    const result = await (this.kysely as any)
      .insertInto(PunishmentDao.TABLE)
      .values({
        punishmentType: data.punishmentType,
        banType: data.banType ?? null,
        reason: data.reason,
        expiry: data.expiry ? new Date(data.expiry) : null,
        playerId: data.playerId,
        externalId: data.externalId ?? null,
        issuedById,
        relatedAbuseReportId: data.relatedAbuseReportId ?? null,
        lifted: false,
      })
      .returning(['id'])
      .executeTakeFirstOrThrow();

    const punishment = await this.findById(result.id, includes);
    if (!punishment) {
      throw new Error('Failed to retrieve created punishment');
    }
    return punishment;
  }

  async lift(
    id: string,
    liftedById: string,
    liftReason?: string | null,
    includes?: Set<string>,
  ): Promise<PunishmentDto | null> {
    await (this.kysely as any)
      .updateTable(PunishmentDao.TABLE)
      .set({
        lifted: true,
        liftedById,
        liftedAt: sql`now()`,
        liftReason: liftReason ?? null,
      })
      .where('id', '=', id)
      .where('lifted', '=', false)
      .execute();

    return await this.findById(id, includes);
  }

  async liftBulk(
    playerIds: string[],
    startDate: Date,
    endDate: Date,
    liftedById: string,
  ): Promise<number> {
    const result = await (this.kysely as any)
      .updateTable(PunishmentDao.TABLE)
      .set({
        lifted: true,
        liftedById,
        liftedAt: sql`now()`,
      })
      .where('playerId', 'in', playerIds)
      .where('lifted', '=', false)
      .where('createdAt', '>=', startDate)
      .where('createdAt', '<=', endDate)
      .execute();

    return Number(result.numUpdatedRows || 0);
  }
}
