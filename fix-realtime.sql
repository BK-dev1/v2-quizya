-- Fix Supabase Real-Time for exam_sessions table
-- Run these commands in your Supabase SQL Editor

-- 1. Enable REPLICA IDENTITY FULL (required for UPDATE events to include changed data)
ALTER TABLE exam_sessions REPLICA IDENTITY FULL;

-- 2. Verify the table is in the realtime publication
-- Check current publication
SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';

-- If exam_sessions is not in the publication, add it:
-- ALTER PUBLICATION supabase_realtime ADD TABLE exam_sessions;

-- 3. Grant realtime permissions (if not already done)
GRANT SELECT ON exam_sessions TO anon;
GRANT SELECT ON exam_sessions TO authenticated;

-- 4. Verify RLS policies allow SELECT (required for real-time)
-- List current policies
SELECT * FROM pg_policies WHERE tablename = 'exam_sessions';

-- You should see policies that allow SELECT for your users
-- If not, you may need to add a policy like:
-- CREATE POLICY "Allow users to view their own sessions or if they are teachers"
--   ON exam_sessions FOR SELECT
--   USING (
--     auth.uid() = student_id OR
--     auth.uid() IN (SELECT teacher_id FROM exams WHERE id = exam_id)
--   );
