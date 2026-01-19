import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { AppealDto, AppealStatus } from '../dtos/appeal.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { AppealQueryDto } from '../dtos/appeal-query.dto';
import { PunishmentDao } from '@/modules/punishment/daos/punishment.dao';
import { UserDao } from '@/modules/user/daos/user.dao';
import { DB } from '@/database/types/db';
import { sql } from 'kysely';

@Injectable()
export class AppealDao extends KyselyDao<AppealDao> {
  static readonly TABLE = 'appeal' as keyof DB;

  // ==================== Private Helper Methods ====================

  private buildBaseQuery(includes?: Set<string>) {
    const includeUser = includes?.has('user') ?? false;

    return (this.kysely as any)
      .selectFrom(AppealDao.TABLE)
      .select((eb) => {
        const selects: any[] = [
          'id',
          'playerId',
          'punishmentId',
          'submittedAt',
          'status',
          'reviewedById',
          // Always include punishmentType as it's required by the DTO
          eb
            .selectFrom(PunishmentDao.TABLE)
            .select('punishment.punishmentType')
            .where('punishment.id', '=', eb.ref('appeal.punishmentId'))
            .as('punishmentType'),
        ];

        // Conditionally include user subquery (reviewedBy)
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
              .where('user.id', '=', eb.ref('appeal.reviewedById'))
              .as('reviewedBy'),
          );
        }

        return selects;
      });
  }

  private mapRowToDto(row: any, includes?: Set<string>): AppealDto {
    const includeUser = includes?.has('user') ?? false;

    return {
      id: row.id,
      playerId: row.playerId,
      punishmentId: row.punishmentId,
      punishmentType: row.punishmentType!,
      submittedAt: row.submittedAt.toISOString(),
      status: row.status as AppealStatus,
      reviewedBy: includeUser ? row.reviewedBy ?? undefined : undefined,
    } as AppealDto;
  }

  private buildFilterFunction(
    filters: {
      status?: AppealStatus;
      playerId?: string;
      punishmentId?: string;
    },
  ) {
    return (query: any) => {
      let filteredQuery = query;

      if (filters.status) {
        filteredQuery = filteredQuery.where('status', '=', filters.status);
      }

      if (filters.playerId) {
        filteredQuery = filteredQuery.where('playerId', '=', filters.playerId);
      }

      if (filters.punishmentId) {
        filteredQuery = filteredQuery.where('punishmentId', '=', filters.punishmentId);
      }

      return filteredQuery;
    };
  }

  private mapOrderByField(field: string): string {
    const fieldMap: Record<string, string> = {
      id: 'id',
      submittedAt: 'submittedAt',
      status: 'status',
      playerId: 'playerId',
      punishmentId: 'punishmentId',
    };
    return fieldMap[field] || field;
  }

  private extractFilters(queryDto: AppealQueryDto) {
    const filters: Record<string, any> = {};

    if (queryDto.status !== undefined) {
      filters.status = queryDto.status;
    }
    if (queryDto.playerId) {
      filters.playerId = queryDto.playerId;
    }
    if (queryDto.punishmentId) {
      filters.punishmentId = queryDto.punishmentId;
    }

    return filters;
  }

  private getCursorField(queryDto: AppealQueryDto): string {
    if (queryDto.orderBy?.field) {
      return this.mapOrderByField(queryDto.orderBy.field);
    }
    return 'id';
  }

  // ==================== Public Query Methods ====================

  async getAll(status?: AppealStatus, includes?: Set<string>): Promise<AppealDto[] | null> {
    let query = this.buildBaseQuery(includes);

    if (status) {
      query = query.where('status', '=', status);
    }

    const results = await query.execute();

    if (results.length === 0) {
      return null;
    }

    return results.map((row: any) => this.mapRowToDto(row, includes));
  }

  async getAllPaginated(
    queryDto: AppealQueryDto,
    includes?: Set<string>,
  ): Promise<PaginatedDto<AppealDto>> {
    const filters = this.extractFilters(queryDto);
    const cursorField = this.getCursorField(queryDto);

    const result = await this.paginateWithCursor(this.buildBaseQuery(includes), {
      cursor: queryDto.cursor,
      limit: queryDto.limit,
      direction: 'forward',
      cursorField: cursorField,
      filters,
      orderBy: queryDto.orderBy,
      mapField: (field: string) => this.mapOrderByField(field),
      applyFilters: this.buildFilterFunction(filters),
    });

    const items = result.items.map((row: any) => this.mapRowToDto(row, includes));

    return new PaginatedDto<AppealDto>({
      items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  }

  async findById(id: string, includes?: Set<string>): Promise<AppealDto | null> {
    const result = await this.buildBaseQuery(includes)
      .where('id', '=', id)
      .executeTakeFirst();

    if (!result) {
      return null;
    }
    return this.mapRowToDto(result, includes);
  }

  async findByPlayerId(playerId: string, includes?: Set<string>): Promise<AppealDto[] | null> {
    const results = await this.buildBaseQuery(includes)
      .where('playerId', '=', playerId)
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results.map((row: any) => this.mapRowToDto(row, includes));
  }

  async findByPunishmentId(
    punishmentId: string,
    includes?: Set<string>,
  ): Promise<AppealDto[] | null> {
    const results = await this.buildBaseQuery(includes)
      .where('punishmentId', '=', punishmentId)
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results.map((row: any) => this.mapRowToDto(row, includes));
  }

  // ==================== Public Mutation Methods ====================

  async updateStatus(
    id: string,
    status: AppealStatus,
    reviewedById: string,
    includes?: Set<string>,
  ): Promise<AppealDto | null> {
    await (this.kysely as any)
      .updateTable(AppealDao.TABLE)
      .set({
        status,
        reviewedById,
      })
      .where('id', '=', id)
      .execute();

    return await this.findById(id, includes);
  }
}
