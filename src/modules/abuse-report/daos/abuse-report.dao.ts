import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { AbuseReportDto, ReportStatus } from '../dtos/abuse-report.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { AbuseReportQueryDto } from '../dtos/abuse-report-query.dto';
import { PlayerDao } from '@/modules/player/daos/player.dao';
import { ReportReason } from '../constants/report-reason.constants';
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
          'description',
          'status',
          'punishmentId',
          'metadata',
          'createdAt',
          'reportingPlayerId',
          'reportedPlayerId',
          // Always include report reasons as JSON array
          eb
            .selectFrom('abuse_report_reason')
            .select((eb) => [
              eb.fn('COALESCE', [
                eb.fn('json_agg', [eb.ref('abuse_report_reason.reportReason')]),
                sql`'[]'::json`,
              ]).as('reasons'),
            ])
            .whereRef('abuse_report_reason.abuseReportId', '=', 'abuse_report.id')
            .as('reportReasons'),
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

    // Extract report reasons from JSON array
    let reportReasons: ReportReason[] = [];
    if (row.reportReasons) {
      if (row.reportReasons.reasons) {
        // If it's an object with a 'reasons' property (from json_agg)
        reportReasons = Array.isArray(row.reportReasons.reasons)
          ? (row.reportReasons.reasons as ReportReason[])
          : [];
      } else if (Array.isArray(row.reportReasons)) {
        // If it's already an array
        reportReasons = row.reportReasons as ReportReason[];
      }
    }

    return {
      id: row.id,
      reportingPlayer: includePlayer ? row.reportingPlayer ?? undefined : undefined,
      reportedPlayer: includePlayer ? row.reportedPlayer ?? undefined : undefined,
      reportReasons,
      description: row.description ?? undefined,
      status: row.status as ReportStatus,
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
      reportReason?: ReportReason[];
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

      if (filters.reportReason && filters.reportReason.length > 0) {
        // Filter by report reason(s) using EXISTS subquery with IN clause
        filteredQuery = filteredQuery.where((eb) =>
          eb.exists(
            eb
              .selectFrom('abuse_report_reason')
              .select('abuse_report_reason.id')
              .whereRef('abuse_report_reason.abuseReportId', '=', 'abuse_report.id')
              .where('abuse_report_reason.reportReason', 'in', filters.reportReason!),
          ),
        );
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
    if (queryDto.reportReason) {
      filters.reportReason = queryDto.reportReason;
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

    return await this.paginateWithCursor<AbuseReportDto>(
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
    punishmentId?: string | null,
    includes?: Set<string>,
  ): Promise<AbuseReportDto | null> {
    await this.updateWithTimestamp(AbuseReportDao.TABLE)
      .set({
        status,
        punishmentId: punishmentId ?? null,
      })
      .where('id', '=', id)
      .execute();

    return await this.findById(id, includes);
  }
}
