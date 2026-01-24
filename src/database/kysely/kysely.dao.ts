import { Kysely, Transaction, SelectQueryBuilder, UpdateQueryBuilder, sql } from 'kysely';
import { Injectable } from '@nestjs/common';
import { InjectKysely } from 'nestjs-kysely';
import { BaseTransaction } from '@/database/base-transaction';
import { DB } from '../types/db';
import { PaginatedDto } from '../dtos/paginated.dto';
import { CursorEncoder } from '../utils/cursor-encoder';
import { OrderByDto } from '../dtos/filter.dto';

export interface CursorPaginationOptions<T, DTO = T> {
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
    // Check if we're already in a transaction by checking if constructor name contains "Transaction"
    // Regular Kysely instances have constructor name 'Kysely'
    // Transaction instances have "Transaction" in their constructor name
    const constructorName = this.kysely.constructor?.name || '';
    const isInTransaction = constructorName.includes('Transaction');

    if (isInTransaction) {
      // Already in a transaction, wrap this.kysely in BaseTransaction and execute directly
      const baseTransaction = new BaseTransaction(this.kysely as Transaction<DB>);
      return await callback(baseTransaction);
    }

    // Not in a transaction, start a new one
    return await this.kysely.transaction().execute(async (kyselyTransaction) => {
      const baseTransaction = new BaseTransaction(kyselyTransaction);
      return callback(baseTransaction);
    });
  }

  /**
   * Applies OrderByDto to a query builder
   * @param query - The query builder to apply ordering to
   * @param orderBy - Optional OrderByDto with field and direction
   * @param defaultField - Default field to order by if orderBy is not provided
   * @param defaultOrder - Default order direction if orderBy is not provided
   * @param mapField - Optional function to map DTO field names to DB column names
   * @returns The query builder with ordering applied
   */
  protected applyOrderBy<TB extends keyof DB = any, R = any>(
    query: SelectQueryBuilder<DB, TB, R>,
    orderBy?: OrderByDto,
    defaultField?: string,
    defaultOrder: 'asc' | 'desc' = 'asc',
    mapField?: (field: string) => string,
  ): SelectQueryBuilder<DB, TB, R> {
    const orderField = orderBy?.field || defaultField;
    const order = orderBy?.direction || defaultOrder;

    if (!orderField) {
      return query;
    }

    // Map the field if mapping function is provided
    const mappedField = mapField && orderBy?.field ? mapField(orderBy.field) : orderField;

    return query.orderBy(mappedField as any, order) as SelectQueryBuilder<DB, TB, R>;
  }

  /**
   * Creates an update query builder that automatically sets updatedAt timestamp
   * for tables that have an updatedAt column.
   * 
   * Tables with updatedAt: note, punishment, appeal, abuse_report
   * 
   * @param table - The table name to update
   * @returns Update query builder with updatedAt automatically included in set operations
   * 
   * @example
   * ```typescript
   * await this.updateWithTimestamp('punishment')
   *   .set({ expiry: new Date() })
   *   .where('id', '=', id)
   *   .execute();
   * ```
   */
  protected updateWithTimestamp<TB extends keyof DB>(
    table: TB,
  ): UpdateQueryBuilder<DB, TB, TB, UpdateQueryBuilder<DB, TB, TB, never>> {
    const tablesWithUpdatedAt: (keyof DB)[] = ['note', 'punishment', 'appeal', 'abuse_report'];
    const hasUpdatedAt = tablesWithUpdatedAt.includes(table);

    const query = this.kysely.updateTable(table);

    if (hasUpdatedAt) {
      // Return a query builder that will automatically merge updatedAt into any .set() call
      // We use a Proxy to intercept the set method and add updatedAt
      return new Proxy(query, {
        get(target, prop) {
          if (prop === 'set') {
            // Wrap the set method to automatically include updatedAt
            return function(updatesOrKey: any, value?: any) {
              // Handle both overloads: set(updates) and set(key, value)
              if (value !== undefined) {
                // Two-argument form: set(key, value)
                const updates = { [updatesOrKey]: value, updatedAt: sql`now()` };
                return (target as any).set(updates);
              } else {
                // Single-argument form: set(updates)
                const updatesWithTimestamp = {
                  ...updatesOrKey,
                  updatedAt: sql`now()`,
                };
                return (target as any).set(updatesWithTimestamp);
              }
            };
          }
          return (target as any)[prop];
        },
      }) as any;
    }

    return query as any;
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
     *     orderBy: { field: 'createdAt', direction: 'desc' },
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
  protected async paginateWithCursor<DTO, TB extends keyof DB = any, R = any>(
    queryBuilder: SelectQueryBuilder<DB, TB, R>,
    options: CursorPaginationOptions<R, DTO> & {
    applyFilters?: (query: SelectQueryBuilder<DB, any, any>) => SelectQueryBuilder<DB, any, any>;
  },
  ): Promise<PaginatedDto<DTO>> {
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

    // Step 1: Decode and process cursor
    const cursorData = this.decodeCursor(cursor, mapField);
    const activeDirection = cursorData.direction || direction;
    const activeFilters = Object.keys(cursorData.filters).length > 0 ? cursorData.filters : filters;
    const originalOrderBy = cursorData.orderBy || orderBy;

    // Step 2: Prepare ordering configuration
    const orderConfig = this.prepareOrderConfig(
      originalOrderBy,
      cursorField,
      activeDirection,
      mapField,
    );

    // Step 3: Build and execute paginated query
    const paginatedQuery = this.buildPaginatedQuery(
      queryBuilder,
      applyFilters,
      orderConfig,
      cursorData.value,
      activeDirection,
    );

    const items = await paginatedQuery.limit(limit + 1).execute();
    const hasMore = items.length > limit;
    let resultItems = hasMore ? items.slice(0, limit) : items;

    // Step 4: Handle backward pagination result reversal
    if (activeDirection === 'backward') {
      resultItems = resultItems.reverse();
    }

    // Step 5: Extract cursor values from results
    const cursorValues = this.extractCursorValues(resultItems, orderConfig.columnName);

    // Step 6: Check for additional pages (for backward pagination)
    const pageInfo = await this.checkPageBoundaries(
      queryBuilder,
      applyFilters,
      orderConfig,
      cursorValues,
      activeDirection,
      hasMore,
    );

    // Step 7: Build cursor context and encode cursors
    const cursorContext = this.buildCursorContext(activeFilters, originalOrderBy, orderConfig);
    const previousCursor = this.buildPreviousCursor(
      cursor,
      cursorValues.first,
      activeDirection,
      pageInfo.hasMoreBefore,
      cursorContext,
    );
    const nextCursor = this.buildNextCursor(
      cursorValues.last,
      activeDirection,
      pageInfo.hasMore,
      pageInfo.hasMoreAfter,
      cursorContext,
    );

    return new PaginatedDto<DTO>({
      items: resultItems as DTO[],
      previousCursor,
      nextCursor,
    });
  }

  /**
   * Decodes cursor and extracts pagination context
   */
  private decodeCursor(
    cursor: string | undefined,
    mapField?: (field: string) => string,
  ): {
    value: string | number | Date | undefined;
    direction?: 'forward' | 'backward';
    filters: Record<string, any>;
    orderBy?: OrderByDto;
  } {
    if (!cursor) {
      return { value: undefined, filters: {} };
    }

    const decoded = CursorEncoder.decode(cursor);
    if (!decoded) {
      // Fallback: treat as plain value for backward compatibility
      return { value: cursor as any, filters: {} };
    }

    // Map the field if mapping function is provided
    let mappedOrderBy = decoded.orderBy;
    if (mappedOrderBy?.field && mapField) {
      mappedOrderBy = {
        ...mappedOrderBy,
        field: mapField(mappedOrderBy.field),
      };
    }

    return {
      value: decoded.value ?? undefined,
      direction: decoded.direction,
      filters: decoded.filters || {},
      orderBy: mappedOrderBy,
    };
  }

  /**
   * Prepares ordering configuration from orderBy options
   */
  private prepareOrderConfig(
    orderBy: OrderByDto | undefined,
    cursorField: string | keyof any,
    direction: 'forward' | 'backward',
    mapField?: (field: string) => string,
  ): {
    field: any;
    columnName: string;
    baseDirection: 'asc' | 'desc';
    queryDirection: 'asc' | 'desc';
  } {
    const orderField = (orderBy?.field || cursorField) as any;
    const fieldParts = String(orderField).split('.');
    const columnName = fieldParts[fieldParts.length - 1];

    // Map the field if mapping function is provided
    const mappedField = mapField && orderBy?.field ? mapField(orderBy.field) : orderField;

    const baseDirection = orderBy?.direction || (direction === 'forward' ? 'asc' : 'desc');
    const queryDirection = direction === 'backward'
      ? (baseDirection === 'asc' ? 'desc' : 'asc')
      : baseDirection;

    return {
      field: mappedField || orderField,
      columnName,
      baseDirection,
      queryDirection,
    };
  }

  /**
   * Builds the paginated query with filters, ordering, and cursor constraints
   */
  private buildPaginatedQuery<TB extends keyof DB = any, R = any>(
    queryBuilder: SelectQueryBuilder<DB, TB, R>,
    applyFilters: ((query: SelectQueryBuilder<DB, any, any>) => SelectQueryBuilder<DB, any, any>) | undefined,
    orderConfig: { field: any; baseDirection: 'asc' | 'desc'; queryDirection: 'asc' | 'desc' },
    cursorValue: string | number | Date | undefined,
    direction: 'forward' | 'backward',
  ): SelectQueryBuilder<DB, TB, R> {
    let query = queryBuilder;

    // Apply filters
    if (applyFilters) {
      query = applyFilters(query) as SelectQueryBuilder<DB, TB, R>;
    }

    // Apply cursor filter if provided
    if (cursorValue !== undefined) {
      const operator = direction === 'backward'
        ? (orderConfig.baseDirection === 'asc' ? '<' : '>')
        : (orderConfig.baseDirection === 'asc' ? '>' : '<');

      query = query.where(
        orderConfig.field,
        operator,
        cursorValue as any,
      ) as SelectQueryBuilder<DB, TB, R>;
    }

    // Apply ordering
    query = query.orderBy(
      orderConfig.field,
      orderConfig.queryDirection,
    ) as SelectQueryBuilder<DB, TB, R>;

    return query;
  }

  /**
   * Extracts cursor values from the result items
   */
  private extractCursorValues(
    items: any[],
    columnName: string,
  ): { first: string | number | Date | null; last: string | number | Date | null } {
    const first = items.length > 0 ? (items[0] as any)[columnName] : null;
    const last = items.length > 0 ? (items[items.length - 1] as any)[columnName] : null;
    return { first, last };
  }

  /**
   * Checks if there are more items before/after the current page
   */
  private async checkPageBoundaries(
    queryBuilder: SelectQueryBuilder<DB, any, any>,
    applyFilters: ((query: SelectQueryBuilder<DB, any, any>) => SelectQueryBuilder<DB, any, any>) | undefined,
    orderConfig: { field: any; baseDirection: 'asc' | 'desc' },
    cursorValues: { first: string | number | Date | null; last: string | number | Date | null },
    direction: 'forward' | 'backward',
    hasMore: boolean,
  ): Promise<{ hasMore: boolean; hasMoreBefore: boolean; hasMoreAfter: boolean }> {
    let hasMoreBefore = false;
    let hasMoreAfter = false;

    // For backward pagination, check if there are more items before/after
    if (direction === 'backward') {
      if (cursorValues.first !== null && cursorValues.first !== undefined) {
        hasMoreBefore = await this.checkHasMoreItems(
          queryBuilder,
          applyFilters,
          orderConfig.field,
          orderConfig.baseDirection,
          cursorValues.first,
          'before',
        );
      }

      if (cursorValues.last !== null && cursorValues.last !== undefined) {
        hasMoreAfter = await this.checkHasMoreItems(
          queryBuilder,
          applyFilters,
          orderConfig.field,
          orderConfig.baseDirection,
          cursorValues.last,
          'after',
        );
      }
    }

    return {
      hasMore,
      hasMoreBefore,
      hasMoreAfter,
    };
  }

  /**
   * Checks if there are more items before or after a given cursor value
   */
  private async checkHasMoreItems(
    queryBuilder: SelectQueryBuilder<DB, any, any>,
    applyFilters: ((query: SelectQueryBuilder<DB, any, any>) => SelectQueryBuilder<DB, any, any>) | undefined,
    orderField: any,
    baseDirection: 'asc' | 'desc',
    cursorValue: string | number | Date,
    position: 'before' | 'after',
  ): Promise<boolean> {
    let query = queryBuilder;
    if (applyFilters) {
      query = applyFilters(query);
    }

    const operator = position === 'before'
      ? (baseDirection === 'asc' ? '<' : '>')
      : (baseDirection === 'asc' ? '>' : '<');

    const items = await query
      .where(orderField as any, operator, cursorValue as any)
      .orderBy(orderField as any, baseDirection)
      .limit(1)
      .execute();

    return items.length > 0;
  }

  /**
   * Builds the cursor context for encoding
   */
  private buildCursorContext(
    filters: Record<string, any>,
    originalOrderBy: OrderByDto | undefined,
    orderConfig: { columnName: string; baseDirection: 'asc' | 'desc' },
  ): {
    filters: Record<string, any>;
    orderBy: { field: string; direction: 'asc' | 'desc' };
  } {
    const fieldToStore = originalOrderBy?.field || orderConfig.columnName;

    return {
      filters,
      orderBy: {
        field: fieldToStore,
        direction: orderConfig.baseDirection,
      },
    };
  }

  /**
   * Builds the previous cursor if applicable
   */
  private buildPreviousCursor(
    originalCursor: string | undefined,
    firstItemCursor: string | number | Date | null,
    direction: 'forward' | 'backward',
    hasMoreBefore: boolean,
    cursorContext: { filters: Record<string, any>; orderBy: { field: string; direction: 'asc' | 'desc' } },
  ): string | null {
    // First page (no cursor) - no previous items
    if (!originalCursor || firstItemCursor === null || firstItemCursor === undefined) {
      return null;
    }

    // For forward pagination: always set (we can go back)
    // For backward pagination: only set if there are more items before
    if (direction === 'forward' || hasMoreBefore) {
      return CursorEncoder.encode({
        value: firstItemCursor,
        direction: 'backward',
        ...cursorContext,
      });
    }

    return null;
  }

  /**
   * Builds the next cursor if applicable
   */
  private buildNextCursor(
    lastItemCursor: string | number | Date | null,
    direction: 'forward' | 'backward',
    hasMore: boolean,
    hasMoreAfter: boolean,
    cursorContext: { filters: Record<string, any>; orderBy: { field: string; direction: 'asc' | 'desc' } },
  ): string | null {
    if (lastItemCursor === null || lastItemCursor === undefined) {
      return null;
    }

    // For forward pagination: set if there are more items
    // For backward pagination: set if there are more items after
    const shouldShowNext = direction === 'forward' ? hasMore : hasMoreAfter;

    if (shouldShowNext) {
      return CursorEncoder.encode({
        value: lastItemCursor,
        direction: 'forward',
        ...cursorContext,
      });
    }

    return null;
  }
}