import { Kysely, sql } from 'kysely';

/**
 * Community bans: prevent removed users from rejoining after a ban (kick has no ban record).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('community_ban')
    .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn('communityId', 'uuid', (col) =>
      col.notNull().references('community.id').onDelete('cascade'),
    )
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('bannedBy', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('bannedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('reason', 'text')
    .execute();

  await db.schema
    .createIndex('community_ban_communityId_userId_unique')
    .on('community_ban')
    .columns(['communityId', 'userId'])
    .unique()
    .execute();

  await db.schema
    .createIndex('idx_community_ban_communityId')
    .on('community_ban')
    .column('communityId')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('community_ban').execute();
}
