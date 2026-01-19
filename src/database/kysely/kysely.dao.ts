import { Kysely, Transaction, SelectQueryBuilder } from 'kysely';
import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { BaseTransaction } from '@/database/base-transaction';
import { DB } from '../types/db';
import { PaginatedDto } from '../dtos/paginated.dto';
import { CursorEncoder, CursorData } from '../utils/cursor-encoder';
import { OrderByDto } from '../dtos/filter.dto';

export interface CursorPaginationOptions<T> {
  cursor?: string;
  limit?: number;
  direction?: 'forward' | 'backward';
  cursorField: string | keyof T;
  filters?: Record<string, any>;
  orderBy?: OrderByDto;
  mapField?: (field: string) => string; // Function to map DTO field names to DB column names
}

export type FilterFunction<TB extends keyof DB, R> = (
  query: SelectQueryBuilder<DB, TB, R>,
) => SelectQueryBuilder<DB, TB, R>;

@Injectable()
export abstract class KyselyDao<T extends KyselyDao<T>> {
  constructor(@InjectKysely() protected readonly kysely: Kysely<DB>) {}

  async transaction<R>(
    callback: (transaction: BaseTransaction<Transaction<DB>>) => Promise<R>,
  ): Promise<R> {
    return await this.kysely.transaction().execute(async (kyselyTransaction) => {
      const baseTransaction = new BaseTransaction(kyselyTransaction);
      return callback(baseTransaction);
    });
  }

  transacting(transaction: BaseTransaction<Transaction<DB>>): T {
    // Create a new instance with the transaction
    const Constructor = this.constructor as new (kysely: Kysely<DB>) => T;
    return new Constructor(transaction.instance() as Kysely<DB>);
  }

  /**
   * Helper function for cursor-based pagination with filters and ordering
   * 
   * @example
   * ```typescript
   * const result = await this.paginateWithCursor(
   *   this.kysely
   *     .selectFrom('punishment')
   *     .selectAll(),
   *   {
   *     cursor: encodedCursor, // optional: encoded cursor from previous page
   *     limit: 20,
   *     direction: 'forward',
   *     cursorField: 'id',
   *     filters: { punishmentType: 'ban', lifted: false },
   *     orderBy: { field: 'createdAt', order: 'desc' },
   *     applyFilters: (query) => {
   *       if (filters.punishmentType) {
   *         query = query.where('punishmentType', '=', filters.punishmentType);
   *       }
   *       if (filters.lifted !== undefined) {
   *         query = query.where('lifted', '=', filters.lifted);
   *       }
   *       return query;
   *     },
   *   }
   * );
   * ```
   * 
   * @param queryBuilder - The Kysely query builder to paginate
   * @param options - Pagination options including filters and ordering
   * @returns Paginated results with encoded cursor that preserves filters
   */
  protected async paginateWithCursor<O extends keyof DB, TB extends keyof DB, R>(
    queryBuilder: SelectQueryBuilder<DB, TB, R>,
    options: CursorPaginationOptions<R> & {
    applyFilters?: (query: SelectQueryBuilder<DB, any, any>) => SelectQueryBuilder<DB, any, any>;
  },
  ): Promise<PaginatedDto<R>> {
    const {
      cursor,
      limit = 20,
      direction = 'forward',
      cursorField,
      filters = {},
      orderBy,
      applyFilters,
      mapField,
    } = options;

    // Decode cursor if provided
    let cursorValue: string | number | Date | undefined;
    let cursorFilters: Record<string, any> = {};
    let cursorOrderBy: OrderByDto | undefined;

    if (cursor) {
      const decoded = CursorEncoder.decode(cursor);
      if (decoded) {
        cursorValue = decoded.value;
        cursorFilters = decoded.filters || {};
        cursorOrderBy = decoded.orderBy;
        // Map the field from cursor if mapping function is provided
        if (cursorOrderBy?.field && mapField) {
          cursorOrderBy = {
            ...cursorOrderBy,
            field: mapField(cursorOrderBy.field),
          };
        }
      } else {
        // Fallback: treat as plain value for backward compatibility
        cursorValue = cursor as any;
      }
    }

    // Use filters from cursor if available, otherwise use provided filters
    const activeFilters = Object.keys(cursorFilters).length > 0 ? cursorFilters : filters;
    
    // Track original orderBy (before mapping) for cursor encoding
    const originalOrderBy = cursorOrderBy || orderBy;
    
    // Use orderBy from cursor if available, otherwise use provided orderBy
    // Map the field if mapping function is provided for query execution
    let activeOrderBy = originalOrderBy;
    if (activeOrderBy?.field && mapField) {
      activeOrderBy = {
        ...activeOrderBy,
        field: mapField(activeOrderBy.field),
      };
    }

    // Start with base query
    let paginatedQuery = queryBuilder;

    // Apply filters if filter function is provided
    if (applyFilters) {
      paginatedQuery = applyFilters(paginatedQuery);
    }

    // Determine order by field and direction
    // Extract the column name from the field (e.g., 'punishment.createdAt' -> 'createdAt')
    const orderField = (activeOrderBy?.field || cursorField) as any;
    const orderFieldParts = String(orderField).split('.');
    const orderColumnName = orderFieldParts[orderFieldParts.length - 1];
    const orderDirection = activeOrderBy?.order || (direction === 'forward' ? 'asc' : 'desc');

    // Apply cursor filter if provided
    if (cursorValue !== undefined) {
      const operator = direction === 'forward' 
        ? (orderDirection === 'asc' ? '>' : '<')
        : (orderDirection === 'asc' ? '<' : '>');
      
      paginatedQuery = paginatedQuery.where(
        orderField,
        operator,
        cursorValue as any,
      ) as SelectQueryBuilder<DB, TB, R>;
    }

    // Apply ordering
    paginatedQuery = paginatedQuery.orderBy(
      orderField,
      orderDirection,
    ) as SelectQueryBuilder<DB, TB, R>;

    // Fetch one extra item to determine if there are more results
    const items = await paginatedQuery.limit(limit + 1).execute();

    // Check if there are more items
    const hasMore = items.length > limit;
    const resultItems = hasMore ? items.slice(0, limit) : items;

    // Extract cursor value from the result using the column name
    // The result will have the field as the column name (e.g., 'createdAt' not 'punishment.createdAt')
    const cursorValueFromResult = resultItems.length > 0
      ? (resultItems[resultItems.length - 1] as any)[orderColumnName]
      : null;

    // Encode next cursor with filter context
    // Store the original field name (before mapping) in the cursor
    const fieldToStore = originalOrderBy?.field || orderColumnName;

    const nextCursor =
      cursorValueFromResult !== null && cursorValueFromResult !== undefined
        ? CursorEncoder.encode({
            value: cursorValueFromResult,
            filters: activeFilters,
            orderBy: {
              field: fieldToStore, // Store original field name (before mapping)
              order: orderDirection,
            },
          })
        : null;

    return new PaginatedDto<R>({
      items: resultItems as R[],
      nextCursor,
      hasMore,
    });
  }
}