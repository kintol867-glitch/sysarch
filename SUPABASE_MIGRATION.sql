-- ============================================
-- Run this in your Supabase SQL Editor
-- Adds total_sessions and total_hours columns
-- ============================================

ALTER TABLE students ADD COLUMN IF NOT EXISTS total_sessions INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS total_hours NUMERIC(10,2) DEFAULT 0;

-- Set sample data so leaderboard shows real numbers right away
UPDATE students SET total_sessions = 12, total_hours = 14.5  WHERE id_number = '2024-001';
UPDATE students SET total_sessions = 8,  total_hours = 9.0   WHERE id_number = '2024-002';
UPDATE students SET total_sessions = 15, total_hours = 18.0  WHERE id_number = '2024-003';
UPDATE students SET total_sessions = 5,  total_hours = 6.5   WHERE id_number = '2024-004';
UPDATE students SET total_sessions = 20, total_hours = 24.0  WHERE id_number = '2024-005';
UPDATE students SET total_sessions = 10, total_hours = 12.0  WHERE id_number = '2024-006';
UPDATE students SET total_sessions = 18, total_hours = 21.5  WHERE id_number = '2024-007';
UPDATE students SET total_sessions = 3,  total_hours = 3.5   WHERE id_number = '2024-008';
UPDATE students SET total_sessions = 25, total_hours = 30.0  WHERE id_number = '2024-009';
UPDATE students SET total_sessions = 7,  total_hours = 8.0   WHERE id_number = '2024-010';
UPDATE students SET total_sessions = 22, total_hours = 26.5  WHERE id_number = '2024-011';
UPDATE students SET total_sessions = 6,  total_hours = 7.0   WHERE id_number = '2024-012';
UPDATE students SET total_sessions = 14, total_hours = 16.5  WHERE id_number = '2024-013';
UPDATE students SET total_sessions = 9,  total_hours = 10.5  WHERE id_number = '2024-014';
UPDATE students SET total_sessions = 11, total_hours = 13.0  WHERE id_number = '2024-015';
