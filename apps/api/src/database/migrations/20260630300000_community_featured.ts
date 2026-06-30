import { Kysely } from 'kysely';



/**

 * Admin-controlled featured flag for communities on discover.

 */

export async function up(db: Kysely<any>): Promise<void> {

  await db.schema

    .alterTable('community')

    .addColumn('featured', 'boolean', (col) => col.notNull().defaultTo(false))

    .execute();



  await db.schema

    .createIndex('idx_community_featured')

    .on('community')

    .column('featured')

    .execute();

}



export async function down(db: Kysely<any>): Promise<void> {

  await db.schema.dropIndex('idx_community_featured').execute();

  await db.schema.alterTable('community').dropColumn('featured').execute();

}


