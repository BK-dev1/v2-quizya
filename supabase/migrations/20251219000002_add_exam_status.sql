-- Create exam_status type
CREATE TYPE exam_status AS ENUM ('upcoming', 'active', 'ended');

-- Add status column to exams table with default 'upcoming'
ALTER TABLE exams 
ADD COLUMN status exam_status NOT NULL DEFAULT 'upcoming';

-- Update existing exams to 'active' so current users aren't blocked
UPDATE exams SET status = 'active';

-- Create index for status
CREATE INDEX idx_exams_status ON exams(status);
