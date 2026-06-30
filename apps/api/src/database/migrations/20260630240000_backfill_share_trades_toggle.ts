import { sql, type Kysely } from 'kysely';

/**
 * Users who shared trades before showcase auto-enable existed should have shareTrades on.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    UPDATE trader_profile tp
    SET "shareTrades" = true
    WHERE tp."shareTrades" = false
      AND EXISTS (
        SELECT 1
        FROM trade t
        WHERE t."userId" = tp."userId"
          AND t.visibility IN ('unlisted', 'public')
          AND t."shareToken" IS NOT NULL
      )
  `.execute(db);
}

export async function down(_db: Kysely<any>): Promise<void> {
  // Cannot reliably reverse — shared-trade users may have enabled the toggle manually.
}
