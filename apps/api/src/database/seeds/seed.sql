-- ============================================================================
-- Edgewise — demo seed data
-- ============================================================================
-- Idempotent: domain data for the demo user is deleted (in dependency order)
-- and re-inserted on every run. Safe to run repeatedly.
--
-- AUTH NOTE: Better Auth owns the `user` (and `account`) tables. We insert a
-- bare `user` row below so the demo data has a stable owner, BUT password login
-- requires a Better Auth `account` row with a properly hashed password, which
-- cannot be reliably hand-seeded. To actually log in as the demo user, register
-- it through the Better Auth signup flow (email: demo@tradejournal.app). All
-- domain data references the stable id 'demo_user', so it lights up as soon as
-- that user exists / is signed in.
-- ============================================================================

-- ==================== Demo user ====================
INSERT INTO "user" (id, email, "emailVerified", name, role, "createdAt", "updatedAt")
VALUES ('demo_user', 'demo@tradejournal.app', true, 'Demo Trader', 'user', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== Clean existing demo domain data ====================
-- Children cascade from their parents (trade -> trade_tag/trade_mistake,
-- backtest -> backtest_trade, playbook -> playbook_checklist_item).
DELETE FROM journal_entry       WHERE "userId" = 'demo_user';
DELETE FROM backtest            WHERE "userId" = 'demo_user';
DELETE FROM screenshot          WHERE "userId" = 'demo_user';
DELETE FROM trade               WHERE "userId" = 'demo_user';
DELETE FROM playbook            WHERE "userId" = 'demo_user';
DELETE FROM trading_session     WHERE "userId" = 'demo_user';
DELETE FROM tag                 WHERE "userId" = 'demo_user';
DELETE FROM mistake             WHERE "userId" = 'demo_user';
DELETE FROM trader_profile      WHERE "userId" = 'demo_user';
DELETE FROM trading_account     WHERE "userId" = 'demo_user';
DELETE FROM community           WHERE "createdBy" = 'demo_user';
DELETE FROM trade               WHERE "userId" IN ('demo_member_1', 'demo_member_2');
DELETE FROM trading_account     WHERE "userId" IN ('demo_member_1', 'demo_member_2');
DELETE FROM trader_profile      WHERE "userId" IN ('demo_member_1', 'demo_member_2');

-- ==================== Trading accounts ====================
INSERT INTO trading_account (
  id, "userId", name, broker, type, currency,
  "startingBalance", "currentBalance", "isArchived",
  "firmName", "profitTarget", "dailyLossLimit", "maxLossLimit",
  "trailingDrawdown", "challengeStatus", "challengeStartedAt", "daysTraded",
  "createdAt", "updatedAt"
)
VALUES
  ('a0000000-0000-4000-8000-000000000001', 'demo_user', 'Main Live Account', 'Interactive Brokers', 'live', 'USD',
    25000, 28950.50, false, NULL, NULL, NULL, NULL, false, NULL, NULL, 0,
    NOW() - INTERVAL '120 days', NOW()),
  ('a0000000-0000-4000-8000-000000000002', 'demo_user', 'FTMO 100k Funded', 'FTMO', 'prop', 'USD',
    100000, 104300.00, false, 'FTMO', 10000, 5000, 10000, false, 'active', NOW() - INTERVAL '30 days', 0,
    NOW() - INTERVAL '60 days', NOW()),
  ('f0000000-0000-4000-8000-000000000002', 'demo_user', 'The Funded Trader Challenge', 'The Funded Trader', 'prop', 'USD',
    50000, 52100.00, false, 'The Funded Trader', 4000, 2500, 5000, true, 'active', NOW() - INTERVAL '18 days', 0,
    NOW() - INTERVAL '18 days', NOW());

-- ==================== Trading sessions ====================
INSERT INTO trading_session (id, "userId", name, "startTime", "endTime", timezone, "createdAt")
VALUES
  ('c0000000-0000-4000-8000-000000000001', 'demo_user', 'Asia',     '00:00', '08:00', 'Asia/Tokyo',      NOW()),
  ('c0000000-0000-4000-8000-000000000002', 'demo_user', 'London',   '08:00', '16:30', 'Europe/London',   NOW()),
  ('c0000000-0000-4000-8000-000000000003', 'demo_user', 'New York', '13:30', '20:00', 'America/New_York', NOW());

-- ==================== Tags ====================
INSERT INTO tag (id, "userId", name, color, "createdAt")
VALUES
  ('d0000000-0000-4000-8000-000000000001', 'demo_user', 'Breakout',     '#10b981', NOW()),
  ('d0000000-0000-4000-8000-000000000002', 'demo_user', 'Trend',        '#3b82f6', NOW()),
  ('d0000000-0000-4000-8000-000000000003', 'demo_user', 'Reversal',     '#f59e0b', NOW()),
  ('d0000000-0000-4000-8000-000000000004', 'demo_user', 'News',         '#ef4444', NOW()),
  ('d0000000-0000-4000-8000-000000000005', 'demo_user', 'Scalp',        '#a855f7', NOW()),
  ('d0000000-0000-4000-8000-000000000006', 'demo_user', 'Swing',        '#06b6d4', NOW()),
  ('d0000000-0000-4000-8000-000000000007', 'demo_user', 'A+ Setup',     '#22c55e', NOW()),
  ('d0000000-0000-4000-8000-000000000008', 'demo_user', 'Earnings',     '#eab308', NOW());

-- ==================== Mistakes ====================
INSERT INTO mistake (id, "userId", name, color, "createdAt")
VALUES
  ('e0000000-0000-4000-8000-000000000001', 'demo_user', 'Moved stop loss',     '#ef4444', NOW()),
  ('e0000000-0000-4000-8000-000000000002', 'demo_user', 'Oversized position',  '#f97316', NOW()),
  ('e0000000-0000-4000-8000-000000000003', 'demo_user', 'FOMO entry',          '#f43f5e', NOW()),
  ('e0000000-0000-4000-8000-000000000004', 'demo_user', 'No stop loss',        '#dc2626', NOW()),
  ('e0000000-0000-4000-8000-000000000005', 'demo_user', 'Revenge trade',       '#b91c1c', NOW()),
  ('e0000000-0000-4000-8000-000000000006', 'demo_user', 'Exited early',        '#fb923c', NOW());

-- ==================== Playbooks ====================
INSERT INTO playbook
  (id, "userId", name, description, "marketConditions", "entryCriteria", "exitCriteria", "riskRules", "invalidationRules", "createdAt", "updatedAt")
VALUES
  ('b0000000-0000-4000-8000-000000000001', 'demo_user', 'Opening Range Breakout',
    'Trade the break of the first 15-minute range on high relative volume.',
    'Trending day, elevated pre-market volume', 'Break + close above OR high with volume',
    'Trail under prior 5m swing; target 2R', 'Risk 1% per trade, max 3 trades/day',
    'Loss of OR high after entry', NOW() - INTERVAL '100 days', NOW()),
  ('b0000000-0000-4000-8000-000000000002', 'demo_user', 'Trend Pullback',
    'Buy pullbacks to the 20 EMA in an established uptrend.',
    'Clear higher-highs / higher-lows', 'Pullback to 20 EMA with bullish rejection',
    'Scale out at prior high, runner to trail', 'Risk 0.75% per trade',
    'Close below 50 EMA', NOW() - INTERVAL '95 days', NOW()),
  ('b0000000-0000-4000-8000-000000000003', 'demo_user', 'Mean Reversion',
    'Fade extended moves into a key level with confirmation.',
    'Range-bound / overextended', 'RSI divergence at support/resistance',
    'Target mid-range; tight stop beyond level', 'Risk 0.5% per trade',
    'Strong momentum close through level', NOW() - INTERVAL '80 days', NOW()),
  ('b0000000-0000-4000-8000-000000000004', 'demo_user', 'Counter-trend Fade',
    'Higher-risk fade of parabolic moves. Use sparingly.',
    'Climactic exhaustion move', 'Exhaustion candle + volume spike',
    'Quick scalp to VWAP', 'Risk 0.5% per trade, no adds',
    'New high/low after entry', NOW() - INTERVAL '70 days', NOW());

-- ==================== Playbook checklist items ====================
INSERT INTO playbook_checklist_item (id, "playbookId", text, "sortOrder", "createdAt")
VALUES
  (gen_random_uuid(), 'b0000000-0000-4000-8000-000000000001', 'Confirm trend on higher timeframe', 0, NOW()),
  (gen_random_uuid(), 'b0000000-0000-4000-8000-000000000001', 'Relative volume > 1.5x', 1, NOW()),
  (gen_random_uuid(), 'b0000000-0000-4000-8000-000000000001', 'Clear opening range defined', 2, NOW()),
  (gen_random_uuid(), 'b0000000-0000-4000-8000-000000000001', 'Risk is 1% or less', 3, NOW()),
  (gen_random_uuid(), 'b0000000-0000-4000-8000-000000000002', 'Uptrend intact (HH/HL)', 0, NOW()),
  (gen_random_uuid(), 'b0000000-0000-4000-8000-000000000002', 'Price at 20 EMA', 1, NOW()),
  (gen_random_uuid(), 'b0000000-0000-4000-8000-000000000002', 'Bullish rejection candle', 2, NOW()),
  (gen_random_uuid(), 'b0000000-0000-4000-8000-000000000003', 'At a key level', 0, NOW()),
  (gen_random_uuid(), 'b0000000-0000-4000-8000-000000000003', 'RSI divergence present', 1, NOW());

-- ==================== Trades (~50, deterministic & internally consistent) ====================
WITH calc AS (
  SELECT
    i,
    (i % 10) AS k,
    (ARRAY['AAPL','MSFT','NVDA','TSLA','SPY','ES','NQ','EURUSD','BTCUSD','AMD'])[(i % 10) + 1] AS symbol,
    (ARRAY['stocks','stocks','stocks','stocks','stocks','futures','futures','forex','crypto','stocks'])[(i % 10) + 1] AS market_type,
    (ARRAY[185, 410, 120, 240, 530, 5400, 19000, 1.08, 64000, 160])[(i % 10) + 1]::numeric AS base_price,
    (ARRAY[100, 100, 100, 100, 100, 3, 3, 10000, 0.2, 100])[(i % 10) + 1]::numeric AS qty,
    CASE WHEN i % 3 = 0 THEN -1 ELSE 1 END AS dir_mult,
    CASE WHEN (i * 7) % 12 < 7
      THEN round((60 + (i * 37) % 440)::numeric, 2)
      ELSE -round((40 + (i * 53) % 300)::numeric, 2)
    END AS pnl,
    (NOW() - ((i * 1.8) || ' days')::interval + ((i % 6) || ' hours')::interval) AS entry_time
  FROM generate_series(1, 50) AS g(i)
)
INSERT INTO trade (
  id, "userId", "accountId", symbol, "marketType", direction,
  "entryPrice", "exitPrice", quantity, "stopLoss", "takeProfit",
  fees, pnl, "rMultiple", "entryTime", "exitTime",
  "setupId", "playbookId", "sessionId", emotion, "executionRating", notes, status,
  "createdAt", "updatedAt"
)
SELECT
  gen_random_uuid(),
  'demo_user',
  CASE WHEN i % 5 = 0
    THEN 'a0000000-0000-4000-8000-000000000002'::uuid
    ELSE 'a0000000-0000-4000-8000-000000000001'::uuid END,
  symbol,
  market_type,
  CASE WHEN dir_mult = -1 THEN 'short' ELSE 'long' END,
  base_price,
  round(base_price + dir_mult * (pnl / qty), 6),
  qty,
  round(base_price - dir_mult * (base_price * 0.01), 6),
  round(base_price + dir_mult * (base_price * 0.02), 6),
  2,
  pnl,
  round(pnl / NULLIF(base_price * 0.01 * qty, 0), 2),
  entry_time,
  entry_time + INTERVAL '90 minutes',
  (ARRAY[
    'b0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000003',
    'b0000000-0000-4000-8000-000000000004'
  ])[(i % 4) + 1]::uuid,
  (ARRAY[
    'b0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000003',
    'b0000000-0000-4000-8000-000000000004'
  ])[(i % 4) + 1]::uuid,
  (ARRAY[
    'c0000000-0000-4000-8000-000000000001',
    'c0000000-0000-4000-8000-000000000002',
    'c0000000-0000-4000-8000-000000000003'
  ])[(i % 3) + 1]::uuid,
  (ARRAY['confident','calm','anxious','greedy','disciplined'])[(i % 5) + 1],
  (i % 5) + 1,
  'Auto-seeded demo trade #' || i,
  'closed',
  entry_time,
  entry_time + INTERVAL '90 minutes'
FROM calc;

-- ==================== Trade <-> Tag links (1-2 per trade) ====================
INSERT INTO trade_tag ("tradeId", "tagId")
SELECT t.id, tg.id
FROM trade t
JOIN LATERAL (
  SELECT id, row_number() OVER (ORDER BY name) AS rn
  FROM tag WHERE "userId" = 'demo_user'
) tg ON (abs(hashtext(t.id::text)) % 8) + 1 = tg.rn
WHERE t."userId" = 'demo_user'
ON CONFLICT DO NOTHING;

INSERT INTO trade_tag ("tradeId", "tagId")
SELECT t.id, tg.id
FROM trade t
JOIN LATERAL (
  SELECT id, row_number() OVER (ORDER BY name) AS rn
  FROM tag WHERE "userId" = 'demo_user'
) tg ON (abs(hashtext(t.id::text || 'b')) % 8) + 1 = tg.rn
WHERE t."userId" = 'demo_user' AND t.pnl > 0
ON CONFLICT DO NOTHING;

-- ==================== Trade <-> Mistake links (losers only) ====================
INSERT INTO trade_mistake ("tradeId", "mistakeId")
SELECT t.id, mk.id
FROM trade t
JOIN LATERAL (
  SELECT id, row_number() OVER (ORDER BY name) AS rn
  FROM mistake WHERE "userId" = 'demo_user'
) mk ON (abs(hashtext(t.id::text)) % 6) + 1 = mk.rn
WHERE t."userId" = 'demo_user' AND t.pnl < 0
ON CONFLICT DO NOTHING;

-- ==================== Backtest + backtest trades ====================
INSERT INTO backtest (id, "userId", name, symbol, "marketType", "startDate", "endDate", notes, "createdAt", "updatedAt")
VALUES
  ('90000000-0000-4000-8000-000000000001', 'demo_user', 'ORB strategy — ES Q1', 'ES', 'futures',
    (NOW() - INTERVAL '120 days')::date, (NOW() - INTERVAL '30 days')::date,
    'Backtest of the opening range breakout playbook on the ES.', NOW(), NOW());

INSERT INTO backtest_trade (
  id, "backtestId", "userId", symbol, direction, "entryPrice", "exitPrice",
  quantity, "stopLoss", "takeProfit", fees, pnl, "rMultiple", "entryTime", "exitTime", notes, "createdAt"
)
SELECT
  gen_random_uuid(),
  '90000000-0000-4000-8000-000000000001',
  'demo_user',
  'ES',
  CASE WHEN i % 3 = 0 THEN 'short' ELSE 'long' END,
  5400,
  round(5400 + (CASE WHEN i % 3 = 0 THEN -1 ELSE 1 END) * (bt.pnl / 3), 4),
  3,
  round(5400 - (CASE WHEN i % 3 = 0 THEN -1 ELSE 1 END) * 54, 4),
  round(5400 + (CASE WHEN i % 3 = 0 THEN -1 ELSE 1 END) * 108, 4),
  4,
  bt.pnl,
  round(bt.pnl / NULLIF(54 * 3, 0), 2),
  (NOW() - ((i * 8) || ' days')::interval),
  (NOW() - ((i * 8) || ' days')::interval) + INTERVAL '2 hours',
  'Backtest trade #' || i,
  NOW()
FROM generate_series(1, 10) AS g(i)
CROSS JOIN LATERAL (
  SELECT CASE WHEN (i * 5) % 11 < 7
    THEN round((90 + (i * 41) % 360)::numeric, 2)
    ELSE -round((60 + (i * 47) % 240)::numeric, 2)
  END AS pnl
) bt;

-- ==================== Journal entries ====================
INSERT INTO journal_entry (id, "userId", date, title, content, mood, "createdAt", "updatedAt")
VALUES
  (gen_random_uuid(), 'demo_user', (NOW() - INTERVAL '1 day')::date, 'Solid disciplined day',
    'Stuck to the plan, only took A+ breakouts. Let winners run to target. Felt calm and in control.', 'calm', NOW(), NOW()),
  (gen_random_uuid(), 'demo_user', (NOW() - INTERVAL '4 days')::date, 'Overtraded the chop',
    'Took too many low-conviction trades midday. Need to step away when there is no clear setup.', 'frustrated', NOW(), NOW()),
  (gen_random_uuid(), 'demo_user', (NOW() - INTERVAL '9 days')::date, 'Cut a winner too early',
    'Exited NVDA before target out of fear. The trade hit 2R after I left. Trust the plan.', 'anxious', NOW(), NOW()),
  (gen_random_uuid(), 'demo_user', (NOW() - INTERVAL '15 days')::date, 'Best week so far',
    'Consistent execution across London and NY sessions. Risk stayed under 1% per trade.', 'confident', NOW(), NOW()),
  (gen_random_uuid(), 'demo_user', (NOW() - INTERVAL '22 days')::date, 'Revenge trade lesson',
    'Tried to make back a loss immediately and sized up. Classic mistake. Logged it and moved on.', 'angry', NOW(), NOW());

-- Link the "Best week so far" entry to recent trades for multi-trade demo data.
INSERT INTO journal_entry_trade ("journalEntryId", "tradeId")
SELECT je.id, t.id
FROM journal_entry je
CROSS JOIN LATERAL (
  SELECT id FROM trade
  WHERE "userId" = 'demo_user'
  ORDER BY "entryTime" DESC
  LIMIT 3
) t
WHERE je."userId" = 'demo_user' AND je.title = 'Best week so far';

-- ==================== Screenshots ====================
INSERT INTO screenshot (id, "userId", "tradeId", "playbookId", url, caption, "createdAt")
VALUES
  (gen_random_uuid(), 'demo_user', NULL, 'b0000000-0000-4000-8000-000000000001',
    'https://images.example.com/playbooks/orb-annotated.png', 'Annotated ORB example', NOW()),
  (gen_random_uuid(), 'demo_user', NULL, 'b0000000-0000-4000-8000-000000000002',
    'https://images.example.com/playbooks/trend-pullback.png', 'Trend pullback at 20 EMA', NOW());

-- Attach a couple of screenshots to recent trades.
INSERT INTO screenshot (id, "userId", "tradeId", "playbookId", url, caption, "createdAt")
SELECT gen_random_uuid(), 'demo_user', t.id, NULL,
  'https://images.example.com/trades/' || t.symbol || '-' || row_number() OVER (ORDER BY t."entryTime" DESC) || '.png',
  'Chart for ' || t.symbol || ' trade', NOW()
FROM trade t
WHERE t."userId" = 'demo_user'
ORDER BY t."entryTime" DESC
LIMIT 3;

-- ==================== Public sharing demo ====================
INSERT INTO trader_profile ("userId", "displayName", bio, "statsVisibility", "statsShareToken", "favoriteSymbols", "sharePlaybooks", "createdAt", "updatedAt")
VALUES (
  'demo_user',
  'Demo Trader',
  'Systematic futures trader sharing aggregate performance stats.',
  'public',
  'demoStatsShareToken21c',
  ARRAY['ES', 'NQ', 'CL'],
  true,
  NOW(),
  NOW()
)
ON CONFLICT ("userId") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  bio = EXCLUDED.bio,
  "statsVisibility" = EXCLUDED."statsVisibility",
  "statsShareToken" = EXCLUDED."statsShareToken",
  "favoriteSymbols" = EXCLUDED."favoriteSymbols",
  "sharePlaybooks" = EXCLUDED."sharePlaybooks",
  "updatedAt" = NOW();

-- Share first two playbooks on demo public profile (name + description only on public page).
INSERT INTO trader_profile_playbook ("userId", "playbookId")
SELECT 'demo_user', p.id
FROM playbook p
WHERE p."userId" = 'demo_user'
ORDER BY p.name
LIMIT 2
ON CONFLICT DO NOTHING;

-- Mark the most recent closed trade as unlisted-shareable for link previews.
UPDATE trade
SET visibility = 'unlisted', "shareToken" = 'demoTradeShareToken21c'
WHERE id = (
  SELECT id FROM trade
  WHERE "userId" = 'demo_user' AND status = 'closed'
  ORDER BY "entryTime" DESC
  LIMIT 1
);

-- Attach demo media to the shared trade (external URL for local dev without MinIO).
-- One public item (shown on share link) and one private (hidden from share link).
INSERT INTO screenshot (id, "userId", "tradeId", "playbookId", url, kind, caption, visibility, "createdAt")
SELECT gen_random_uuid(), 'demo_user', t.id, NULL,
  'https://images.example.com/trades/shared-demo-chart.png',
  'image',
  'Shared trade chart capture',
  'public',
  NOW()
FROM trade t
WHERE t."shareToken" = 'demoTradeShareToken21c';

INSERT INTO screenshot (id, "userId", "tradeId", "playbookId", url, kind, caption, visibility, "createdAt")
SELECT gen_random_uuid(), 'demo_user', t.id, NULL,
  'https://images.example.com/trades/shared-demo-private.png',
  'image',
  'Private notes screenshot (not on share link)',
  'private',
  NOW()
FROM trade t
WHERE t."shareToken" = 'demoTradeShareToken21c';

-- ==================== Demo community users ====================
INSERT INTO "user" (id, email, "emailVerified", name, role, "createdAt", "updatedAt")
VALUES
  ('demo_member_1', 'member1@tradejournal.app', true, 'Alex Rivera', 'user', NOW(), NOW()),
  ('demo_member_2', 'member2@tradejournal.app', true, 'Jordan Lee', 'user', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO trader_profile ("userId", "displayName", bio, "statsVisibility", "createdAt", "updatedAt")
VALUES
  ('demo_member_1', 'Alex R.', 'Momentum futures trader.', 'private', NOW(), NOW()),
  ('demo_member_2', 'Jordan L.', 'Swing trader focused on indices.', 'private', NOW(), NOW())
ON CONFLICT ("userId") DO UPDATE SET
  "displayName" = EXCLUDED."displayName",
  "updatedAt" = NOW();

INSERT INTO trading_account (
  id, "userId", name, broker, type, currency,
  "startingBalance", "currentBalance", "isArchived",
  "createdAt", "updatedAt"
)
VALUES
  ('a0000000-0000-4000-8000-000000000101', 'demo_member_1', 'Alex Live', 'Topstep', 'prop', 'USD',
    50000, 51270, false, NOW() - INTERVAL '30 days', NOW()),
  ('a0000000-0000-4000-8000-000000000102', 'demo_member_2', 'Jordan Live', 'Apex', 'prop', 'USD',
    25000, 25280, false, NOW() - INTERVAL '30 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- ==================== Demo community ====================
INSERT INTO community (id, name, description, "createdBy", "createdAt", "updatedAt")
VALUES (
  'f1000000-0000-4000-8000-000000000001',
  'Alpha Traders Circle',
  'Demo mentorship community for systematic traders.',
  'demo_user',
  NOW() - INTERVAL '14 days',
  NOW()
);

INSERT INTO community_member (id, "communityId", "userId", role, "joinedAt")
VALUES
  (gen_random_uuid(), 'f1000000-0000-4000-8000-000000000001', 'demo_user', 'owner', NOW() - INTERVAL '14 days'),
  (gen_random_uuid(), 'f1000000-0000-4000-8000-000000000001', 'demo_member_1', 'mentor', NOW() - INTERVAL '10 days'),
  (gen_random_uuid(), 'f1000000-0000-4000-8000-000000000001', 'demo_member_2', 'member', NOW() - INTERVAL '7 days');

-- Seed a few closed trades for community members (leaderboard demo).
INSERT INTO trade (
  id, "userId", "accountId", symbol, direction, "marketType", status,
  "entryPrice", "exitPrice", quantity, "entryTime", "exitTime",
  pnl, fees, "rMultiple", "createdAt", "updatedAt"
)
VALUES
  (gen_random_uuid(), 'demo_member_1', 'a0000000-0000-4000-8000-000000000101',
    'ES', 'long', 'futures', 'closed', 5200, 5210, 2,
    NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '2 hours',
    850.00, 4.50, 1.8, NOW(), NOW()),
  (gen_random_uuid(), 'demo_member_1', 'a0000000-0000-4000-8000-000000000101',
    'NQ', 'short', 'futures', 'closed', 18500, 18470, 1,
    NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '1 hour',
    420.00, 4.50, 0.9, NOW(), NOW()),
  (gen_random_uuid(), 'demo_member_2', 'a0000000-0000-4000-8000-000000000102',
    'ES', 'long', 'futures', 'closed', 5180, 5175, 1,
    NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days' + INTERVAL '30 minutes',
    -280.00, 4.50, -0.6, NOW(), NOW()),
  (gen_random_uuid(), 'demo_member_2', 'a0000000-0000-4000-8000-000000000102',
    'CL', 'long', 'futures', 'closed', 72.5, 73.2, 2,
    NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '3 hours',
    560.00, 4.50, 1.2, NOW(), NOW());

-- ==================== Demo community comment + notification ====================
INSERT INTO comment (
  id, "authorId", "targetType", "targetId", "communityId", "parentId",
  body, "createdAt", "updatedAt"
)
SELECT
  'c1000000-0000-4000-8000-000000000001',
  'demo_user',
  'trade',
  t.id,
  'f1000000-0000-4000-8000-000000000001',
  NULL,
  'Nice execution on the entry — consider tightening your stop next time.',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
FROM trade t
WHERE t."userId" = 'demo_member_2'
ORDER BY t."entryTime" DESC
LIMIT 1
ON CONFLICT (id) DO NOTHING;

INSERT INTO notification (
  id, "userId", type, "actorId", "commentId", "targetType", "targetId",
  "communityId", read, "createdAt"
)
SELECT
  'a1000000-0000-4000-8000-000000000001',
  'demo_member_2',
  'comment',
  'demo_user',
  'c1000000-0000-4000-8000-000000000001',
  'trade',
  c."targetId",
  'f1000000-0000-4000-8000-000000000001',
  false,
  NOW() - INTERVAL '1 day'
FROM comment c
WHERE c.id = 'c1000000-0000-4000-8000-000000000001'
ON CONFLICT (id) DO NOTHING;
