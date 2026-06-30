import { Kysely, sql } from 'kysely';

/**
 * Public profile journal selection via junction table (mirrors playbooks/trades).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('trader_profile_trading_account')
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('trader_profile.userId').onDelete('cascade'),
    )
    .addColumn('tradingAccountId', 'uuid', (col) =>
      col.notNull().references('trading_account.id').onDelete('cascade'),
    )
    .addPrimaryKeyConstraint('trader_profile_trading_account_pk', [
      'userId',
      'tradingAccountId',
    ])
    .execute();

  // Preserve existing public profiles: include all journals for users already sharing.
  await sql`
    INSERT INTO trader_profile_trading_account ("userId", "tradingAccountId")
    SELECT tp."userId", ta.id
    FROM trader_profile tp
    INNER JOIN trading_account ta ON ta."userId" = tp."userId"
    WHERE tp."statsVisibility" = 'public' OR tp."shareTrades" = true
    ON CONFLICT DO NOTHING
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('trader_profile_trading_account').execute();
}
