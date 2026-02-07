-- Add global index on token for O(1) lookups during check-in
CREATE INDEX IF NOT EXISTS idx_attendance_tokens_token_global 
ON public.attendance_tokens(token);

-- Add index to speed up duplicate check-in validation (if not fully covered by constraint)
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_email
ON public.attendance_records(session_id, student_email);
