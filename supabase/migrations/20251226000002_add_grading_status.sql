-- Migration to add grading_status to exam_sessions

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'grading_status') THEN
        CREATE TYPE grading_status AS ENUM ('pending', 'graded', 'not_required');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS grading_status grading_status DEFAULT 'not_required';

-- Update existing sessions
UPDATE exam_sessions 
SET grading_status = 'graded' 
WHERE status = 'completed';
