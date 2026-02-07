-- Add new columns to attendance_sessions for better session organization
ALTER TABLE public.attendance_sessions
ADD COLUMN IF NOT EXISTS week integer,
ADD COLUMN IF NOT EXISTS section_num integer,
ADD COLUMN IF NOT EXISTS auto_close_duration_minutes integer DEFAULT 0;

-- Add comment to explain auto_close_duration_minutes
-- 0 means no auto-close, > 0 means close after this many minutes
COMMENT ON COLUMN public.attendance_sessions.auto_close_duration_minutes IS 'Minutes until session auto-closes. 0 = disabled, >0 = auto-close after this duration';
