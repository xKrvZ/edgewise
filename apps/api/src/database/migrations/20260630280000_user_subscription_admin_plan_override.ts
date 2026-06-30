import { Kysely, sql } from 'kysely';

/**
 * When true, platform access follows local user_subscription rows instead of Polar
 * entitlements (admin plan change with billing excluded).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user_subscription')
    .addColumn('adminPlanOverride', 'boolean', (col) => col.notNull().defaultTo(sql`false`))
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.alterTable('user_subscription').dropColumn('adminPlanOverride').execute();
}
