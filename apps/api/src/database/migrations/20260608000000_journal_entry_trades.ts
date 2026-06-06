import { Kysely, sql } from 'kysely';

/**
 * Replaces the single optional `journal_entry.tradeId` with a many-to-many
 * `journal_entry_trade` junction so one journal entry can reference multiple trades.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('journal_entry_trade')
    .addColumn('journalEntryId', 'uuid', (col) =>
      col.notNull().references('journal_entry.id').onDelete('cascade'),
    )
    .addColumn('tradeId', 'uuid', (col) =>
      col.notNull().references('trade.id').onDelete('cascade'),
    )
    .addPrimaryKeyConstraint('pk_journal_entry_trade', ['journalEntryId', 'tradeId'])
    .execute();

  await db.schema
    .createIndex('idx_journal_entry_trade_tradeId')
    .on('journal_entry_trade')
    .column('tradeId')
    .execute();

  await sql`
    INSERT INTO journal_entry_trade ("journalEntryId", "tradeId")
    SELECT id, "tradeId" FROM journal_entry WHERE "tradeId" IS NOT NULL
  `.execute(db);

  await db.schema.alterTable('journal_entry').dropColumn('tradeId').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('journal_entry')
    .addColumn('tradeId', 'uuid', (col) =>
      col.references('trade.id').onDelete('cascade'),
    )
    .execute();

  await sql`
    UPDATE journal_entry je
    SET "tradeId" = jet."tradeId"
    FROM (
      SELECT DISTINCT ON ("journalEntryId") "journalEntryId", "tradeId"
      FROM journal_entry_trade
      ORDER BY "journalEntryId", "tradeId"
    ) jet
    WHERE je.id = jet."journalEntryId"
  `.execute(db);

  await db.schema.dropTable('journal_entry_trade').ifExists().execute();
}
