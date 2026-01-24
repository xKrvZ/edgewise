import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { PunishmentDto } from '../dtos/punishment.dto';
import { CreatePunishmentDto } from '../dtos/create-punishment.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { PunishmentQueryDto } from '../dtos/punishment-query.dto';
import { PlayerDao } from '@/modules/player/daos/player.dao';
import { UserDao } from '@/modules/user/daos/user.dao';
import { NoteDao } from '@/modules/note/daos/note.dao';
import { LiftReason } from '../constants/lift-reason.constants';
import { PunishmentReason } from '../constants/punishment-reason.constants';
import { sql, Kysely } from 'kysely';
import { DB } from '@/database/types/db';
import { customAlphabet } from 'nanoid';

// Custom alphabet: lowercase, uppercase A-Z, and numbers 0-9
const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const nanoid = customAlphabet(alphabet, 8);

@Injectable()
export class PunishmentDao extends KyselyDao<PunishmentDao> {
  static readonly TABLE = 'punishment' as keyof DB;

  constructor(
    @InjectKysely() kysely: Kysely<DB>,
    private readonly noteDao: NoteDao,
  ) {
    super(kysely);
  }

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
    const includeNote = includes?.has('note') ?? false;

    return (this.kysely as any)
      .selectFrom(PunishmentDao.TABLE)
      .select((eb) => {
        const selects: any[] = [
          'id',
          'shortCodeId',
          'punishmentType',
          'expiry',
          'createdAt',
          'lifted',
          'liftedAt',
          'liftReason',
          'liftNoteId',
          'punishmentNoteId',
          'relatedAbuseReportId',
          'playerId',
          'issuedById',
          'liftedById',
          // Always include punishment reasons as JSON array
          eb
            .selectFrom('punishment_reasons')
            .select((eb) => [
              eb.fn('COALESCE', [
                eb.fn('json_agg', [eb.ref('punishment_reasons.punishmentReason')]),
                sql`'[]'::json`,
              ]).as('reasons'),
            ])
            .whereRef('punishment_reasons.punishmentId', '=', 'punishment.id')
            .as('punishmentReasons'),
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

        // Conditionally include note subqueries (liftNote and punishmentNote)
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
              .where('note.id', '=', eb.ref('punishment.liftNoteId'))
              .as('liftNote'),
          );
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
              .where('note.id', '=', eb.ref('punishment.punishmentNoteId'))
              .as('punishmentNote'),
          );
        }

