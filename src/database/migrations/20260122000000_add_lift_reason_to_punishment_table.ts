import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('punishment')
    .addColumn('liftReason', 'text')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('punishment')
    .dropColumn('liftReason')
    .execute();
}
