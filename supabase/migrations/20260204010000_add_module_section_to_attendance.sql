-- Add module and section support to attendance sessions
ALTER TABLE attendance_sessions 
ADD COLUMN IF NOT EXISTS module_name TEXT,
ADD COLUMN IF NOT EXISTS section_name TEXT;

-- Create indexes for faster filtering
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_module ON attendance_sessions(module_name);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_section ON attendance_sessions(section_name);
