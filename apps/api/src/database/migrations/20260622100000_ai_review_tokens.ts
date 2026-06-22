import { Kysely, sql } from 'kysely';

/**
 * Monthly AI review token balance on user + persisted on-demand trade reviews.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('user')
    .addColumn('aiReviewTokensRemaining', 'integer')
    .addColumn('aiReviewTokensPeriodStart', 'timestamptz')
    .execute();

  await db.schema
    .createTable('trade_ai_review')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('tradeId', 'uuid', (col) =>
      col.notNull().references('trade.id').onDelete('cascade').unique(),
    )
    .addColumn('userId', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
    .addColumn('generatedAt', 'timestamptz', (col) => col.notNull())
    .addColumn('summary', 'text', (col) => col.notNull())
    .addColumn('insights', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('mistakesFlagged', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('suggestions', 'jsonb', (col) => col.notNull().defaultTo(sql`'[]'::jsonb`))
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_trade_ai_review_userId')
    .on('trade_ai_review')
    .column('userId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('trade_ai_review').execute();
  await db.schema
    .alterTable('user')
    .dropColumn('aiReviewTokensRemaining')
    .dropColumn('aiReviewTokensPeriodStart')
    .execute();
}
