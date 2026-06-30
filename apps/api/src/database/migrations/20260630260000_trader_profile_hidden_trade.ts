import { Kysely } from 'kysely';

/**
 * Trades excluded from the public profile showcase while remaining publicly shareable.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('trader_profile_hidden_trade')
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('trader_profile.userId').onDelete('cascade'),
    )
    .addColumn('tradeId', 'uuid', (col) =>
      col.notNull().references('trade.id').onDelete('cascade'),
    )
    .addPrimaryKeyConstraint('trader_profile_hidden_trade_pk', ['userId', 'tradeId'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('trader_profile_hidden_trade').execute();
}
