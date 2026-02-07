-- Live Quiz System Migration
-- This creates the tables needed for in-lecture live quizzes

-- Enum for live quiz status
CREATE TYPE live_quiz_status AS ENUM ('waiting', 'active', 'paused', 'showing_results', 'ended');

-- Enum for question display state
CREATE TYPE question_state AS ENUM ('hidden', 'active', 'closed', 'showing_answer');

-- Main live quiz table
CREATE TABLE public.live_quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  quiz_code text NOT NULL UNIQUE,
  status live_quiz_status NOT NULL DEFAULT 'waiting',
  current_question_index integer DEFAULT -1,
  show_results_to_students boolean DEFAULT false,
  created_by uuid NOT NULL,
  started_at timestamp with time zone,
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT live_quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT live_quizzes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Live quiz questions - supports multiple correct answers and variable options
CREATE TABLE public.live_quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  question_text text NOT NULL,
  options jsonb NOT NULL, -- Array of {id: string, text: string}
  correct_options jsonb NOT NULL, -- Array of option IDs that are correct
  time_limit_seconds integer NOT NULL DEFAULT 30, -- Time limit for this question
  points integer NOT NULL DEFAULT 1,
  order_index integer NOT NULL,
  state question_state NOT NULL DEFAULT 'hidden',
  started_at timestamp with time zone, -- When this question became active
  ended_at timestamp with time zone, -- When time ran out for this question
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT live_quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT live_quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.live_quizzes(id) ON DELETE CASCADE
);

-- Participants who joined the quiz
CREATE TABLE public.live_quiz_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  participant_name text NOT NULL,
  participant_email text,
  user_id uuid, -- Optional: if they are logged in users
  display_position jsonb, -- {x: number, y: number} for random display on teacher screen
  total_score integer DEFAULT 0,
  total_correct integer DEFAULT 0,
  joined_at timestamp with time zone DEFAULT now(),
  last_seen_at timestamp with time zone DEFAULT now(),
  CONSTRAINT live_quiz_participants_pkey PRIMARY KEY (id),
  CONSTRAINT live_quiz_participants_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.live_quizzes(id) ON DELETE CASCADE,
  CONSTRAINT live_quiz_participants_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Responses to each question
CREATE TABLE public.live_quiz_responses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  question_id uuid NOT NULL,
  participant_id uuid NOT NULL,
  selected_options jsonb NOT NULL, -- Array of selected option IDs
  is_correct boolean NOT NULL DEFAULT false,
  points_earned integer NOT NULL DEFAULT 0,
  answered_at timestamp with time zone DEFAULT now(),
  response_time_ms integer, -- How fast they answered
  CONSTRAINT live_quiz_responses_pkey PRIMARY KEY (id),
  CONSTRAINT live_quiz_responses_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.live_quizzes(id) ON DELETE CASCADE,
  CONSTRAINT live_quiz_responses_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.live_quiz_questions(id) ON DELETE CASCADE,
  CONSTRAINT live_quiz_responses_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES public.live_quiz_participants(id) ON DELETE CASCADE,
  CONSTRAINT live_quiz_responses_unique UNIQUE (question_id, participant_id)
);

-- Create indexes for performance
CREATE INDEX idx_live_quizzes_quiz_code ON public.live_quizzes(quiz_code);
CREATE INDEX idx_live_quizzes_created_by ON public.live_quizzes(created_by);
CREATE INDEX idx_live_quizzes_status ON public.live_quizzes(status);
CREATE INDEX idx_live_quiz_questions_quiz_id ON public.live_quiz_questions(quiz_id);
CREATE INDEX idx_live_quiz_participants_quiz_id ON public.live_quiz_participants(quiz_id);
CREATE INDEX idx_live_quiz_responses_quiz_id ON public.live_quiz_responses(quiz_id);
CREATE INDEX idx_live_quiz_responses_question_id ON public.live_quiz_responses(question_id);
CREATE INDEX idx_live_quiz_responses_participant_id ON public.live_quiz_responses(participant_id);

-- Enable RLS
ALTER TABLE public.live_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_quiz_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.live_quiz_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for live_quizzes
CREATE POLICY "Teachers can create live quizzes" ON public.live_quizzes
  FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Teachers can view their own live quizzes" ON public.live_quizzes
  FOR SELECT TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Teachers can update their own live quizzes" ON public.live_quizzes
  FOR UPDATE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Teachers can delete their own live quizzes" ON public.live_quizzes
  FOR DELETE TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Anyone can view active quizzes by code" ON public.live_quizzes
  FOR SELECT TO anon, authenticated
  USING (status IN ('waiting', 'active', 'paused', 'showing_results'));

-- RLS Policies for live_quiz_questions
CREATE POLICY "Quiz owners can manage questions" ON public.live_quiz_questions
  FOR ALL TO authenticated
  USING (
    quiz_id IN (SELECT id FROM public.live_quizzes WHERE created_by = auth.uid())
  );

