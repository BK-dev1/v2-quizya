-- Fix Supabase linter security warnings
-- 1. Create device_registry table (anti-fraud device tracking)
-- 2. Function Search Path Mutable (4 functions)
-- 3. RLS Policy Always True (4 policies)

-- ==========================================
-- 1. Create device_registry table
-- ==========================================
-- Tracks device fingerprints to prevent the same device from checking in
-- multiple times per attendance session (anti-fraud measure).
CREATE TABLE IF NOT EXISTS public.device_registry (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  device_fingerprint text NOT NULL,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT device_registry_pkey PRIMARY KEY (id),
  CONSTRAINT device_registry_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  -- One device fingerprint per session
  CONSTRAINT device_registry_unique_device UNIQUE (session_id, device_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_device_registry_session_id ON public.device_registry(session_id);
CREATE INDEX IF NOT EXISTS idx_device_registry_fingerprint ON public.device_registry(session_id, device_fingerprint);

ALTER TABLE public.device_registry ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- 2. Fix function search_path for all flagged functions
-- ==========================================

-- Fix handle_user_email_update: add SET search_path = ''
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email,
      updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Fix update_updated_at_column: add SET search_path = ''
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix generate_room_code: add SET search_path = ''
CREATE OR REPLACE FUNCTION public.generate_room_code(length INTEGER DEFAULT 6)
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..length LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- Fix update_attendance_sessions_updated_at: add SET search_path = ''
CREATE OR REPLACE FUNCTION public.update_attendance_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

-- ==========================================
-- 2. Fix RLS policies that are always true
-- ==========================================

-- 2a. Tighten attendance_records INSERT policy
-- Old: WITH CHECK (true) - allows anyone to insert any record
-- New: requires the session to exist and be active
DROP POLICY IF EXISTS "Anyone can create attendance records" ON public.attendance_records;
CREATE POLICY "Anyone can create attendance records"
  ON public.attendance_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE id = attendance_records.session_id
      AND is_active = true
    )
  );

-- 2b. Fix attendance_tokens: replace overly permissive ALL policy with scoped policies
-- The service role already bypasses RLS, so the ALL/USING(true) policy was redundant
-- for its original purpose and grants access to ALL roles including anon.
DROP POLICY IF EXISTS "Service role can do everything on tokens" ON public.attendance_tokens;

-- SELECT: needed for unauthenticated token verification during check-in
CREATE POLICY "Anyone can verify tokens"
  ON public.attendance_tokens
  FOR SELECT
  USING (true);

-- INSERT: only the teacher who owns the session can create tokens
CREATE POLICY "Teachers can create tokens for their sessions"
  ON public.attendance_tokens
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE id = attendance_tokens.session_id
      AND teacher_id = auth.uid()
    )
  );

-- DELETE: only the teacher who owns the session can delete tokens
CREATE POLICY "Teachers can delete tokens for their sessions"
  ON public.attendance_tokens
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE id = attendance_tokens.session_id
      AND teacher_id = auth.uid()
    )
  );

-- 3c. device_registry RLS policies
-- INSERT: only allow inserts referencing an active session
DROP POLICY IF EXISTS "Users can insert device records" ON public.device_registry;
CREATE POLICY "Users can insert device records"
  ON public.device_registry
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE id = device_registry.session_id
      AND is_active = true
    )
  );

-- SELECT: teachers can view device records for their sessions
CREATE POLICY "Teachers can view device records for their sessions"
  ON public.device_registry
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE id = device_registry.session_id
      AND teacher_id = auth.uid()
    )
  );

-- 2d. Fix geofence_validations INSERT policy
-- Old: WITH CHECK (true)
-- New: require the referenced session to exist and be active
DROP POLICY IF EXISTS "System can insert geofence validations" ON public.geofence_validations;
CREATE POLICY "System can insert geofence validations"
  ON public.geofence_validations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.attendance_sessions
      WHERE id = geofence_validations.session_id
      AND is_active = true
    )
  );
