import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('appeal')
    .addColumn('acceptanceReason', 'varchar')
    .addColumn('rejectionReason', 'varchar')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('appeal')
    .dropColumn('acceptanceReason')
    .dropColumn('rejectionReason')
    .execute();
}
