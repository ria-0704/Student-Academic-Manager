-- Migration: add answer_type to mock_attempts
-- Run once against student_academic_manager database.
-- The DEFAULT 'typed' means all existing rows are automatically set to 'typed'
-- and nothing breaks if this column is not sent by old clients.

USE student_academic_manager;

ALTER TABLE mock_attempts
  ADD COLUMN IF NOT EXISTS answer_type ENUM('typed', 'handwritten') NOT NULL DEFAULT 'typed'
  AFTER status;