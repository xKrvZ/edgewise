/**
 * Edgewise demo seeder (repeatable).
 *
 * Run with:  bun run --filter '@platform/api' db:seed
 *
 * What it does (idempotent):
 *  1. Executes seed.sql, which (re)creates all demo domain data owned by the
 *     stable user id 'demo_user' (~50 trades, accounts, playbooks, etc.).
 *  2. Gives 'demo_user' working email+password credentials by writing a Better
 *     Auth `account` row whose password hash is produced by Better Auth's own
 *     hasher (so the format always matches this version). This lets you sign in
 *     directly as the seeded owner, so every domain row lights up immediately.
 *
 * Demo credentials:  demo@tradejournal.app  /  demo1234
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import sqlConfig from '../../config/sql.config';

const DEMO_USER_ID = 'demo_user';
const DEMO_EMAIL = 'demo@tradejournal.app';
const DEMO_PASSWORD = 'demo1234';

async function main(): Promise<void> {
  const pool = new Pool(sqlConfig);

  try {
    // 1. Domain data (idempotent: deletes + re-inserts demo_user rows).
    const seedSql = readFileSync(join(__dirname, 'seed.sql'), 'utf8');
    await pool.query(seedSql);

    // 2. Better Auth credential for the demo user. Use Better Auth's own
    // password hasher so the stored hash matches the configured algorithm.
    const auth = betterAuth({
      database: pool,
      emailAndPassword: { enabled: true },
    });
    const ctx = await auth.$context;
    const passwordHash = await ctx.password.hash(DEMO_PASSWORD);

    // The seed.sql already inserts the user row, but ensure it exists so this
    // script is safe to run on its own too.
    await pool.query(
      `INSERT INTO "user" (id, email, "emailVerified", name, role, "createdAt", "updatedAt")
       VALUES ($1, $2, true, 'Demo Trader', 'user', NOW(), NOW())
       ON CONFLICT (id) DO UPDATE SET "emailVerified" = true`,
      [DEMO_USER_ID, DEMO_EMAIL],
    );

    // Replace any existing credential account so the script stays idempotent.
    await pool.query(
      `DELETE FROM account WHERE "userId" = $1 AND "providerId" = 'credential'`,
      [DEMO_USER_ID],
    );
    await pool.query(
      `INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
       VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
      [randomUUID(), DEMO_USER_ID, DEMO_USER_ID, passwordHash],
    );

    // eslint-disable-next-line no-console
    console.log(
      `\nDemo seed complete.\n  email:    ${DEMO_EMAIL}\n  password: ${DEMO_PASSWORD}\n  userId:   ${DEMO_USER_ID}\n`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Demo seed failed:', err);
  process.exit(1);
});
