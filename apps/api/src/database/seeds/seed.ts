/**
 * Edgewise demo seeder (repeatable).
 *
 * Run with:  bun run --filter '@platform/api' db:seed
 *
 * What it does (idempotent):
 *  1. Executes seed.sql, which (re)creates all demo domain data owned by the
 *     stable user id 'demo_user' (~50 trades, accounts, playbooks, etc.).
 *  2. Gives 'demo_user' and 'admin_user' working email+password credentials by
 *     writing Better Auth `account` rows whose password hashes are produced by
 *     Better Auth's own hasher (so the format always matches this version).
 *
 * Demo credentials:  demo@tradejournal.app  /  demo1234  (role: user)
 * Admin credentials:  admin@tradejournal.app /  admin1234  (role: Administrator)
 */
import { randomUUID } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';
import { ROLES } from '../../auth/constants/roles.constants';
import sqlConfig from '../../config/sql.config';

const DEMO_USER_ID = 'demo_user';
const DEMO_EMAIL = 'demo@tradejournal.app';
const DEMO_PASSWORD = 'demo1234';

const ADMIN_USER_ID = 'admin_user';
const ADMIN_EMAIL = 'admin@tradejournal.app';
const ADMIN_PASSWORD = 'admin1234';

async function seedAuthCredentials(
  pool: Pool,
  hashPassword: (password: string) => Promise<string>,
  user: { id: string; email: string; password: string; name: string; role: string },
): Promise<void> {
  const passwordHash = await hashPassword(user.password);

  await pool.query(
    `INSERT INTO "user" (id, email, "emailVerified", name, role, "createdAt", "updatedAt")
     VALUES ($1, $2, true, $3, $4, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET "emailVerified" = true, role = EXCLUDED.role`,
    [user.id, user.email, user.name, user.role],
  );

  await pool.query(
    `DELETE FROM account WHERE "userId" = $1 AND "providerId" = 'credential'`,
    [user.id],
  );
  await pool.query(
    `INSERT INTO account (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
     VALUES ($1, $2, 'credential', $3, $4, NOW(), NOW())`,
    [randomUUID(), user.id, user.id, passwordHash],
  );
}

async function main(): Promise<void> {
  const pool = new Pool(sqlConfig);

  try {
    // 1. Global instrument catalog (idempotent).
    const instrumentsSql = readFileSync(join(__dirname, 'instruments.sql'), 'utf8');
    await pool.query(instrumentsSql);

    // 2. Domain data (idempotent: deletes + re-inserts demo_user rows).
    const seedSql = readFileSync(join(__dirname, 'seed.sql'), 'utf8');
    await pool.query(seedSql);

    // 3. Better Auth credentials. Use Better Auth's own password hasher so the
    // stored hash matches the configured algorithm.
    const auth = betterAuth({
      database: pool,
      emailAndPassword: { enabled: true },
    });
    const ctx = await auth.$context;
    const hashPassword = (password: string) => ctx.password.hash(password);

    // The seed.sql already inserts the demo user row; ensure credentials exist.
    await seedAuthCredentials(pool, hashPassword, {
      id: DEMO_USER_ID,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      name: 'Demo Trader',
      role: 'user',
    });

    await seedAuthCredentials(pool, hashPassword, {
      id: ADMIN_USER_ID,
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      name: 'Platform Admin',
      role: ROLES.ADMINISTRATOR,
    });

    await pool.query(
      `INSERT INTO user_subscription ("userId", status, "updatedAt")
       VALUES ($1, 'active', NOW())
       ON CONFLICT ("userId") DO UPDATE SET status = 'active', "updatedAt" = NOW()`,
      [DEMO_USER_ID],
    );

    await pool.query(
      `INSERT INTO platform_event (source, type, "idempotencyKey", "userId", "occurredAt", payload)
       SELECT
         'auth',
         'user.registered',
         'auth:user.registered:' || u.id,
         u.id,
         u."createdAt",
         jsonb_build_object('userId', u.id)
       FROM "user" u
       ON CONFLICT ("idempotencyKey") DO NOTHING`,
    );

    // eslint-disable-next-line no-console
    console.log(
      `\nSeed complete.\n\nDemo user:\n  email:    ${DEMO_EMAIL}\n  password: ${DEMO_PASSWORD}\n  userId:   ${DEMO_USER_ID}\n  role:     user\n\nAdmin user:\n  email:    ${ADMIN_EMAIL}\n  password: ${ADMIN_PASSWORD}\n  userId:   ${ADMIN_USER_ID}\n  role:     ${ROLES.ADMINISTRATOR}\n`,
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
