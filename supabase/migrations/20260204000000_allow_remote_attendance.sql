-- Add geofencing_enabled column to attendance_sessions
ALTER TABLE attendance_sessions ADD COLUMN IF NOT EXISTS geofencing_enabled BOOLEAN DEFAULT true;

-- Make coordinates nullable
ALTER TABLE attendance_sessions ALTER COLUMN teacher_latitude DROP NOT NULL;
ALTER TABLE attendance_sessions ALTER COLUMN teacher_longitude DROP NOT NULL;

-- Also update attendance_logs to allow nullable coordinates for remote marking
ALTER TABLE attendance_logs ALTER COLUMN student_latitude DROP NOT NULL;
ALTER TABLE attendance_logs ALTER COLUMN student_longitude DROP NOT NULL;
