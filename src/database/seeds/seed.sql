-- Seed script for platform database
-- This script seeds all tables except the notes table
-- Note: Users should ideally be created through Better Auth, but we include sample users here for testing

-- Clear existing data (in reverse order of dependencies)
DELETE FROM appeal;
DELETE FROM punishment_reasons;
DELETE FROM punishment;
DELETE FROM abuse_report_reason;
DELETE FROM abuse_report;
DELETE FROM player;
-- Note: We don't delete users as they're managed by Better Auth

-- ==================== Seed Players ====================
INSERT INTO player (id, "externalId", "lastKnownUsername", game, "createdAt", "updatedAt")
VALUES
  ('550e8400-e29b-41d4-a716-446655440001', '80ff7272-5e2e-4d3f-8a41-56849ce87375', 'KraZ', 'hytale', NOW(), NOW()),
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
-- Note: reportReasons are now stored in abuse_report_reason junction table (many-to-many)
-- Note: actionTaken has been removed - it can be inferred from whether punishmentId is null or not
INSERT INTO abuse_report (
  id,
  "reportingPlayerId",
  "reportedPlayerId",
  description,
  status,
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
    'Player was repeatedly sending offensive messages in chat',
    'pending',
    NULL,
    '{"chatLogs": ["Message 1", "Message 2", "Message 3"]}'::jsonb,
    NOW() - INTERVAL '1 day'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440007',
    'Player destroyed my build without permission',
    'pending',
    NULL,
    '{"screenshots": ["screenshot1.png"], "location": "spawn area"}'::jsonb,
    NOW() - INTERVAL '3 hours'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440008',
    '550e8400-e29b-41d4-a716-446655440009',
    'Player promised items but never delivered',
    'pending',
    NULL,
    NULL,
    NOW() - INTERVAL '12 hours'
  ),
  -- Reviewed reports with punishment (punishmentId will be set after punishments are inserted)
  (
    '770e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440004',
    'Player was using unauthorized mods',
    'reviewed',
    NULL, -- Will be set to '660e8400-e29b-41d4-a716-446655440001' after punishments are inserted
    NULL,
    NOW() - INTERVAL '5 days'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440010',
    '550e8400-e29b-41d4-a716-446655440001',
    'Repeated toxic messages and personal attacks',
    'reviewed',
    NULL, -- Will be set to '660e8400-e29b-41d4-a716-446655440006' after punishments are inserted
    '{"chatLogs": ["toxic message 1", "toxic message 2"]}'::jsonb,
    NOW() - INTERVAL '4 days'
  ),
  -- Reviewed reports without punishment (punishmentId is NULL)
  (
    '770e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440001',
    'Player was destroying other players builds',
    'reviewed',
    NULL,
    NULL,
    NOW() - INTERVAL '3 days'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    'False report - player was not cheating',
    'reviewed',
    NULL,
    NULL,
    NOW() - INTERVAL '6 days'
  )
ON CONFLICT DO NOTHING;

-- ==================== Seed Abuse Report Reasons (Junction Table) ====================
-- Note: Report reasons are now stored in a many-to-many relationship
-- Multiple reasons can be associated with a single abuse report
INSERT INTO abuse_report_reason ("abuseReportId", "reportReason")
VALUES
  -- Report 1: Harassment
  ('770e8400-e29b-41d4-a716-446655440001', 'HARASSMENT_BULLYING_OR_TARGETTED_ABUSE'),
  -- Report 2: Cheating
  ('770e8400-e29b-41d4-a716-446655440002', 'CHEATING'),
  -- Report 3: Bug abuse
  ('770e8400-e29b-41d4-a716-446655440003', 'BUG_ABUSE'),
  -- Report 4: Bug abuse (different report)
  ('770e8400-e29b-41d4-a716-446655440004', 'BUG_ABUSE'),
  -- Report 5: Scamming
  ('770e8400-e29b-41d4-a716-446655440005', 'SCAMMING'),
  -- Report 6: Harassment and chat spamming (multiple reasons)
  ('770e8400-e29b-41d4-a716-446655440006', 'HARASSMENT_BULLYING_OR_TARGETTED_ABUSE'),
  ('770e8400-e29b-41d4-a716-446655440006', 'CHAT_SPAMMING'),
  -- Report 7: Cheating
  ('770e8400-e29b-41d4-a716-446655440007', 'CHEATING')
ON CONFLICT DO NOTHING;

