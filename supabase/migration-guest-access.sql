-- Migration to add guest access support to exam_sessions table
-- Run this in your Supabase SQL Editor ONLY if you ran the original schema WITHOUT guest support

-- Check if guest columns already exist, if not add them
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'exam_sessions' AND column_name = 'guest_name') THEN
        ALTER TABLE exam_sessions ADD COLUMN guest_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'exam_sessions' AND column_name = 'guest_email') THEN
        ALTER TABLE exam_sessions ADD COLUMN guest_email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'exam_sessions' AND column_name = 'is_guest') THEN
        ALTER TABLE exam_sessions ADD COLUMN is_guest BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Make student_id nullable for guest sessions (only if it's not already nullable)
DO $$
BEGIN
    -- Check if student_id is currently NOT NULL and make it nullable
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'exam_sessions' 
        AND column_name = 'student_id' 
        AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE exam_sessions ALTER COLUMN student_id DROP NOT NULL;
    END IF;
END $$;

-- Drop the existing unique constraint if it exists
ALTER TABLE exam_sessions 
DROP CONSTRAINT IF EXISTS exam_sessions_exam_id_student_id_key;

-- Add new unique constraint that handles both registered users and guests (only if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_exam_participant'
    ) THEN
        ALTER TABLE exam_sessions 
        ADD CONSTRAINT unique_exam_participant 
        UNIQUE(exam_id, student_id, guest_email);
    END IF;
END $$;

-- Update RLS policies for guest access
DROP POLICY IF EXISTS "Users can view their own exam sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Students can create their own exam sessions" ON exam_sessions;
DROP POLICY IF EXISTS "Students can update their own exam sessions" ON exam_sessions;

-- New RLS policies that support guest access
CREATE POLICY "Users can view their own exam sessions" ON exam_sessions
    FOR SELECT USING (
        student_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM exams 
            WHERE exams.id = exam_sessions.exam_id 
            AND exams.created_by = auth.uid()
        )
    );

CREATE POLICY "Students and guests can create exam sessions" ON exam_sessions
    FOR INSERT WITH CHECK (
        (student_id = auth.uid() AND NOT is_guest) OR 
        (is_guest = true AND guest_name IS NOT NULL AND guest_email IS NOT NULL)
    );

CREATE POLICY "Students and guests can update their own exam sessions" ON exam_sessions
    FOR UPDATE USING (
        (student_id = auth.uid() AND NOT is_guest) OR
        (is_guest = true)
    );

-- Add index for guest email lookups
CREATE INDEX IF NOT EXISTS idx_exam_sessions_guest_email ON exam_sessions(guest_email) WHERE is_guest = true;