        return selects;
      });
  }

  private mapRowToDto(row: any, includes?: Set<string>): PunishmentDto {
    const includePlayer = includes?.has('player') ?? false;
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

    const liftNote = includeNote && row.liftNote
      ? {
          id: row.liftNote.id,
          entityId: row.liftNote.entityId,
          entityType: row.liftNote.entityType,
          text: row.liftNote.text,
          createdAt: toISOString(row.liftNote.createdAt),
          updatedAt: toISOString(row.liftNote.updatedAt),
        }
      : undefined;

    const punishmentNote = includeNote && row.punishmentNote && row.punishmentNote.id
      ? {
          id: row.punishmentNote.id,
          entityId: row.punishmentNote.entityId,
          entityType: row.punishmentNote.entityType,
          text: row.punishmentNote.text,
          createdAt: toISOString(row.punishmentNote.createdAt),
          updatedAt: toISOString(row.punishmentNote.updatedAt),
        }
      : undefined;

    // Extract punishment reasons from JSON array
    let punishmentReasons: PunishmentReason[] = [];
    if (row.punishmentReasons) {
      if (row.punishmentReasons.reasons) {
        // If it's an object with a 'reasons' property (from json_agg)
        punishmentReasons = Array.isArray(row.punishmentReasons.reasons)
          ? row.punishmentReasons.reasons
          : [];
      } else if (Array.isArray(row.punishmentReasons)) {
        // If it's already an array
        punishmentReasons = row.punishmentReasons;
      }
    }

    return {
      id: row.id,
      shortCodeId: row.shortCodeId,
      punishmentType: row.punishmentType as 'ban' | 'mute' | 'kick',
      punishmentReasons,
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
      liftNote,
      punishmentNote,
      relatedAbuseReportId: row.relatedAbuseReportId ?? null,
    } as PunishmentDto;
  }

  private buildFilterFunction(
    filters: {
      punishmentType?: 'ban' | 'mute' | 'kick';
      lifted?: boolean;
      playerId?: string;
      issuedById?: string;
      punishmentReason?: PunishmentReason[];
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

      if (filters.punishmentReason && filters.punishmentReason.length > 0) {
        // Filter by punishment reason(s) using EXISTS subquery with IN clause
        filteredQuery = filteredQuery.where((eb) =>
          eb.exists(
            eb
              .selectFrom('punishment_reasons')
              .select('punishment_reasons.id')
              .whereRef('punishment_reasons.punishmentId', '=', 'punishment.id')
              .where('punishment_reasons.punishmentReason', 'in', filters.punishmentReason!),
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
    if (queryDto.punishmentReason) {
      filters.punishmentReason = queryDto.punishmentReason;
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
    punishmentNoteId: string | undefined,
    includes?: Set<string>,
  ): Promise<PunishmentDto> {
    return await this.transaction(async (trx) => {
      const dao = this.transacting(trx);

      // Generate a unique shortCodeId (8 characters)
      // Retry if duplicate exists
      let shortCodeId: string = '';
      let attempts = 0;
      const maxAttempts = 4;

      while (attempts < maxAttempts) {
        shortCodeId = nanoid();
        
        // Check if this shortCodeId already exists
        const existing = await (dao.kysely as any)
          .selectFrom(PunishmentDao.TABLE)
          .select('id')
          .where('shortCodeId', '=', shortCodeId)
          .executeTakeFirst();

        if (!existing) {
          break; // Unique shortCodeId found
        }

        attempts++;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique shortCodeId after maximum attempts');
      }

      // Create the punishment first
      const result = await (dao.kysely as any)
        .insertInto(PunishmentDao.TABLE)
        .values({
          shortCodeId,
          punishmentType: data.punishmentType,
          expiry: data.expiry ? new Date(data.expiry) : null,
          playerId: data.playerId,
          externalId: data.externalId ?? null,
          issuedById,
          relatedAbuseReportId: data.relatedAbuseReportId ?? null,
          punishmentNoteId: punishmentNoteId ?? null,
          lifted: false,
        })
        .returning(['id'])
        .executeTakeFirstOrThrow();

      // Insert punishment reasons into junction table
      if (data.punishmentReasons && data.punishmentReasons.length > 0) {
        await (dao.kysely as any)
          .insertInto('punishment_reasons')
          .values(
            data.punishmentReasons.map((reason: PunishmentReason) => ({
              punishmentId: result.id,
              punishmentReason: reason,
            })),
          )
          .execute();
      }

      const punishment = await dao.findById(result.id, includes);
      if (!punishment) {
        throw new Error('Failed to retrieve created punishment');
      }
      return punishment;
    });
  }

  async updatePunishment(
    id: string,
    updates: {
      punishmentNoteId?: string | null;
      liftNoteId?: string | null;
      expiry?: Date | null;
      [key: string]: any;
    },
  ): Promise<void> {
    await this.updateWithTimestamp(PunishmentDao.TABLE)
      .set(updates)
      .where('id', '=', id)
      .execute();
  }

  async updateExpiry(
    id: string,
    newExpiry: Date | null,
    includes?: Set<string>,
  ): Promise<PunishmentDto | null> {
    await this.updateWithTimestamp(PunishmentDao.TABLE)
      .set({
        expiry: newExpiry,
      })
      .where('id', '=', id)
      .where('lifted', '=', false)
      .execute();

    return await this.findById(id, includes);
  }

  async lift(
    id: string,
    liftedById: string,
    liftReason?: LiftReason | null,
    liftNoteId?: string,
    includes?: Set<string>,
  ): Promise<PunishmentDto | null> {
    await this.updateWithTimestamp(PunishmentDao.TABLE)
      .set({
        lifted: true,
        liftedById,
        liftedAt: sql`now()`,
        liftReason: liftReason ?? null,
        liftNoteId: liftNoteId ?? undefined,
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
    const result = await this.updateWithTimestamp(PunishmentDao.TABLE)
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

    return Number((result as any).numUpdatedRows || 0);
  }
}