-- ==================== Seed Punishments ====================
-- Note: banType has been removed (temporary/permanent is inferred from expiry)
-- Note: reason has been moved to punishment_reasons junction table
-- Note: liftReason now uses enum values (LIFT_REASONS)
-- Note: liftNoteId and punishmentNoteId are added for note references
INSERT INTO punishment (
  id,
  "shortCodeId",
  "punishmentType",
  expiry,
  "playerId",
  "externalId",
  "issuedById",
  lifted,
  "liftedById",
  "liftedAt",
  "liftReason",
  "liftNoteId",
  "punishmentNoteId",
  "relatedAbuseReportId",
  "createdAt"
)
VALUES
  -- Active punishments (not lifted)
  (
    '660e8400-e29b-41d4-a716-446655440001',
    'AbC123Xy',
    'ban',
    NOW() + INTERVAL '30 days',
    '550e8400-e29b-41d4-a716-446655440001',
    'punishment_ext_1',
    NULL, -- issuedById - replace with actual user ID
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    '770e8400-e29b-41d4-a716-446655440002',
    NOW() - INTERVAL '5 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    'DeF456Gh',
    'ban',
    NULL, -- Permanent ban (no expiry)
    '550e8400-e29b-41d4-a716-446655440002',
    'punishment_ext_2',
    NULL, -- issuedById - replace with actual user ID
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '10 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    'HiJ789Kl',
    'mute',
    NOW() + INTERVAL '7 days',
    '550e8400-e29b-41d4-a716-446655440003',
    'punishment_ext_3',
    NULL, -- issuedById - replace with actual user ID
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '2 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440005',
    'MnO012Pq',
    'ban',
    NOW() + INTERVAL '14 days',
    '550e8400-e29b-41d4-a716-446655440005',
    'punishment_ext_5',
    NULL, -- issuedById - replace with actual user ID
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '1 day'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440006',
    'RsT345Uv',
    'mute',
    NOW() + INTERVAL '3 days',
    '550e8400-e29b-41d4-a716-446655440006',
    NULL,
    NULL,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '4 hours'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440007',
    'WxY678Za',
    'kick',
    NULL,
    '550e8400-e29b-41d4-a716-446655440007',
    NULL,
    NULL,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '2 hours'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440008',
    'BcD901Ef',
    'ban',
    NOW() + INTERVAL '60 days',
    '550e8400-e29b-41d4-a716-446655440008',
    'punishment_ext_8',
    NULL,
    false,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '7 days'
  ),
  -- Lifted punishments (with lift reasons using enum values)
  (
    '660e8400-e29b-41d4-a716-446655440004',
    'GhI234Jk',
    'kick',
    NULL,
    '550e8400-e29b-41d4-a716-446655440004',
    NULL,
    NULL, -- issuedById - replace with actual user ID
    true,
    NULL, -- liftedById - replace with actual user ID
    NOW() - INTERVAL '1 day',
    'APPEAL_ACCEPTED',
    NULL, -- liftNoteId - would reference a note if one was created
    NULL,
    NULL,
    NOW() - INTERVAL '3 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440009',
    'LmN567Op',
    'ban',
    NOW() + INTERVAL '7 days',
    '550e8400-e29b-41d4-a716-446655440009',
    'punishment_ext_9',
    NULL,
    true,
    NULL,
    NOW() - INTERVAL '12 hours',
    'ACCOUNT_COMPROMISED',
    NULL, -- liftNoteId - would reference a note if one was created
    NULL,
    NULL,
    NOW() - INTERVAL '2 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440010',
    'QrS890Tu',
    'mute',
    NOW() + INTERVAL '14 days',
    '550e8400-e29b-41d4-a716-446655440010',
    NULL,
    NULL,
    true,
    NULL,
    NOW() - INTERVAL '6 hours',
    'ACKNOWLEDGED_REFORMED',
    NULL, -- liftNoteId - would reference a note if one was created
    NULL,
    NULL,
    NOW() - INTERVAL '5 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440011',
    'VwX123Yz',
    'ban',
    NULL, -- Permanent ban (no expiry)
    '550e8400-e29b-41d4-a716-446655440001',
    'punishment_ext_11',
    NULL,
    true,
    NULL,
    NOW() - INTERVAL '3 days',
    'APPEAL_ACCEPTED',
    NULL, -- liftNoteId - would reference a note if one was created
    NULL,
    NULL,
    NOW() - INTERVAL '20 days'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440012',
    'AaB456Cc',
    'ban',
    NOW() + INTERVAL '30 days',
    '550e8400-e29b-41d4-a716-446655440002',
    'punishment_ext_12',
    NULL,
    true,
    NULL,
    NOW() - INTERVAL '1 day',
    NULL, -- No reason provided
    NULL,
    NULL,
    NULL,
    NOW() - INTERVAL '8 days'
  )
ON CONFLICT DO NOTHING;

