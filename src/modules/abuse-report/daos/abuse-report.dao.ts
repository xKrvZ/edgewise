import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { AbuseReportDto, ReportStatus } from '../dtos/abuse-report.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { AbuseReportQueryDto } from '../dtos/abuse-report-query.dto';
import { PlayerDao } from '@/modules/player/daos/player.dao';
import { UserDao } from '@/modules/user/daos/user.dao';
import { ReportReason } from '../constants/report-reason.constants';
import { DB } from '@/database/types/db';
import { sql } from 'kysely';

@Injectable()
export class AbuseReportDao extends KyselyDao<AbuseReportDao> {
  static readonly TABLE = 'abuse_report' as keyof DB;

  // ==================== Private Helper Methods ====================

  private buildBaseQuery(includes?: Set<string>) {
    const includePlayer = includes?.has('player') ?? false;
    const includeUser = includes?.has('user') ?? false;

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
          'reporter',
          'reviewedBy',
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

        // Conditionally include user subqueries (reporter and reviewedBy)
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
              .where('user.id', '=', eb.ref('abuse_report.reporter'))
              .as('reporter'),
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
              .where('user.id', '=', eb.ref('abuse_report.reviewedBy'))
              .as('reviewedBy'),
          );
        }

        // Conditionally include player subquery (reportedPlayer)
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
              .where('player.id', '=', eb.ref('abuse_report.reportedPlayerId'))
              .as('reportedPlayer'),
          );
        }

        return selects;
      });
  }

  private mapRowToDto(row: any, includes?: Set<string>): AbuseReportDto {
    const includePlayer = includes?.has('player') ?? false;
    const includeUser = includes?.has('user') ?? false;

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
      reporter: includeUser ? row.reporter ?? undefined : undefined,
      reviewedBy: includeUser ? row.reviewedBy ?? undefined : undefined,
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
      reporter?: string;
      reportedPlayerId?: string;
      punishmentId?: string;
      reviewedBy?: string;
      reportReason?: ReportReason[];
    },
  ) {
    return (query: any) => {
      let filteredQuery = query;

      if (filters.status) {
        filteredQuery = filteredQuery.where('status', '=', filters.status);
      }

      if (filters.reporter) {
        filteredQuery = filteredQuery.where('reporter', '=', filters.reporter);
      }

      if (filters.reportedPlayerId) {
        filteredQuery = filteredQuery.where('reportedPlayerId', '=', filters.reportedPlayerId);
      }

      if (filters.punishmentId) {
        filteredQuery = filteredQuery.where('punishmentId', '=', filters.punishmentId);
      }

      if (filters.reviewedBy) {
        filteredQuery = filteredQuery.where('reviewedBy', '=', filters.reviewedBy);
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
    if (queryDto.reporter) {
      filters.reporter = queryDto.reporter;
    }
    if (queryDto.reportedPlayerId) {
      filters.reportedPlayerId = queryDto.reportedPlayerId;
    }
    if (queryDto.punishmentId) {
      filters.punishmentId = queryDto.punishmentId;
    }
    if (queryDto.reviewedBy) {
      filters.reviewedBy = queryDto.reviewedBy;
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

  async findPendingByReportedPlayerId(reportedPlayerId: string): Promise<AbuseReportDto[]> {
    const results = await this.buildBaseQuery()
      .where('reportedPlayerId', '=', reportedPlayerId)
      .where('status', '=', 'pending')
      .execute();

    return results.map((row: any) => this.mapRowToDto(row));
  }

  // ==================== Public Mutation Methods ====================

  async create(
    data: {
      reportedPlayerId: string;
      reportReasons: ReportReason[];
      description?: string | null;
      metadata?: { chatLogs?: string[] } | null;
    },
    reporterId: string,
    includes?: Set<string>,
  ): Promise<AbuseReportDto> {
    return await this.transaction(async (trx) => {
      const dao = this.transacting(trx);

      // Insert abuse report
      const result = await (dao.kysely as any)
        .insertInto(AbuseReportDao.TABLE)
        .values({
          reportedPlayerId: data.reportedPlayerId,
          reporter: reporterId,
          description: data.description ?? null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : null,
          status: 'pending',
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      // Insert report reasons into junction table
      if (data.reportReasons && data.reportReasons.length > 0) {
        await (dao.kysely as any)
          .insertInto('abuse_report_reason')
          .values(
            data.reportReasons.map((reason: ReportReason) => ({
              abuseReportId: result.id,
              reportReason: reason,
            })),
          )
          .execute();
      }

      const report = await dao.findById(result.id, includes);
      if (!report) {
        throw new Error('Failed to retrieve created abuse report');
      }
      return report;
    });
  }

  async updateReview(
    id: string,
    status: ReportStatus,
    punishmentId?: string | null,
    reviewedById?: string,
    includes?: Set<string>,
  ): Promise<AbuseReportDto | null> {
    await this.updateWithTimestamp(AbuseReportDao.TABLE)
      .set({
        status,
        punishmentId: punishmentId ?? null,
        reviewedBy: reviewedById ?? null,
      })
      .where('id', '=', id)
      .execute();

    return await this.findById(id, includes);
  }

  async updateBulkReview(
    reportIds: string[],
    status: ReportStatus,
    punishmentId: string,
    reviewedById: string,
  ): Promise<number> {
    if (reportIds.length === 0) {
      return 0;
    }

    const result = await this.updateWithTimestamp(AbuseReportDao.TABLE)
      .set({
        status,
        punishmentId,
        reviewedBy: reviewedById,
      })
      .where('id', 'in', reportIds)
      .where('status', '=', 'pending') // Only update pending reports
      .execute();

    return Number((result as any).numUpdatedRows || 0);
  }
}
