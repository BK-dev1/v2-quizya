-- Create exam_status type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'exam_status'
  ) THEN
    CREATE TYPE exam_status AS ENUM ('upcoming', 'active', 'ended');
  END IF;
END $$;

-- Add status column to exams table with default 'upcoming'
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'exams'
      AND column_name = 'status'
  ) THEN
    ALTER TABLE exams
    ADD COLUMN status exam_status NOT NULL DEFAULT 'upcoming';
  END IF;
END $$;


-- Update existing exams to 'active' so current users aren't blocked
UPDATE exams SET status = 'active';

-- Create index for status
CREATE INDEX IF NOT EXISTS idx_exams_status
ON exams(status);