CREATE POLICY "Participants can view active questions" ON public.live_quiz_questions
  FOR SELECT TO anon, authenticated
  USING (state IN ('active', 'closed', 'showing_answer'));

-- RLS Policies for live_quiz_participants
CREATE POLICY "Anyone can join quizzes" ON public.live_quiz_participants
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Participants can view quiz participants" ON public.live_quiz_participants
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Quiz owners can manage participants" ON public.live_quiz_participants
  FOR ALL TO authenticated
  USING (
    quiz_id IN (SELECT id FROM public.live_quizzes WHERE created_by = auth.uid())
  );

-- RLS Policies for live_quiz_responses
CREATE POLICY "Participants can submit responses" ON public.live_quiz_responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Participants can view their own responses" ON public.live_quiz_responses
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Quiz owners can view all responses" ON public.live_quiz_responses
  FOR SELECT TO authenticated
  USING (
    quiz_id IN (SELECT id FROM public.live_quizzes WHERE created_by = auth.uid())
  );

-- Enable realtime for live quiz tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_quizzes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_quiz_questions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_quiz_participants;
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_quiz_responses;


-- Add template support and optimize live quiz structure
-- Migration: 20260206000001_live_quiz_templates.sql

-- Add template columns to live_quizzes
ALTER TABLE live_quizzes 
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS template_source_id UUID REFERENCES live_quizzes(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS auto_close_on_timeout BOOLEAN DEFAULT true;

-- Add last_state_change column for efficient polling
ALTER TABLE live_quizzes
ADD COLUMN IF NOT EXISTS last_state_change TIMESTAMPTZ DEFAULT now();

-- Add state version for optimistic updates
ALTER TABLE live_quizzes
ADD COLUMN IF NOT EXISTS state_version INTEGER DEFAULT 1;

-- Create index for template queries
CREATE INDEX IF NOT EXISTS idx_live_quizzes_template ON live_quizzes(created_by, is_template) WHERE is_template = true;

-- Create index for efficient polling (only get changed quizzes)
CREATE INDEX IF NOT EXISTS idx_live_quizzes_state_change ON live_quizzes(id, last_state_change);

-- Function to update state version on any change
CREATE OR REPLACE FUNCTION update_live_quiz_state_version()
RETURNS TRIGGER AS $$
BEGIN
  NEW.state_version = OLD.state_version + 1;
  NEW.last_state_change = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment state version on update
DROP TRIGGER IF EXISTS live_quiz_state_version_trigger ON live_quizzes;
CREATE TRIGGER live_quiz_state_version_trigger
BEFORE UPDATE ON live_quizzes
FOR EACH ROW
EXECUTE FUNCTION update_live_quiz_state_version();

-- Function to auto-close expired questions (can be called by cron or client)
CREATE OR REPLACE FUNCTION close_expired_questions()
RETURNS INTEGER AS $$
DECLARE
  closed_count INTEGER := 0;
BEGIN
  -- Close all questions that have exceeded their time limit
  UPDATE live_quiz_questions q
  SET 
    state = 'closed',
    ended_at = now()
  FROM live_quizzes lq
  WHERE q.quiz_id = lq.id
    AND q.state = 'active'
    AND lq.auto_close_on_timeout = true
    AND q.started_at IS NOT NULL
    AND (now() - q.started_at) > (q.time_limit_seconds * interval '1 second');
  
  GET DIAGNOSTICS closed_count = ROW_COUNT;
  
  -- Update parent quiz status if question was closed
  UPDATE live_quizzes
  SET status = 'paused'
  WHERE id IN (
    SELECT DISTINCT quiz_id 
    FROM live_quiz_questions 
    WHERE state = 'closed' 
    AND ended_at >= now() - interval '2 seconds'
  )
  AND status = 'active';
  
  RETURN closed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION close_expired_questions() TO authenticated;
GRANT EXECUTE ON FUNCTION close_expired_questions() TO anon;

COMMENT ON FUNCTION close_expired_questions() IS 'Closes all questions that have exceeded their time limit. Call periodically or on each poll.';

-- Add redirect_students_home column to live_quizzes
-- When true, students are redirected to home instead of seeing results

ALTER TABLE public.live_quizzes 
ADD COLUMN IF NOT EXISTS redirect_students_home boolean DEFAULT false;

-- Add index for faster lookup
CREATE INDEX IF NOT EXISTS idx_live_quizzes_status_redirect 
ON public.live_quizzes(status, redirect_students_home);


-- Add session_token column to live_quiz_participants for single-device enforcement
-- Each participant can only be active on one device at a time

ALTER TABLE live_quiz_participants 
ADD COLUMN IF NOT EXISTS session_token UUID;

-- Create index for faster session token lookups
CREATE INDEX IF NOT EXISTS idx_live_quiz_participants_session_token 
ON live_quiz_participants(session_token) 
WHERE session_token IS NOT NULL;

COMMENT ON COLUMN live_quiz_participants.session_token IS 'Unique session token for single-device enforcement. Invalidates previous sessions when a new join occurs.';
