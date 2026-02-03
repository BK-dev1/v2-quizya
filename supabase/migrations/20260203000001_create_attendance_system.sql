-- ==========================================
-- ATTENDANCE SYSTEM MIGRATION
-- Hard-to-Break Attendance with Multi-Layered Security
-- ==========================================

-- 1. Create attendance_sessions table (for Teacher QR generation metadata)
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    teacher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    session_name TEXT NOT NULL,
    session_code TEXT UNIQUE NOT NULL,
    totp_secret TEXT NOT NULL,
    teacher_latitude DECIMAL(10, 8) NOT NULL,
    teacher_longitude DECIMAL(11, 8) NOT NULL,
    geofence_radius_meters INTEGER DEFAULT 50,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create device_registry table (for device fingerprinting)
CREATE TABLE IF NOT EXISTS device_registry (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    device_fingerprint TEXT UNIQUE NOT NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    user_agent TEXT,
    first_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create attendance_logs table (for storing attendance records)
CREATE TABLE IF NOT EXISTS attendance_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    device_fingerprint TEXT NOT NULL,
    student_latitude DECIMAL(10, 8) NOT NULL,
    student_longitude DECIMAL(11, 8) NOT NULL,
    distance_meters DECIMAL(8, 2),
    totp_code TEXT NOT NULL,
    marked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_session_student UNIQUE(session_id, student_id)
);

-- 4. Create geofence_validations table (for audit trail)
CREATE TABLE IF NOT EXISTS geofence_validations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attendance_log_id UUID REFERENCES attendance_logs(id) ON DELETE CASCADE,
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE NOT NULL,
    student_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    is_valid BOOLEAN NOT NULL,
    distance_meters DECIMAL(8, 2),
    validation_reason TEXT,
    validated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- Indexes for Performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher ON attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_code ON attendance_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_active ON attendance_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_device_registry_fingerprint ON device_registry(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_device_registry_user ON device_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_session ON attendance_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_student ON attendance_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_geofence_validations_session ON geofence_validations(session_id);

-- ==========================================
-- Row Level Security (RLS)
-- ==========================================
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_registry ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_validations ENABLE ROW LEVEL SECURITY;

-- Attendance Sessions Policies
-- Teachers can create and manage their own sessions
CREATE POLICY "Teachers can view their own attendance sessions"
    ON attendance_sessions FOR SELECT
    USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can create attendance sessions"
    ON attendance_sessions FOR INSERT
    WITH CHECK (
        teacher_id = auth.uid() AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'teacher')
    );

CREATE POLICY "Teachers can update their own attendance sessions"
    ON attendance_sessions FOR UPDATE
    USING (teacher_id = auth.uid());

CREATE POLICY "Teachers can delete their own attendance sessions"
    ON attendance_sessions FOR DELETE
    USING (teacher_id = auth.uid());

-- Students can view active sessions (for validation)
CREATE POLICY "Students can view active attendance sessions"
    ON attendance_sessions FOR SELECT
    USING (
        is_active = true AND 
        expires_at > NOW() AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

-- Device Registry Policies
CREATE POLICY "Users can view their own device records"
    ON device_registry FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert device records"
    ON device_registry FOR INSERT
    WITH CHECK (true); -- Allow all authenticated users to register devices

CREATE POLICY "Users can update their own device records"
    ON device_registry FOR UPDATE
    USING (user_id = auth.uid());

-- Attendance Logs Policies
CREATE POLICY "Students can view their own attendance logs"
    ON attendance_logs FOR SELECT
    USING (student_id = auth.uid());

CREATE POLICY "Teachers can view attendance logs for their sessions"
    ON attendance_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM attendance_sessions 
            WHERE attendance_sessions.id = attendance_logs.session_id 
            AND attendance_sessions.teacher_id = auth.uid()
        )
    );

CREATE POLICY "Students can mark their own attendance"
    ON attendance_logs FOR INSERT
    WITH CHECK (
        student_id = auth.uid() AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'student')
    );

-- Geofence Validations Policies
CREATE POLICY "Students can view their own geofence validations"
    ON geofence_validations FOR SELECT
    USING (student_id = auth.uid());

CREATE POLICY "Teachers can view geofence validations for their sessions"
    ON geofence_validations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM attendance_sessions 
            WHERE attendance_sessions.id = geofence_validations.session_id 
            AND attendance_sessions.teacher_id = auth.uid()
        )
    );

CREATE POLICY "System can insert geofence validations"
    ON geofence_validations FOR INSERT
    WITH CHECK (true);

-- ==========================================
-- Triggers for updated_at
-- ==========================================
CREATE TRIGGER update_attendance_sessions_updated_at 
    BEFORE UPDATE ON attendance_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
