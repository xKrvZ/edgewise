-- Seed script for platform database
-- This script seeds all tables except the notes table
-- Note: Users should ideally be created through Better Auth, but we include sample users here for testing

-- Clear existing data (in reverse order of dependencies)
DELETE FROM appeal;
DELETE FROM punishment;
DELETE FROM abuse_report;
DELETE FROM player;
-- Note: We don't delete users as they're managed by Better Auth

-- ==================== Seed Players ====================
INSERT INTO player (id, "externalId", "lastKnownUsername", game, "createdAt", "updatedAt")
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'player1_ext', 'PlayerOne', 'hytale', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'player2_ext', 'PlayerTwo', 'hytale', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440003', 'player3_ext', 'PlayerThree', 'minecraft', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440004', 'player4_ext', 'PlayerFour', 'minecraft', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440005', 'player5_ext', 'PlayerFive', 'terraria', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440006', 'player6_ext', 'PlayerSix', 'hytale', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440007', 'player7_ext', 'PlayerSeven', 'minecraft', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440008', 'player8_ext', 'PlayerEight', 'terraria', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440009', 'player9_ext', 'PlayerNine', 'hytale', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440010', 'player10_ext', 'PlayerTen', 'minecraft', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ==================== Seed Users (for reference - these should be created via Better Auth) ====================
-- Note: These are sample user IDs. In production, create users through Better Auth API
-- The user table structure from Better Auth includes: id (varchar), email, name, role, etc.
-- For seeding purposes, we assume these users exist. If they don't, you'll need to create them via Better Auth first.

-- Sample user IDs (replace with actual user IDs from your Better Auth setup)
-- 'admin_user_id_1' - Administrator
-- 'mod_user_id_1' - Moderator
-- 'mod_user_id_2' - Moderator

-- ==================== Seed Abuse Reports ====================
-- Note: Abuse reports must be inserted before punishments since punishments can reference them
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
  -- Pending reports
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
    '770e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440007',
    'Griefing',
    'Player destroyed my build without permission',
    'pending',
    NULL,
    NULL,
    '{"screenshots": ["screenshot1.png"], "location": "spawn area"}'::jsonb,
    NOW() - INTERVAL '3 hours'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440009',
    'Scamming',
    'Player promised items but never delivered',
    'pending',
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '12 hours'
  ),
  -- Reviewed reports with punishment (punishmentId will be set after punishments are inserted)
  (
    '770e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    'Cheating',
    'Player was using unauthorized mods',
    'reviewed',
    'punishment',
    NULL, -- Will be set to '660e8400-e29b-41d4-a716-446655440001' after punishments are inserted
    NULL,
    NOW() - INTERVAL '5 days'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440001',
    'Harassment',
    'Repeated toxic messages and personal attacks',
    'reviewed',
    'punishment',
    NULL, -- Will be set to '660e8400-e29b-41d4-a716-446655440006' after punishments are inserted
    '{"chatLogs": ["toxic message 1", "toxic message 2"]}'::jsonb,
    NOW() - INTERVAL '4 days'
  ),
  -- Reviewed reports without punishment
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
  ),
  (
    '770e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    'Cheating',
    'False report - player was not cheating',
    'reviewed',
    'no-punishment',
    NULL,
    NULL,
    NOW() - INTERVAL '6 days'
  )
