-- Seed script for platform database
-- This script seeds all tables except the notes table
-- Note: Users should ideally be created through Better Auth, but we include sample users here for testing

-- Clear existing data (in reverse order of dependencies)
DELETE FROM appeal;
DELETE FROM abuse_report;
DELETE FROM punishment;
DELETE FROM player;
-- Note: We don't delete users as they're managed by Better Auth

-- ==================== Seed Players ====================
INSERT INTO player (id, "externalId", "lastKnownUsername", game, "createdAt", "updatedAt")
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'player1_ext', 'PlayerOne', 'hytale', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'player2_ext', 'PlayerTwo', 'hytale', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'player3_ext', 'PlayerThree', 'minecraft', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'player4_ext', 'PlayerFour', 'minecraft', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'player5_ext', 'PlayerFive', 'terraria', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ==================== Seed Users (for reference - these should be created via Better Auth) ====================
-- Note: These are sample user IDs. In production, create users through Better Auth API
-- The user table structure from Better Auth includes: id (varchar), email, name, role, etc.
-- For seeding purposes, we assume these users exist. If they don't, you'll need to create them via Better Auth first.

-- Sample user IDs (replace with actual user IDs from your Better Auth setup)
-- 'admin_user_id_1' - Administrator
-- 'mod_user_id_1' - Moderator
-- 'mod_user_id_2' - Moderator

-- ==================== Seed Punishments ====================
INSERT INTO punishment (
  id,
  "punishmentType",
  "banType",
  reason,
  expiry,
  "playerId",
  "externalId",
  "issuedById",
  lifted,
  "liftedById",
  "liftedAt",
  "relatedAbuseReportId",
  "createdAt"
)
VALUES
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'ban',
    'temporary',
    'Cheating detected',
    NOW() + INTERVAL '30 days',
    '550e8400-e29b-41d4-a716-446655440001',
    'punishment_ext_1',
    NULL, -- issuedById - replace with actual user ID
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '5 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'ban',
    'permanent',
    'Repeated violations',
    NULL,
    '550e8400-e29b-41d4-a716-446655440002',
    'punishment_ext_2',
    NULL, -- issuedById - replace with actual user ID
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '10 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    'mute',
    NULL,
    'Inappropriate language',
    NOW() + INTERVAL '7 days',
    '550e8400-e29b-41d4-a716-446655440003',
    'punishment_ext_3',
    NULL, -- issuedById - replace with actual user ID
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '2 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440004',
    'kick',
    NULL,
    'Disruptive behavior',
    NULL,
    '550e8400-e29b-41d4-a716-446655440004',
    NULL,
    NULL, -- issuedById - replace with actual user ID
    true,
    NULL, -- liftedById - replace with actual user ID
    NOW() - INTERVAL '1 day',
    NULL,
    NOW() - INTERVAL '3 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440005',
    'ban',
    'temporary',
    'Suspicious activity',
    NOW() + INTERVAL '14 days',
    '550e8400-e29b-41d4-a716-446655440005',
    'punishment_ext_5',
    NULL, -- issuedById - replace with actual user ID
    false,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT DO NOTHING;

-- ==================== Seed Abuse Reports ====================
INSERT INTO abuse_report (
  id,
  "reportingPlayerId",
  "reportedPlayerId",
  reason,
  description,
  status,
  "actionTaken",
  "punishmentId",
  metadata,
  "createdAt"
)
VALUES
  (
    '770e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    'Harassment',
    'Player was repeatedly sending offensive messages in chat',
    'pending',
    NULL,
    NULL,
    '{"chatLogs": ["Message 1", "Message 2", "Message 3"]}'::jsonb,
    NOW() - INTERVAL '1 day'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    'Cheating',
    'Player was using unauthorized mods',
    'reviewed',
    'punishment',
    '660e8400-e29b-41d4-a716-446655440001',
    NULL,
    NOW() - INTERVAL '5 days'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440001',
    'Griefing',
    'Player was destroying other players builds',
    'reviewed',
    'no-punishment',
    NULL,
    NULL,
    NOW() - INTERVAL '3 days'
  )
ON CONFLICT DO NOTHING;

-- ==================== Seed Appeals ====================
INSERT INTO appeal (
  id,
  "playerId",
  "punishmentId",
  "submittedAt",
  status,
  "reviewedById"
)
VALUES
  (
    '880e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    NOW() - INTERVAL '2 days',
    'pending',
    NULL
  ),
  (
    '880e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440002',
    NOW() - INTERVAL '8 days',
    'denied',
    NULL -- reviewedById - replace with actual user ID
  ),
  (
    '880e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440003',
    '660e8400-e29b-41d4-a716-446655440003',
    NOW() - INTERVAL '1 day',
    'accepted',
    NULL -- reviewedById - replace with actual user ID
  )
ON CONFLICT DO NOTHING;

-- ==================== Update Foreign Key References ====================
-- Update punishment to link to abuse report
UPDATE punishment
SET "relatedAbuseReportId" = '770e8400-e29b-41d4-a716-446655440002'
WHERE id = '660e8400-e29b-41d4-a716-446655440001';
