-- Seed script for platform database
-- Note: Users should ideally be created through Better Auth, but we include sample users here for testing

-- ==================== Seed Users (for testing purposes) ====================
-- Note: In production, users should be created through Better Auth API
-- These are minimal test users created for seeding purposes only
-- WARNING: These users may conflict with Better Auth if you try to use them for authentication
INSERT INTO "user" (id, email, "emailVerified", name, role, "createdAt", "updatedAt")
VALUES
  ('user_id_1', 'test_user_1@example.com', true, 'Test User 1', 'user', NOW(), NOW()),
  ('user_id_2', 'test_user_2@example.com', true, 'Test User 2', 'user', NOW(), NOW()),
  ('user_id_3', 'test_user_3@example.com', true, 'Test User 3', 'user', NOW(), NOW()),
  ('user_id_4', 'test_user_4@example.com', true, 'Test User 4', 'user', NOW(), NOW()),
  ('user_id_5', 'test_user_5@example.com', true, 'Test User 5', 'user', NOW(), NOW()),
  ('user_id_6', 'test_user_6@example.com', true, 'Test User 6', 'user', NOW(), NOW()),
  ('user_id_7', 'test_user_7@example.com', true, 'Test User 7', 'user', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
