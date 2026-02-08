-- Add composite index for efficient token retrieval by session and expiration
-- This supports the query: WHERE session_id = ? AND expires_at > ? ORDER BY expires_at
CREATE INDEX IF NOT EXISTS idx_attendance_tokens_session_expires 
ON public.attendance_tokens(session_id, expires_at DESC);
