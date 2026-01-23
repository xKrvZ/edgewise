import { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('punishment')
    .addColumn('liftNoteId', 'uuid', (col) =>
      col.references('note.id').onDelete('set null'),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('punishment')
    .dropColumn('liftNoteId')
    .execute();
}
