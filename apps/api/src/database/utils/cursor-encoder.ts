/**
 * Utility for encoding and decoding cursor values for pagination.
 * Encodes filter context along with the cursor value to maintain filters across pages.
 */

export interface CompositeCursorValue {
  primary: string | number | Date;
  tie: string;
}

export type CursorPrimitive = string | number | Date | null;

export type CursorValue = CursorPrimitive | CompositeCursorValue;

export function isCompositeCursorValue(value: unknown): value is CompositeCursorValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'primary' in value &&
    'tie' in value
  );
}

export interface CursorData {
  value: CursorValue;
  direction?: 'forward' | 'backward';
  filters?: Record<string, any>;
  orderBy?: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

export class CursorEncoder {
  /**
   * Encode cursor data to a base64 string
   */
  static encode(data: CursorData): string {
    const serializeValue = (value: CursorValue): unknown => {
      if (value === null || value === undefined) {
        return null;
      }
      if (isCompositeCursorValue(value)) {
        return {
          primary:
            value.primary instanceof Date
              ? value.primary.toISOString()
              : value.primary,
          tie: value.tie,
        };
      }
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    };

    const json = JSON.stringify({
      value: serializeValue(data.value),
      direction: data.direction || 'forward',
      filters: data.filters || {},
      orderBy: data.orderBy,
    });
    return Buffer.from(json).toString('base64');
  }

  /**
   * Decode a base64 cursor string to cursor data
   */
  static decode(cursor: string): CursorData | null {
    try {
      const json = Buffer.from(cursor, 'base64').toString('utf-8');
      const data = JSON.parse(json);

      const parsePrimitive = (
        value: string | number | null | undefined,
      ): string | number | Date | null => {
        if (value === null || value === undefined) {
          return null;
        }
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          return new Date(value);
        }
        return value;
      };

      const parseValue = (value: unknown): CursorValue => {
        if (value === null || value === undefined) {
          return null;
        }
        if (
          typeof value === 'object' &&
          value !== null &&
          'primary' in value &&
          'tie' in value
        ) {
          const composite = value as { primary: string | number; tie: string };
          return {
            primary: parsePrimitive(composite.primary) ?? composite.primary,
            tie: composite.tie,
          };
        }
        return parsePrimitive(value as string | number | null);
      };

      return {
        value: parseValue(data.value),
        direction: data.direction || 'forward',
        filters: data.filters || {},
        orderBy: data.orderBy,
      };
    } catch {
      return null;
    }
  }
}
