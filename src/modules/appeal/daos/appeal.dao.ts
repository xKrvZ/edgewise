import { Injectable, NotFoundException } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { AppealDto, AppealStatus } from '../dtos/appeal.dto';
import { PublicAppealDto } from '../dtos/public-appeal.dto';
import { CreateAppealDto } from '../dtos/create-appeal.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { AppealQueryDto } from '../dtos/appeal-query.dto';
import { PunishmentDao } from '@/modules/punishment/daos/punishment.dao';
import { UserDao } from '@/modules/user/daos/user.dao';
import { NoteDao } from '@/modules/note/daos/note.dao';
import { AppealAcceptanceReason } from '../constants/appeal-acceptance-reason.constants';
import { AppealRejectionReason } from '../constants/appeal-rejection-reason.constants';
import { DB } from '@/database/types/db';
import { sql } from 'kysely';

@Injectable()
export class AppealDao extends KyselyDao<AppealDao> {
  static readonly TABLE = 'appeal' as keyof DB;

  // ==================== Private Helper Methods ====================

  private buildBaseQuery(includes?: Set<string>) {
    const includeUser = includes?.has('user') ?? false;
    const includeNote = includes?.has('note') ?? false;

    return (this.kysely as any)
      .selectFrom(AppealDao.TABLE)
      .select((eb) => {
        const selects: any[] = [
          'id',
          'playerId',
          'punishmentId',
          'submittedAt',
          'status',
          'description',
          'reviewedBy',
          'reviewNoteId',
          'acceptanceReason',
          'rejectionReason',
          // Always include punishmentType as it's required by the DTO
          eb
            .selectFrom(PunishmentDao.TABLE)
            .select('punishment.punishmentType')
            .where('punishment.id', '=', eb.ref('appeal.punishmentId'))
            .as('punishmentType'),
          // Always include appealedBy user data
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
            .where('user.id', '=', eb.ref('appeal.appealedBy'))
            .as('appealedBy'),
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
              .where('user.id', '=', eb.ref('appeal.reviewedBy'))
              .as('reviewedBy'),
          );
        }

        // Conditionally include note subquery (reviewNote)
        if (includeNote) {
          selects.push(
            eb
              .selectFrom(NoteDao.TABLE)
              .select((eb) => [
                eb.fn('json_build_object', [
                  sql.lit('id'),
                  eb.ref('note.id'),
                  sql.lit('entityId'),
                  eb.ref('note.entityId'),
                  sql.lit('entityType'),
                  eb.ref('note.entityType'),
                  sql.lit('text'),
                  eb.ref('note.text'),
                  sql.lit('createdAt'),
                  eb.ref('note.createdAt'),
                  sql.lit('updatedAt'),
                  eb.ref('note.updatedAt'),
                ]),
              ])
              .where('note.id', '=', eb.ref('appeal.reviewNoteId'))
              .as('reviewNote'),
          );
        }

        return selects;
      });
  }

  private mapRowToDto(row: any, includes?: Set<string>): AppealDto {
    const includeUser = includes?.has('user') ?? false;
    const includeNote = includes?.has('note') ?? false;

    // Helper to convert timestamp to ISO string
    const toISOString = (value: any): string => {
      if (!value) return value;
      if (typeof value === 'string') return value;
      if (value instanceof Date) return value.toISOString();
      // If it's already an ISO string or other format, return as is
      return String(value);
    };

    const reviewNote = includeNote && row.reviewNote
      ? {
          id: row.reviewNote.id,
          entityId: row.reviewNote.entityId,
          entityType: row.reviewNote.entityType,
          text: row.reviewNote.text,
          createdAt: toISOString(row.reviewNote.createdAt),
          updatedAt: toISOString(row.reviewNote.updatedAt),
        }
      : undefined;

    return {
      id: row.id,
      playerId: row.playerId,
      punishmentId: row.punishmentId,
      appealedBy: row.appealedBy ?? undefined,
      punishmentType: row.punishmentType!,
      submittedAt: row.submittedAt.toISOString(),
      status: row.status as AppealStatus,
      description: row.description ?? undefined,
      reviewedBy: includeUser ? row.reviewedBy ?? undefined : undefined,
      reviewNote,
      acceptanceReason: row.acceptanceReason ?? null,
      rejectionReason: row.rejectionReason ?? null,
    } as AppealDto;
  }

  private buildFilterFunction(
    filters: {
      status?: AppealStatus;
      playerId?: string;
      punishmentId?: string;
      reviewedBy?: string;
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

      if (filters.reviewedBy) {
        filteredQuery = filteredQuery.where('reviewedBy', '=', filters.reviewedBy);
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
    if (queryDto.reviewedBy) {
      filters.reviewedBy = queryDto.reviewedBy;
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

    return await this.paginateWithCursor<AppealDto>(
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

  async findByPunishmentShortCodeId(shortCodeId: string): Promise<PublicAppealDto[] | null> {
    // First, find the punishment ID by shortCodeId
    const punishment = await (this.kysely as any)
      .selectFrom(PunishmentDao.TABLE)
      .select('id')
      .where('shortCodeId', '=', shortCodeId)
      .executeTakeFirst();

    if (!punishment) {
      return null;
    }

    // Then find appeals for that punishment
    const results = await this.buildBaseQuery(new Set())
      .where('punishmentId', '=', punishment.id)
      .execute();

    if (results.length === 0) {
      return null;
    }

    return results.map((row: any) => this.mapRowToPublicDto(row));
  }

  private mapRowToPublicDto(row: any): PublicAppealDto {
    return {
      id: row.id,
      punishmentType: row.punishmentType!,
      submittedAt: row.submittedAt.toISOString(),
      status: row.status as AppealStatus,
      description: row.description ?? undefined,
      acceptanceReason: row.acceptanceReason ?? null,
      rejectionReason: row.rejectionReason ?? null,
    } as PublicAppealDto;
  }

  // ==================== Public Mutation Methods ====================

  async create(
    data: CreateAppealDto,
    appealedByUserId: string,
    includes?: Set<string>,
  ): Promise<AppealDto> {
    // Get playerId from the punishment
    const punishment = await (this.kysely as any)
      .selectFrom(PunishmentDao.TABLE)
      .select('playerId')
      .where('id', '=', data.punishmentId)
      .executeTakeFirst();

    if (!punishment) {
      throw new NotFoundException(`Punishment with ID ${data.punishmentId} not found`);
    }

    const result = await (this.kysely as any)
      .insertInto(AppealDao.TABLE)
      .values({
        playerId: punishment.playerId,
        punishmentId: data.punishmentId,
        appealedBy: appealedByUserId,
        description: data.description ?? null,
        status: 'pending',
      })
      .returning(['id'])
      .executeTakeFirstOrThrow();

    const created = await this.findById(result.id, includes);
    if (!created) {
      throw new NotFoundException(`Failed to retrieve created appeal with ID ${result.id}`);
    }
    return created;
  }

  async updateStatus(
    id: string,
    status: AppealStatus,
    reviewedBy: string,
    reviewNoteId?: string,
    acceptanceReason?: AppealAcceptanceReason | null,
    rejectionReason?: AppealRejectionReason | null,
    includes?: Set<string>,
  ): Promise<AppealDto | null> {
    await this.updateWithTimestamp(AppealDao.TABLE)
      .set({
        status,
        reviewedBy,
        reviewNoteId: reviewNoteId ?? undefined,
        acceptanceReason: acceptanceReason ?? null,
        rejectionReason: rejectionReason ?? null,
      })
      .where('id', '=', id)
      .execute();

    return await this.findById(id, includes);
  }
}
