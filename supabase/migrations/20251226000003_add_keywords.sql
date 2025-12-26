-- Migration to add keywords to questions

ALTER TABLE questions ADD COLUMN IF NOT EXISTS keywords TEXT[];

-- Update existing question bank as well for consistency
ALTER TABLE question_bank ADD COLUMN IF NOT EXISTS keywords TEXT[];
