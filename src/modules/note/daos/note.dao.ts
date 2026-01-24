import { Injectable } from '@nestjs/common';
import { KyselyDao } from '@/database/kysely/kysely.dao';
import { NoteDto } from '../dtos/note.dto';
import { CreateNoteDto } from '../dtos/create-note.dto';
import { PaginatedDto } from '@/database/dtos/paginated.dto';
import { NoteQueryDto } from '../dtos/note-query.dto';
import { UserDao } from '@/modules/user/daos/user.dao';
import { sql } from 'kysely';
import { DB } from '@/database/types/db';

@Injectable()
export class NoteDao extends KyselyDao<NoteDao> {
  static readonly TABLE = 'note' as keyof DB;

  // ==================== Private Helper Methods ====================

  private buildBaseQuery(includeUser: boolean = false) {
    return (this.kysely as any)
      .selectFrom(NoteDao.TABLE)
      .select((eb) => {
        const selects: any[] = [
          'id',
          'entityId',
          'entityType',
          'text',
          'createdById',
          'createdAt',
          'updatedAt',
        ];

        // Conditionally include user subquery (createdBy)
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
              .where('user.id', '=', eb.ref('note.createdById'))
              .as('createdBy'),
          );
        }

        return selects;
      });
  }

  private mapRowToDto(row: any, includeUser: boolean = false): NoteDto {
    return {
      id: row.id,
      entityId: row.entityId,
      entityType: row.entityType,
      text: row.text,
      createdBy: includeUser && row.createdBy ? row.createdBy : undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    } as NoteDto;
  }

  private buildFilterFunction(
    filters: {
      entityId?: string;
      entityType?: string;
    },
  ) {
    return (query: any) => {
      let filteredQuery = query;

      if (filters.entityId) {
        filteredQuery = filteredQuery.where('entityId', '=', filters.entityId);
      }

      if (filters.entityType) {
        filteredQuery = filteredQuery.where('entityType', '=', filters.entityType);
      }

      return filteredQuery;
    };
  }

  private mapOrderByField(field: string): string {
    const fieldMap: Record<string, string> = {
      id: 'id',
      createdAt: 'createdAt',
      updatedAt: 'updatedAt',
      entityId: 'entityId',
      entityType: 'entityType',
    };
    return fieldMap[field] || field;
  }

  private extractFilters(queryDto: NoteQueryDto) {
    const filters: Record<string, any> = {};

    if (queryDto.entityId) {
      filters.entityId = queryDto.entityId;
    }
    if (queryDto.entityType) {
      filters.entityType = queryDto.entityType;
    }

    return filters;
  }

  private getCursorField(queryDto: NoteQueryDto): string {
    if (queryDto.orderBy?.field) {
      return this.mapOrderByField(queryDto.orderBy.field);
    }
    return 'createdAt';
  }

  // ==================== Public Query Methods ====================

  async findByEntity(
    entityId: string,
    entityType: string,
    includeUser: boolean = false,
  ): Promise<NoteDto[]> {
    const results = await this.buildBaseQuery(includeUser)
      .where('entityId', '=', entityId)
      .where('entityType', '=', entityType)
      .orderBy('createdAt', 'desc')
      .execute();

    return results.map((row: any) => this.mapRowToDto(row, includeUser));
  }

  async getAllPaginated(
    queryDto: NoteQueryDto,
    includeUser: boolean = false,
  ): Promise<PaginatedDto<NoteDto>> {
    const filters = this.extractFilters(queryDto);
    const cursorField = this.getCursorField(queryDto);

    return await this.paginateWithCursor<NoteDto>(
      this.buildBaseQuery(includeUser),
      {
        cursor: queryDto.cursor,
        limit: queryDto.limit,
        direction: 'forward',
        cursorField: cursorField,
        filters,
        orderBy: queryDto.orderBy || { field: 'createdAt', direction: 'desc' },
        mapField: (field: string) => this.mapOrderByField(field),
        applyFilters: this.buildFilterFunction(filters),
      },
    );
  }

  async findById(id: string, includeUser: boolean = false): Promise<NoteDto | null> {
    const result = await this.buildBaseQuery(includeUser)
      .where('id', '=', id)
      .executeTakeFirst();

    if (!result) {
      return null;
    }

    return this.mapRowToDto(result, includeUser);
  }

  async getCreatedById(id: string): Promise<string | null> {
    const result = await (this.kysely as any)
      .selectFrom(NoteDao.TABLE)
      .select('createdById')
      .where('id', '=', id)
      .executeTakeFirst();

    return result?.createdById ?? null;
  }

  // ==================== Public Mutation Methods ====================

  async create(
    data: CreateNoteDto,
    createdById: string,
    includeUser: boolean = false,
  ): Promise<NoteDto> {
    const result = await (this.kysely as any)
      .insertInto(NoteDao.TABLE)
      .values({
        entityId: data.entityId,
        entityType: data.entityType,
        text: data.text,
        createdById,
        updatedAt: sql`now()`,
      })
      .returning(['id'])
      .executeTakeFirstOrThrow();

    const note = await this.findById(result.id, includeUser);
    if (!note) {
      throw new Error('Failed to retrieve created note');
    }
    return note;
  }

  async delete(id: string): Promise<boolean> {
    const result = await (this.kysely as any)
      .deleteFrom(NoteDao.TABLE)
      .where('id', '=', id)
      .execute();

    return Number(result.numDeletedRows || 0) > 0;
  }
}
