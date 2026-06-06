import { Kysely, sql } from 'kysely';

/**
 * Stores Polar subscription state per Better Auth user.
 * Updated via Polar webhooks and queried for subscription gating.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('user_subscription')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade').unique(),
    )
    .addColumn('polarCustomerId', 'text')
    .addColumn('polarSubscriptionId', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('inactive'))
    .addColumn('productId', 'text')
    .addColumn('currentPeriodEnd', 'timestamptz')
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_user_subscription_polarCustomerId')
    .on('user_subscription')
    .column('polarCustomerId')
    .execute();

  await db.schema
    .createIndex('idx_user_subscription_polarSubscriptionId')
    .on('user_subscription')
    .column('polarSubscriptionId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('user_subscription').execute();
}
