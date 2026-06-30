import { Kysely } from 'kysely';

/**
 * Leaderboard visibility: public, members (all members), or mentors (owner/mentor only).
 */
export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .alterTable('community')
    .addColumn('leaderboardVisibility', 'text', (col) =>
      col.notNull().defaultTo('mentors'),
    )
    .execute();

  await db.schema
    .createIndex('idx_community_leaderboardVisibility')
    .on('community')
    .column('leaderboardVisibility')
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropIndex('idx_community_leaderboardVisibility').execute();
  await db.schema.alterTable('community').dropColumn('leaderboardVisibility').execute();
}
