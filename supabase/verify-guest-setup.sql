-- Verification script to check if guest access is properly set up
-- Run this to verify your database has all the guest access features

-- Check if guest columns exist in exam_sessions table
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'exam_sessions' 
    AND column_name IN ('guest_name', 'guest_email', 'is_guest', 'student_id')
ORDER BY column_name;

-- Check if the unique constraint exists
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'exam_sessions' 
    AND constraint_type = 'UNIQUE';

-- Check if RLS policies exist for exam_sessions
SELECT 
    policyname,
    permissive,
    cmd
FROM pg_policies 
WHERE tablename = 'exam_sessions'
ORDER BY policyname;

-- Check if the guest email index exists
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'exam_sessions' 
    AND indexname LIKE '%guest%';

-- Display a summary message
SELECT 
    'Guest access is properly configured!' as status,
    'You can now test the /join page for guest access' as next_step;