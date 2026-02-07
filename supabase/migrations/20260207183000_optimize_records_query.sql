-- Add composite index for optimizing "Latest Check-ins" query
-- This allows Postgres to avoid a full sort when fetching latest records for a session
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_time_desc 
ON public.attendance_records(session_id, check_in_time DESC);
