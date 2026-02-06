-- Create attendance_sessions table
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  teacher_id uuid NOT NULL,
  module_name text,
  section_group text,
  location_lat numeric(10, 8),
  location_lng numeric(11, 8),
  max_distance_meters integer DEFAULT 50,
  qr_refresh_interval integer DEFAULT 20,
  is_active boolean DEFAULT true,
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attendance_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_sessions_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  student_name text NOT NULL,
  student_email text,
  check_in_time timestamp with time zone DEFAULT now(),
  location_lat numeric(10, 8),
  location_lng numeric(11, 8),
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attendance_records_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_records_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  -- Prevent duplicate check-ins: same student name + email in the same session
  CONSTRAINT attendance_records_unique_checkin UNIQUE (session_id, student_name, student_email)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_teacher_id ON public.attendance_sessions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_is_active ON public.attendance_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_check_in_time ON public.attendance_records(check_in_time);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_attendance_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER attendance_sessions_updated_at
  BEFORE UPDATE ON public.attendance_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_sessions_updated_at();

-- Enable Row Level Security
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for attendance_sessions
-- Teachers can view, create, update, and delete their own sessions
CREATE POLICY "Teachers can view their own attendance sessions"
  ON public.attendance_sessions
  FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can create attendance sessions"
  ON public.attendance_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own attendance sessions"
  ON public.attendance_sessions
  FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own attendance sessions"
  ON public.attendance_sessions
  FOR DELETE
  USING (auth.uid() = teacher_id);

-- RLS Policies for attendance_records
-- Teachers can view records for their sessions
CREATE POLICY "Teachers can view attendance records for their sessions"
  ON public.attendance_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE id = attendance_records.session_id
      AND teacher_id = auth.uid()
    )
  );

-- Allow anyone to insert attendance records (for non-authenticated students)
-- SECURITY NOTE: This open policy is necessary for guest check-ins but relies on:
-- 1. Token validation in the API layer (QR codes expire after 20s)
-- 2. Rate limiting to prevent spam
-- 3. Duplicate check constraint in the database
-- 4. Optional location verification
CREATE POLICY "Anyone can create attendance records"
  ON public.attendance_records
  FOR INSERT
  WITH CHECK (true);

-- Teachers can delete records from their sessions
CREATE POLICY "Teachers can delete attendance records from their sessions"
  ON public.attendance_records
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE id = attendance_records.session_id
      AND teacher_id = auth.uid()
    )
  );
