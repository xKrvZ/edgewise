import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { AbuseReportDto, ReportStatus } from '../dtos/abuse-report.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { AbuseReportQueryDto } from '../dtos/abuse-report-query.dto';
import { PlayerDao } from '@/modules/player/daos/player.dao';
import { DB } from '@/database/types/db';
import { sql } from 'kysely';

@Injectable()
export class AbuseReportDao extends KyselyDao<AbuseReportDao> {
  static readonly TABLE = 'abuse_report' as keyof DB;

  // ==================== Private Helper Methods ====================

  private buildBaseQuery(includes?: Set<string>) {
    const includePlayer = includes?.has('player') ?? false;

    return (this.kysely as any)
      .selectFrom(AbuseReportDao.TABLE)
      .select((eb) => {
        const selects: any[] = [
          'id',
          'reason',
          'description',
          'status',
          'actionTaken',
          'punishmentId',
          'metadata',
          'createdAt',
          'reportingPlayerId',
          'reportedPlayerId',
        ];

        // Conditionally include player subqueries
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
                ]),
              ])
              .where('player.id', '=', eb.ref('abuse_report.reportingPlayerId'))
              .as('reportingPlayer'),
            eb
              .selectFrom(PlayerDao.TABLE)
              .select((eb) => [
                eb.fn('json_build_object', [
                  sql.lit('id'),
                  eb.ref('player.id'),
                  sql.lit('lastKnownUsername'),
                  eb.ref('player.lastKnownUsername'),
                ]),
              ])
              .where('player.id', '=', eb.ref('abuse_report.reportedPlayerId'))
              .as('reportedPlayer'),
          );
        }

        return selects;
      });
  }

  private mapRowToDto(row: any, includes?: Set<string>): AbuseReportDto {
    const includePlayer = includes?.has('player') ?? false;

    return {
      id: row.id,
      reportingPlayer: includePlayer ? row.reportingPlayer ?? undefined : undefined,
      reportedPlayer: includePlayer ? row.reportedPlayer ?? undefined : undefined,
      reason: row.reason,
      description: row.description ?? undefined,
      status: row.status as ReportStatus,
      actionTaken: row.actionTaken as 'punishment' | 'no-punishment' | null,
      punishmentId: row.punishmentId ?? null,
      metadata: row.metadata as { chatLogs?: string[] } | undefined,
      createdAt: row.createdAt.toISOString(),
    } as AbuseReportDto;
  }

  private buildFilterFunction(
    filters: {
      status?: ReportStatus;
      reportingPlayerId?: string;
      reportedPlayerId?: string;
    },
  ) {
    return (query: any) => {
      let filteredQuery = query;

      if (filters.status) {
        filteredQuery = filteredQuery.where('status', '=', filters.status);
      }

      if (filters.reportingPlayerId) {
        filteredQuery = filteredQuery.where('reportingPlayerId', '=', filters.reportingPlayerId);
      }

      if (filters.reportedPlayerId) {
        filteredQuery = filteredQuery.where('reportedPlayerId', '=', filters.reportedPlayerId);
      }

      return filteredQuery;
    };
  }

  private mapOrderByField(field: string): string {
    const fieldMap: Record<string, string> = {
      id: 'id',
      createdAt: 'createdAt',
      status: 'status',
    };
    return fieldMap[field] || field;
  }

  private extractFilters(queryDto: AbuseReportQueryDto) {
    const filters: Record<string, any> = {};

    if (queryDto.status !== undefined) {
      filters.status = queryDto.status;
    }
    if (queryDto.reportingPlayerId) {
      filters.reportingPlayerId = queryDto.reportingPlayerId;
    }
    if (queryDto.reportedPlayerId) {
      filters.reportedPlayerId = queryDto.reportedPlayerId;
    }

    return filters;
  }

  private getCursorField(queryDto: AbuseReportQueryDto): string {
    if (queryDto.orderBy?.field) {
      return this.mapOrderByField(queryDto.orderBy.field);
    }
    return 'id';
  }

  // ==================== Public Query Methods ====================

  async getAll(status?: ReportStatus, includes?: Set<string>): Promise<AbuseReportDto[] | null> {
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
    queryDto: AbuseReportQueryDto,
    includes?: Set<string>,
  ): Promise<PaginatedDto<AbuseReportDto>> {
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

    return new PaginatedDto<AbuseReportDto>({
      items,
      nextCursor: result.nextCursor,
      hasMore: result.hasMore,
    });
  }

  async findById(id: string, includes?: Set<string>): Promise<AbuseReportDto | null> {
    const result = await this.buildBaseQuery(includes)
      .where('id', '=', id)
      .executeTakeFirst();

    if (!result) {
      return null;
    }

    return this.mapRowToDto(result, includes);
  }

  // ==================== Public Mutation Methods ====================

  async updateReview(
    id: string,
    status: ReportStatus,
    actionTaken: 'punishment' | 'no-punishment',
    punishmentId?: string | null,
    includes?: Set<string>,
  ): Promise<AbuseReportDto | null> {
    await (this.kysely as any)
      .updateTable(AbuseReportDao.TABLE)
      .set({
        status,
        actionTaken,
        punishmentId: punishmentId ?? null,
      })
      .where('id', '=', id)
      .execute();

    return await this.findById(id, includes);
  }
}
