-- Migration: add answer_type to mock_attempts
-- Safe to run more than once (MySQL 8.0 compatible — MySQL does not support
-- "ADD COLUMN IF NOT EXISTS", so we check information_schema instead).
-- Note: the server also applies this automatically on startup (db/connection.js).

USE student_academic_manager;

SET @col_exists := (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'mock_attempts' AND COLUMN_NAME = 'answer_type'
);

SET @sql := IF(@col_exists = 0,
  "ALTER TABLE mock_attempts ADD COLUMN answer_type ENUM('typed', 'handwritten') NOT NULL DEFAULT 'typed' AFTER status",
  'SELECT ''answer_type already exists'' AS info');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
