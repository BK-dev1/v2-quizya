-- Add missing columns to attendance_sessions
-- These were supposed to be added by 20260207000002_add_attendance_fields.sql
-- but that migration version collided with another migration
ALTER TABLE public.attendance_sessions
ADD COLUMN IF NOT EXISTS week integer,
ADD COLUMN IF NOT EXISTS section_num integer,
ADD COLUMN IF NOT EXISTS auto_close_duration_minutes integer DEFAULT 0;

COMMENT ON COLUMN public.attendance_sessions.auto_close_duration_minutes IS 'Minutes until session auto-closes. 0 = disabled, >0 = auto-close after this duration';
