/**
 * Utility for encoding and decoding cursor values for pagination
 * Encodes filter context along with the cursor value to maintain filters across pages
 */

export interface CursorData {
  value: string | number | Date | null;
  direction?: 'forward' | 'backward';
  filters?: Record<string, any>;
  orderBy?: {
    field: string;
    order: 'asc' | 'desc';
  };
}

export class CursorEncoder {
  /**
   * Encode cursor data to a base64 string
   */
  static encode(data: CursorData): string {
    const serializeValue = (value: string | number | Date | null | undefined): string | number | null => {
      if (value === null || value === undefined) return null;
      if (value instanceof Date) return value.toISOString();
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
      
      // Helper to parse value as Date if it looks like an ISO string
      const parseValue = (value: string | number | null | undefined): string | number | Date | null => {
        if (value === null || value === undefined) return null;
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          return new Date(value);
        }
        return value;
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
