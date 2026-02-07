-- Create attendance_tokens table for database-backed token storage
-- This is necessary for serverless environments (Vercel) where in-memory storage is not persistent
CREATE TABLE IF NOT EXISTS public.attendance_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  token text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attendance_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.attendance_sessions(id) ON DELETE CASCADE
);

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_attendance_tokens_session_token ON public.attendance_tokens(session_id, token);
-- Index for cleanup of expired tokens
CREATE INDEX IF NOT EXISTS idx_attendance_tokens_expires_at ON public.attendance_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.attendance_tokens ENABLE ROW LEVEL SECURITY;

-- Only the API (service role) needs access to this table normally, 
-- but we can add a policy for the teacher to see tokens if needed.
-- For now, let's allow service role/admin access (default) or explicit policies.
CREATE POLICY "Service role can do everything on tokens"
  ON public.attendance_tokens
  FOR ALL
  USING (true);
