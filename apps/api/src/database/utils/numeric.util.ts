/**
 * Helpers for converting Postgres `numeric` columns (returned as strings by the
 * `pg` driver) into JavaScript numbers for API responses.
 */

export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  return typeof value === 'number' ? value : Number(value);
}

export function toRequiredNumber(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}