-- ==================== Seed Punishment Reasons (Junction Table) ====================
-- Note: Punishment reasons are now stored in a many-to-many relationship
-- Multiple reasons can be associated with a single punishment
INSERT INTO punishment_reasons ("punishmentId", "punishmentReason")
VALUES
  -- Punishment 1: Cheating (from abuse report, so includes ABUSE_REPORT_ACCEPTED)
  ('660e8400-e29b-41d4-a716-446655440001', 'CHEATING'),
  ('660e8400-e29b-41d4-a716-446655440001', 'ABUSE_REPORT_ACCEPTED'),
  -- Punishment 2: Multiple violations
  ('660e8400-e29b-41d4-a716-446655440002', 'HARASSMENT_BULLYING_OR_TARGETTED_ABUSE'),
  ('660e8400-e29b-41d4-a716-446655440002', 'HATE_SPEECH_SLURS_OR_BAD_LANGUAGE'),
  -- Punishment 3: Inappropriate language
  ('660e8400-e29b-41d4-a716-446655440003', 'HATE_SPEECH_SLURS_OR_BAD_LANGUAGE'),
  -- Punishment 5: Suspicious activity
  ('660e8400-e29b-41d4-a716-446655440005', 'CHEATING'),
  -- Punishment 6: Spamming (from abuse report, so includes ABUSE_REPORT_ACCEPTED)
  ('660e8400-e29b-41d4-a716-446655440006', 'CHAT_SPAMMING'),
  ('660e8400-e29b-41d4-a716-446655440006', 'ABUSE_REPORT_ACCEPTED'),
  -- Punishment 7: AFK timeout (no specific reason, could use OTHER)
  ('660e8400-e29b-41d4-a716-446655440007', 'OTHER'),
  -- Punishment 8: Bug abuse
  ('660e8400-e29b-41d4-a716-446655440008', 'BUG_ABUSE'),
  -- Punishment 4: Disruptive behavior (lifted)
  ('660e8400-e29b-41d4-a716-446655440004', 'HARASSMENT_BULLYING_OR_TARGETTED_ABUSE'),
  -- Punishment 9: Account compromise (lifted)
  ('660e8400-e29b-41d4-a716-446655440009', 'ACCOUNT_SHARING'),
  -- Punishment 10: Toxic behavior (lifted)
  ('660e8400-e29b-41d4-a716-446655440010', 'HARASSMENT_BULLYING_OR_TARGETTED_ABUSE'),
  -- Punishment 11: Severe rule violation (lifted)
  ('660e8400-e29b-41d4-a716-446655440011', 'CHEATING'),
  -- Punishment 12: Suspected botting (lifted)
  ('660e8400-e29b-41d4-a716-446655440012', 'CHEATING')
ON CONFLICT DO NOTHING;

-- ==================== Seed Appeals ====================
-- Note: acceptanceReason and rejectionReason have been added
-- acceptanceReason is set when status is 'accepted'
-- rejectionReason is set when status is 'denied'
INSERT INTO appeal (
  id,
  "playerId",
  "punishmentId",
  "submittedAt",
  status,
  description,
  "reviewedById",
  "acceptanceReason",
  "rejectionReason"
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
    NULL,
    NULL,
    NULL
  ),
  (
    '880e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440002',
    NOW() - INTERVAL '5 hours',
    'pending',
    'I understand I made a mistake. I have learned from this and would like a second chance.',
    NULL,
    NULL,
    NULL
  ),
  (
    '880e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440005',
    '660e8400-e29b-41d4-a716-446655440005',
    NOW() - INTERVAL '12 hours',
    'pending',
    'My account was compromised at the time of the violation. I have since secured my account.',
    NULL,
    NULL,
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
    NULL, -- reviewedById - replace with actual user ID
    'MISIDENTIFICATION',
    NULL
  ),
  (
    '880e8400-e29b-41d4-a716-446655440006',
    '550e8400-e29b-41d4-a716-446655440009',
    '660e8400-e29b-41d4-a716-446655440009',
    NOW() - INTERVAL '3 days',
    'accepted',
    'My account was hacked and the hacker was the one who violated the rules. I have proof of the security breach.',
    NULL,
    'PROVIDES_PROOF_THAT_CONTRADICTS_PUNISHMENT',
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
    NULL, -- reviewedById - replace with actual user ID
    NULL,
    'STRONG_EVIDENCE'
  ),
  (
    '880e8400-e29b-41d4-a716-446655440007',
    '550e8400-e29b-41d4-a716-446655440010',
    '660e8400-e29b-41d4-a716-446655440010',
    NOW() - INTERVAL '6 days',
    'denied',
    'I was just joking around, I did not mean to be toxic.',
    NULL,
    NULL,
    'LOW_EFFORT_APPEAL'
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
