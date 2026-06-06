import { Kysely, sql } from 'kysely';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const uuidPk = (col: any) => col.primaryKey().defaultTo(sql`gen_random_uuid()`);

/**
 * Global instrument catalog for trade logging and replay market-data resolution.
 * Reference rows are seeded from instruments.sql (idempotent).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('instrument')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('symbol', 'text', (col) => col.notNull().unique())
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('assetClass', 'text', (col) => col.notNull())
    .addColumn('exchange', 'text')
    .addColumn('currency', 'text')
    .addColumn('providerSymbol', 'text')
    .addColumn('isActive', 'boolean', (col) => col.notNull().defaultTo(true))
    .addColumn('createdAt', 'timestamptz', (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex('idx_instrument_symbol')
    .on('instrument')
    .column('symbol')
    .execute();

  await db.schema
    .createIndex('idx_instrument_assetClass')
    .on('instrument')
    .column('assetClass')
    .execute();

  const instrumentsSql = readFileSync(
    join(__dirname, '..', 'seeds', 'instruments.sql'),
    'utf8',
  );
  await sql.raw(instrumentsSql).execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('instrument').ifExists().execute();
}