ON CONFLICT DO NOTHING;

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
  "liftReason",
  "relatedAbuseReportId",
  "createdAt"
)
VALUES
  -- Active punishments (not lifted)
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
    '770e8400-e29b-41d4-a716-446655440002',
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
    NULL,
    NOW() - INTERVAL '2 days'
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
    NULL,
    NOW() - INTERVAL '1 day'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440006',
    'mute',
    NULL,
    'Spamming chat',
    NOW() + INTERVAL '3 days',
    '550e8400-e29b-41d4-a716-446655440006',
    NULL,
    NULL,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '4 hours'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440007',
    'kick',
    NULL,
    'AFK timeout',
    NULL,
    '550e8400-e29b-41d4-a716-446655440007',
    NULL,
    NULL,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '2 hours'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440008',
    'ban',
    'temporary',
    'Exploiting game mechanics',
    NOW() + INTERVAL '60 days',
    '550e8400-e29b-41d4-a716-446655440008',
    'punishment_ext_8',
    NULL,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '7 days'
  ),
  -- Lifted punishments (with lift reasons)
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
    'Appeal accepted - misunderstanding resolved',
    NULL,
    NOW() - INTERVAL '3 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440009',
    'ban',
    'temporary',
    'Account compromise',
    NOW() + INTERVAL '7 days',
    '550e8400-e29b-41d4-a716-446655440009',
    'punishment_ext_9',
    NULL,
    true,
    NULL,
    NOW() - INTERVAL '12 hours',
    'Account security restored - ban lifted',
    NULL,
    NOW() - INTERVAL '2 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440010',
    'mute',
    NULL,
    'Toxic behavior',
    NOW() + INTERVAL '14 days',
    '550e8400-e29b-41d4-a716-446655440010',
    NULL,
    NULL,
    true,
    NULL,
    NOW() - INTERVAL '6 hours',
    'Player demonstrated improved behavior',
    NULL,
    NOW() - INTERVAL '5 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440011',
    'ban',
    'permanent',
    'Severe rule violation',
    NULL,
    '550e8400-e29b-41d4-a716-446655440001',
    'punishment_ext_11',
    NULL,
    true,
    NULL,
    NOW() - INTERVAL '3 days',
    'Appeal accepted - case reviewed and overturned',
    NULL,
    NOW() - INTERVAL '20 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440012',
    'ban',
    'temporary',
    'Suspected botting',
    NOW() + INTERVAL '30 days',
    '550e8400-e29b-41d4-a716-446655440002',
    'punishment_ext_12',
    NULL,
    true,
    NULL,
    NOW() - INTERVAL '1 day',
    NULL, -- No reason provided
    NULL,
    NOW() - INTERVAL '8 days'
  )
ON CONFLICT DO NOTHING;

-- ==================== Seed Appeals ====================
INSERT INTO appeal (
  id,
  "playerId",
  "punishmentId",
  "submittedAt",
  status,
  description,
  "reviewedById"
)
VALUES
  -- Pending appeals
  (
    '880e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    NOW() - INTERVAL '2 days',
    'pending',
    'I was falsely accused of cheating. I have video evidence showing I was not using any mods.',
    NULL
  ),
  (
    '880e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440002',
    NOW() - INTERVAL '5 hours',
    'pending',
    'I understand I made a mistake. I have learned from this and would like a second chance.',
    NULL
  ),
  (
    '880e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440005',
    '660e8400-e29b-41d4-a716-446655440005',
    NOW() - INTERVAL '12 hours',
    'pending',
    'My account was compromised at the time of the violation. I have since secured my account.',
    NULL
  ),
  -- Accepted appeals
  (
    '880e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440003',
    '660e8400-e29b-41d4-a716-446655440003',
    NOW() - INTERVAL '1 day',
    'accepted',
    'I was muted for inappropriate language, but I was actually quoting a movie line. I apologize for the confusion.',
    NULL -- reviewedById - replace with actual user ID
  ),
  (
    '880e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440009',
    '660e8400-e29b-41d4-a716-446655440009',
    NOW() - INTERVAL '3 days',
    'accepted',
    'My account was hacked and the hacker was the one who violated the rules. I have proof of the security breach.',
    NULL
  ),
  -- Denied appeals
  (
    '880e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440002',
    NOW() - INTERVAL '8 days',
    'denied',
    'I think the ban was too harsh for what I did. I only did it once.',
    NULL -- reviewedById - replace with actual user ID
  ),
  (
    '880e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440010',
    '660e8400-e29b-41d4-a716-446655440010',
    NOW() - INTERVAL '6 days',
    'denied',
    'I was just joking around, I did not mean to be toxic.',
    NULL
  )
ON CONFLICT DO NOTHING;

-- ==================== Update Foreign Key References ====================
-- Update abuse reports to link to their corresponding punishments
-- (These were set to NULL initially to avoid circular dependency)
UPDATE abuse_report
SET "punishmentId" = '660e8400-e29b-41d4-a716-446655440001'
WHERE id = '770e8400-e29b-41d4-a716-446655440002';

UPDATE abuse_report
SET "punishmentId" = '660e8400-e29b-41d4-a716-446655440006'
WHERE id = '770e8400-e29b-41d4-a716-446655440006';
