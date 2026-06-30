import { Kysely } from 'kysely';

/**
 * Public profile showcased trades: toggle + junction table (mirrors playbooks).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('trader_profile')
    .addColumn('shareTrades', 'boolean', (col) => col.notNull().defaultTo(false))
    .execute();

  await db.schema
    .createTable('trader_profile_trade')
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('trader_profile.userId').onDelete('cascade'),
    )
    .addColumn('tradeId', 'uuid', (col) =>
      col.notNull().references('trade.id').onDelete('cascade'),
    )
    .addPrimaryKeyConstraint('trader_profile_trade_pk', ['userId', 'tradeId'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('trader_profile_trade').execute();

  await db.schema.alterTable('trader_profile').dropColumn('shareTrades').execute();
}
