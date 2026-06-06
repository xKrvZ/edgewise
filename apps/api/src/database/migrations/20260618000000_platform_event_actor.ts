import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('platform_event')
    .addColumn('actorUserId', 'text', (col) =>
      col.references('user.id').onDelete('set null'),
    )
    .execute();

  await db.schema
    .createIndex('idx_platform_event_actorUserId')
    .on('platform_event')
    .column('actorUserId')
    .execute();

  await db.schema
    .createIndex('idx_platform_event_source_occurredAt')
    .on('platform_event')
    .columns(['source', 'occurredAt'])
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_platform_event_source_occurredAt').ifExists().execute();
  await db.schema.dropIndex('idx_platform_event_actorUserId').ifExists().execute();
  await db.schema.alterTable('platform_event').dropColumn('actorUserId').execute();
}
