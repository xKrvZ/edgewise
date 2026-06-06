import { type Kysely, sql } from 'kysely';

/**
 * Consolidates prop-firm challenge rules into `trading_account` and drops the
 * separate `prop_firm_challenge` table. Existing challenge rows are migrated
 * onto their linked account, or into a new prop account when unlinked.
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('trading_account')
    .addColumn('firmName', 'text')
    .addColumn('profitTarget', 'numeric')
    .addColumn('dailyLossLimit', 'numeric')
    .addColumn('maxLossLimit', 'numeric')
    .addColumn('trailingDrawdown', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('challengeStatus', 'text')
    .addColumn('challengeStartedAt', 'timestamptz')
    .addColumn('daysTraded', 'integer', (col) => col.notNull().defaultTo(0))
    .execute();

  await sql`
    UPDATE trading_account ta
    SET
      type = 'prop',
      broker = COALESCE(ta.broker, pfc."firmName"),
      "firmName" = pfc."firmName",
      "startingBalance" = pfc."accountSize",
      "currentBalance" = pfc."currentBalance",
      "profitTarget" = pfc."profitTarget",
      "dailyLossLimit" = pfc."maxDailyLoss",
      "maxLossLimit" = pfc."maxTotalDrawdown",
      "trailingDrawdown" = pfc."trailingDrawdown",
      "challengeStatus" = pfc.status,
      "challengeStartedAt" = pfc."startedAt",
      "daysTraded" = pfc."daysTraded",
      "updatedAt" = now()
    FROM prop_firm_challenge pfc
    WHERE pfc."accountId" = ta.id
  `.execute(db);

  await sql`
    INSERT INTO trading_account (
      id, "userId", name, broker, type, currency,
      "startingBalance", "currentBalance", "isArchived",
      "firmName", "profitTarget", "dailyLossLimit", "maxLossLimit",
      "trailingDrawdown", "challengeStatus", "challengeStartedAt", "daysTraded",
      "createdAt", "updatedAt"
    )
    SELECT
      pfc.id,
      pfc."userId",
      pfc."firmName" || ' Challenge',
      pfc."firmName",
      'prop',
      'USD',
      pfc."accountSize",
      pfc."currentBalance",
      false,
      pfc."firmName",
      pfc."profitTarget",
      pfc."maxDailyLoss",
      pfc."maxTotalDrawdown",
      pfc."trailingDrawdown",
      pfc.status,
      pfc."startedAt",
      pfc."daysTraded",
      pfc."createdAt",
      pfc."updatedAt"
    FROM prop_firm_challenge pfc
    WHERE pfc."accountId" IS NULL
  `.execute(db);

  await db.schema.dropTable('prop_firm_challenge').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  const uuidPk = (col: any) => col.primaryKey().defaultTo(sql`gen_random_uuid()`);

  await db.schema
    .createTable('prop_firm_challenge')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('userId', 'text', (col) => col.notNull().references('user.id').onDelete('cascade'))
    .addColumn('accountId', 'uuid', (col) =>
      col.references('trading_account.id').onDelete('set null'),
    )
    .addColumn('firmName', 'text', (col) => col.notNull())
    .addColumn('accountSize', 'numeric', (col) => col.notNull())
    .addColumn('profitTarget', 'numeric', (col) => col.notNull())
    .addColumn('maxDailyLoss', 'numeric', (col) => col.notNull())
    .addColumn('maxTotalDrawdown', 'numeric', (col) => col.notNull())
    .addColumn('trailingDrawdown', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('currentBalance', 'numeric', (col) => col.notNull())
    .addColumn('daysTraded', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
    .addColumn('startedAt', 'timestamptz', (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_prop_firm_challenge_userId')
    .on('prop_firm_challenge')
    .column('userId')
    .execute();

  await db.schema
    .alterTable('trading_account')
    .dropColumn('firmName')
    .dropColumn('profitTarget')
    .dropColumn('dailyLossLimit')
    .dropColumn('maxLossLimit')
    .dropColumn('trailingDrawdown')
    .dropColumn('challengeStatus')
    .dropColumn('challengeStartedAt')
    .dropColumn('daysTraded')
    .execute();
}
