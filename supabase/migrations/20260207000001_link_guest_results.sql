-- Migration: Link guest quiz results to user accounts
-- When a user signs up with an email that was used as a guest for live quizzes,
-- their results are automatically linked to their account

-- Add indexes for faster email lookups
CREATE INDEX IF NOT EXISTS idx_live_quiz_participants_email 
ON public.live_quiz_participants(participant_email) 
WHERE participant_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_live_quiz_participants_user_id 
ON public.live_quiz_participants(user_id) 
WHERE user_id IS NOT NULL;

-- Add index for faster show_results_to_students lookups
CREATE INDEX IF NOT EXISTS idx_live_quizzes_show_results 
ON public.live_quizzes(show_results_to_students, status);

-- Function to link guest quiz participations to user account on signup
CREATE OR REPLACE FUNCTION public.link_guest_quiz_results()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Link any existing quiz participations with the same email to this user
  UPDATE public.live_quiz_participants
  SET user_id = NEW.id
  WHERE participant_email = LOWER(NEW.email)
    AND user_id IS NULL;
  
  RETURN NEW;
END;
$$;

-- Trigger to run after profile is created (which happens after auth.users insert)
DROP TRIGGER IF EXISTS link_guest_results_on_signup ON public.profiles;
CREATE TRIGGER link_guest_results_on_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.link_guest_quiz_results();

-- Also add index on profiles email for joining
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower 
ON public.profiles(LOWER(email));

-- Add results_published_at column to track when results were published
ALTER TABLE public.live_quizzes 
ADD COLUMN IF NOT EXISTS results_published_at TIMESTAMPTZ DEFAULT NULL;

-- Update the show_final_results action to also set results_published_at
COMMENT ON COLUMN public.live_quizzes.results_published_at IS 'When the teacher published results to students. NULL if not yet published.';

-- Add composite index for efficient participant result queries
CREATE INDEX IF NOT EXISTS idx_live_quiz_participants_results 
ON public.live_quiz_participants(user_id, quiz_id) 
WHERE user_id IS NOT NULL;

-- Function to get participant results efficiently
CREATE OR REPLACE FUNCTION public.get_student_quiz_results(
  p_user_id UUID
)
RETURNS TABLE (
  participation_id UUID,
  participant_name TEXT,
  total_score INTEGER,
  total_correct INTEGER,
  joined_at TIMESTAMPTZ,
  quiz_id UUID,
  quiz_title TEXT,
  quiz_description TEXT,
  quiz_status live_quiz_status,
  quiz_ended_at TIMESTAMPTZ,
  show_results_to_students BOOLEAN,
  total_questions BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id as participation_id,
    p.participant_name,
    p.total_score,
    p.total_correct,
    p.joined_at,
    q.id as quiz_id,
    q.title as quiz_title,
    q.description as quiz_description,
    q.status as quiz_status,
    q.ended_at as quiz_ended_at,
    q.show_results_to_students,
    (SELECT COUNT(*) FROM public.live_quiz_questions WHERE quiz_id = q.id) as total_questions
  FROM public.live_quiz_participants p
  INNER JOIN public.live_quizzes q ON p.quiz_id = q.id
  WHERE p.user_id = p_user_id
  ORDER BY p.joined_at DESC;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_student_quiz_results(UUID) TO authenticated;

-- Ensure RLS allows viewing own participations by email too (for linking)
CREATE POLICY IF NOT EXISTS "Users can view participations by their email" ON public.live_quiz_participants
  FOR SELECT TO authenticated
  USING (
    participant_email = (SELECT LOWER(email) FROM profiles WHERE id = auth.uid())
    OR user_id = auth.uid()
  );

-- Add policy for updating user_id (for linking)
DROP POLICY IF EXISTS "System can link participations to users" ON public.live_quiz_participants;
CREATE POLICY "System can link participations to users" ON public.live_quiz_participants
  FOR UPDATE TO authenticated
  USING (
    participant_email = (SELECT LOWER(email) FROM profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()
  );
