/**
 * Utility for encoding and decoding cursor values for pagination
 * Encodes filter context along with the cursor value to maintain filters across pages
 */

export interface CursorData {
  value: string | number | Date;
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
    const json = JSON.stringify({
      value: data.value instanceof Date ? data.value.toISOString() : data.value,
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
      
      // Try to parse value as Date if it looks like an ISO string
      let value: string | number | Date = data.value;
      if (typeof data.value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(data.value)) {
        value = new Date(data.value);
      }
      
      return {
        value,
        filters: data.filters || {},
        orderBy: data.orderBy,
      };
    } catch {
      return null;
    }
  }
}
