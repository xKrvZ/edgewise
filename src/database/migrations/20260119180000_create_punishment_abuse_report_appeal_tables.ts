import { Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
  // Create punishment table
  await db.schema
    .createTable('punishment')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('punishmentType', 'varchar', col => col.notNull())
    .addColumn('banType', 'varchar')
    .addColumn('reason', 'varchar', col => col.notNull())
    .addColumn('expiry', 'timestamp')
    .addColumn('playerId', 'uuid', col =>
      col.references('player.id').onDelete('cascade').notNull(),
    )
    .addColumn('externalId', 'varchar')
    .addColumn('issuedById', 'varchar', (col) =>
      col.references('user.id').onDelete('set null')
    )
    .addColumn('lifted', 'boolean', (col) => col.defaultTo(false).notNull())
    .addColumn('liftedById', 'varchar', (col) =>
      col.references('user.id').onDelete('set null'),
    )
    .addColumn('liftedAt', 'timestamp')
    .addColumn('relatedAbuseReportId', 'uuid')
    .addColumn('createdAt', 'timestamp', col =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // Create abuse_report table
  await db.schema
    .createTable('abuse_report')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('reportingPlayerId', 'uuid', (col) =>
      col.references('player.id').onDelete('cascade').notNull(),
    )
    .addColumn('reportedPlayerId', 'uuid', (col) =>
      col.references('player.id').onDelete('cascade').notNull(),
    )
    .addColumn('reason', 'varchar', col => col.notNull())
    .addColumn('description', 'text')
    .addColumn('status', 'varchar', col => col.notNull())
    .addColumn('actionTaken', 'varchar')
    .addColumn('punishmentId', 'uuid', col =>
      col.references('punishment.id').onDelete('set null'),
    )
    .addColumn('metadata', 'jsonb')
    .addColumn('createdAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .execute();

  // Create appeal table
  await db.schema
    .createTable('appeal')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn('playerId', 'uuid', (col) =>
      col.references('player.id').onDelete('cascade').notNull(),
    )
    .addColumn('punishmentId', 'uuid', (col) =>
      col.references('punishment.id').onDelete('cascade').notNull(),
    )
    .addColumn('submittedAt', 'timestamp', (col) =>
      col.defaultTo(sql`now()`).notNull(),
    )
    .addColumn('status', 'varchar', (col) => col.notNull())
    .addColumn('reviewedById', 'varchar', (col) =>
      col.references('user.id').onDelete('set null'),
    )
    .execute();

  // Add foreign key constraint for relatedAbuseReportId
  await sql`
    ALTER TABLE punishment
    ADD CONSTRAINT punishment_related_abuse_report_id_fk
    FOREIGN KEY ("relatedAbuseReportId")
    REFERENCES abuse_report(id)
    ON DELETE SET NULL
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('appeal').execute();
  await db.schema.dropTable('abuse_report').execute();
  await db.schema.dropTable('punishment').execute();
}
