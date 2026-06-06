import { Kysely, sql } from 'kysely';

/**
 * Foundation schema for the Edgewise trading journal.
 *
 * Conventions:
 * - UUID primary keys via gen_random_uuid() (built into Postgres 14 core).
 * - camelCase, double-quoted column identifiers (Kysely quotes automatically)
 *   to stay consistent with the Better Auth tables already in the database.
 * - timestamptz createdAt/updatedAt with now() defaults.
 * - All domain rows are owned by a Better Auth user (userId -> "user".id, text).
 *
 * NOTE: the trading account table is named `trading_account` to avoid a
 * collision with Better Auth's existing `account` (OAuth) table.
 */

const uuidPk = (col: any) => col.primaryKey().defaultTo(sql`gen_random_uuid()`);

export async function up(db: Kysely<any>): Promise<void> {
  // ==================== trading_account ====================
  await db.schema
    .createTable('trading_account')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('broker', 'text')
    .addColumn('type', 'text', (col) => col.notNull().defaultTo('live'))
    .addColumn('currency', 'text', (col) => col.notNull().defaultTo('USD'))
    .addColumn('startingBalance', 'numeric', (col) => col.notNull().defaultTo('0'))
    .addColumn('currentBalance', 'numeric', (col) => col.notNull().defaultTo('0'))
    .addColumn('isArchived', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_trading_account_userId')
    .on('trading_account')
    .column('userId')
    .execute();

  // ==================== tag ====================
  await db.schema
    .createTable('tag')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('color', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema.createIndex('idx_tag_userId').on('tag').column('userId').execute();

  // ==================== mistake ====================
  await db.schema
    .createTable('mistake')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('color', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema.createIndex('idx_mistake_userId').on('mistake').column('userId').execute();

  // ==================== playbook ====================
  await db.schema
    .createTable('playbook')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('description', 'text')
    .addColumn('marketConditions', 'text')
    .addColumn('entryCriteria', 'text')
    .addColumn('exitCriteria', 'text')
    .addColumn('riskRules', 'text')
    .addColumn('invalidationRules', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema.createIndex('idx_playbook_userId').on('playbook').column('userId').execute();

  // ==================== playbook_checklist_item ====================
  await db.schema
    .createTable('playbook_checklist_item')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('playbookId', 'uuid', (col) =>
      col.notNull().references('playbook.id').onDelete('cascade'),
    )
    .addColumn('text', 'text', (col) => col.notNull())
    .addColumn('sortOrder', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_playbook_checklist_item_playbookId')
    .on('playbook_checklist_item')
    .column('playbookId')
    .execute();

  // ==================== trading_session ====================
  await db.schema
    .createTable('trading_session')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('startTime', 'time', (col) => col.notNull())
    .addColumn('endTime', 'time', (col) => col.notNull())
    .addColumn('timezone', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_trading_session_userId')
    .on('trading_session')
    .column('userId')
    .execute();

  // ==================== trade ====================
  await db.schema
    .createTable('trade')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('accountId', 'uuid', (col) =>
      col.notNull().references('trading_account.id').onDelete('cascade'),
    )
    .addColumn('symbol', 'text', (col) => col.notNull())
    .addColumn('marketType', 'text', (col) => col.notNull())
    .addColumn('direction', 'text', (col) => col.notNull())
    .addColumn('entryPrice', 'numeric', (col) => col.notNull())
    .addColumn('exitPrice', 'numeric')
    .addColumn('quantity', 'numeric', (col) => col.notNull())
    .addColumn('stopLoss', 'numeric')
    .addColumn('takeProfit', 'numeric')
    .addColumn('fees', 'numeric', (col) => col.notNull().defaultTo('0'))
    .addColumn('pnl', 'numeric')
    .addColumn('rMultiple', 'numeric')
    .addColumn('entryTime', 'timestamptz', (col) => col.notNull())
    .addColumn('exitTime', 'timestamptz')
    .addColumn('setupId', 'uuid', (col) => col.references('playbook.id').onDelete('set null'))
    .addColumn('playbookId', 'uuid', (col) =>
      col.references('playbook.id').onDelete('set null'),
    )
    .addColumn('sessionId', 'uuid', (col) =>
      col.references('trading_session.id').onDelete('set null'),
    )
    .addColumn('emotion', 'text')
    .addColumn('executionRating', 'integer')
    .addColumn('notes', 'text')
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('closed'))
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema.createIndex('idx_trade_userId').on('trade').column('userId').execute();
  await db.schema.createIndex('idx_trade_accountId').on('trade').column('accountId').execute();
  await db.schema.createIndex('idx_trade_symbol').on('trade').column('symbol').execute();
  await db.schema.createIndex('idx_trade_entryTime').on('trade').column('entryTime').execute();
  await db.schema.createIndex('idx_trade_playbookId').on('trade').column('playbookId').execute();
  await db.schema.createIndex('idx_trade_sessionId').on('trade').column('sessionId').execute();

  // ==================== trade_tag (join) ====================
  await db.schema
    .createTable('trade_tag')
    .addColumn('tradeId', 'uuid', (col) =>
      col.notNull().references('trade.id').onDelete('cascade'),
    )
    .addColumn('tagId', 'uuid', (col) =>
      col.notNull().references('tag.id').onDelete('cascade'),
    )
    .addPrimaryKeyConstraint('pk_trade_tag', ['tradeId', 'tagId'])
    .execute();

  await db.schema.createIndex('idx_trade_tag_tagId').on('trade_tag').column('tagId').execute();

  // ==================== trade_mistake (join) ====================
  await db.schema
    .createTable('trade_mistake')
    .addColumn('tradeId', 'uuid', (col) =>
      col.notNull().references('trade.id').onDelete('cascade'),
    )
    .addColumn('mistakeId', 'uuid', (col) =>
      col.notNull().references('mistake.id').onDelete('cascade'),
    )
    .addPrimaryKeyConstraint('pk_trade_mistake', ['tradeId', 'mistakeId'])
    .execute();

  await db.schema
    .createIndex('idx_trade_mistake_mistakeId')
    .on('trade_mistake')
    .column('mistakeId')
    .execute();

  // ==================== screenshot ====================
  await db.schema
    .createTable('screenshot')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('tradeId', 'uuid', (col) => col.references('trade.id').onDelete('cascade'))
    .addColumn('playbookId', 'uuid', (col) =>
      col.references('playbook.id').onDelete('cascade'),
    )
    .addColumn('url', 'text', (col) => col.notNull())
    .addColumn('caption', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema.createIndex('idx_screenshot_userId').on('screenshot').column('userId').execute();
  await db.schema
    .createIndex('idx_screenshot_tradeId')
    .on('screenshot')
    .column('tradeId')
    .execute();

  // ==================== prop_firm_challenge ====================
  await db.schema
    .createTable('prop_firm_challenge')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('accountId', 'uuid', (col) =>
      col.references('trading_account.id').onDelete('set null'),
    )
    .addColumn('firmName', 'text', (col) => col.notNull())
    .addColumn('accountSize', 'numeric', (col) => col.notNull())
    .addColumn('profitTarget', 'numeric', (col) => col.notNull())
    .addColumn('maxDailyLoss', 'numeric', (col) => col.notNull())
    .addColumn('maxTotalDrawdown', 'numeric', (col) => col.notNull())
    .addColumn('trailingDrawdown', 'boolean', (col) => col.notNull().defaultTo(false))
    .addColumn('currentBalance', 'numeric', (col) => col.notNull())
    .addColumn('daysTraded', 'integer', (col) => col.notNull().defaultTo(0))
    .addColumn('status', 'text', (col) => col.notNull().defaultTo('active'))
    .addColumn('startedAt', 'timestamptz', (col) => col.notNull())
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_prop_firm_challenge_userId')
    .on('prop_firm_challenge')
    .column('userId')
    .execute();

  // ==================== backtest ====================
  await db.schema
    .createTable('backtest')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('symbol', 'text', (col) => col.notNull())
    .addColumn('marketType', 'text', (col) => col.notNull())
    .addColumn('startDate', 'date', (col) => col.notNull())
    .addColumn('endDate', 'date', (col) => col.notNull())
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema.createIndex('idx_backtest_userId').on('backtest').column('userId').execute();

  // ==================== backtest_trade ====================
  await db.schema
    .createTable('backtest_trade')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('backtestId', 'uuid', (col) =>
      col.notNull().references('backtest.id').onDelete('cascade'),
    )
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('symbol', 'text', (col) => col.notNull())
    .addColumn('direction', 'text', (col) => col.notNull())
    .addColumn('entryPrice', 'numeric', (col) => col.notNull())
    .addColumn('exitPrice', 'numeric')
    .addColumn('quantity', 'numeric', (col) => col.notNull())
    .addColumn('stopLoss', 'numeric')
    .addColumn('takeProfit', 'numeric')
    .addColumn('fees', 'numeric', (col) => col.notNull().defaultTo('0'))
    .addColumn('pnl', 'numeric')
    .addColumn('rMultiple', 'numeric')
    .addColumn('entryTime', 'timestamptz', (col) => col.notNull())
    .addColumn('exitTime', 'timestamptz')
    .addColumn('notes', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_backtest_trade_backtestId')
    .on('backtest_trade')
    .column('backtestId')
    .execute();
  await db.schema
    .createIndex('idx_backtest_trade_userId')
    .on('backtest_trade')
    .column('userId')
    .execute();

  // ==================== journal_entry ====================
  await db.schema
    .createTable('journal_entry')
    .addColumn('id', 'uuid', uuidPk)
    .addColumn('userId', 'text', (col) =>
      col.notNull().references('user.id').onDelete('cascade'),
    )
    .addColumn('tradeId', 'uuid', (col) => col.references('trade.id').onDelete('cascade'))
    .addColumn('date', 'date', (col) => col.notNull())
    .addColumn('title', 'text')
    .addColumn('content', 'text', (col) => col.notNull())
    .addColumn('mood', 'text')
    .addColumn('createdAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .addColumn('updatedAt', 'timestamptz', (col) => col.notNull().defaultTo(sql`now()`))
    .execute();

  await db.schema
    .createIndex('idx_journal_entry_userId')
    .on('journal_entry')
    .column('userId')
    .execute();
  await db.schema.createIndex('idx_journal_entry_date').on('journal_entry').column('date').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  // Drop in reverse dependency order.
  await db.schema.dropTable('journal_entry').ifExists().execute();
  await db.schema.dropTable('backtest_trade').ifExists().execute();
  await db.schema.dropTable('backtest').ifExists().execute();
  await db.schema.dropTable('prop_firm_challenge').ifExists().execute();
  await db.schema.dropTable('screenshot').ifExists().execute();
  await db.schema.dropTable('trade_mistake').ifExists().execute();
  await db.schema.dropTable('trade_tag').ifExists().execute();
  await db.schema.dropTable('trade').ifExists().execute();
  await db.schema.dropTable('trading_session').ifExists().execute();
  await db.schema.dropTable('playbook_checklist_item').ifExists().execute();
  await db.schema.dropTable('playbook').ifExists().execute();
  await db.schema.dropTable('mistake').ifExists().execute();
  await db.schema.dropTable('tag').ifExists().execute();
  await db.schema.dropTable('trading_account').ifExists().execute();
}
