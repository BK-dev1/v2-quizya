-- Fix RLS policy to allow viewing ended quizzes
-- This ensures students can see the final results screen when quiz ends

-- Drop and recreate the policy to include 'ended' status
DROP POLICY IF EXISTS "Anyone can view active quizzes by code" ON public.live_quizzes;

CREATE POLICY "Anyone can view active quizzes by code" ON public.live_quizzes
  FOR SELECT TO anon, authenticated
  USING (status IN ('waiting', 'active', 'paused', 'showing_results', 'ended'));

-- Also need to allow reading participants and questions for ended quizzes
-- Update the participants policy
DROP POLICY IF EXISTS "Participants can view quiz participants" ON public.live_quiz_participants;
CREATE POLICY "Participants can view quiz participants" ON public.live_quiz_participants
  FOR SELECT TO anon, authenticated
  USING (true);

-- Update questions policy to also show for ended quizzes
DROP POLICY IF EXISTS "Participants can view active questions" ON public.live_quiz_questions;
CREATE POLICY "Participants can view active questions" ON public.live_quiz_questions
  FOR SELECT TO anon, authenticated
  USING (
    state IN ('active', 'closed', 'showing_answer')
    OR quiz_id IN (SELECT id FROM public.live_quizzes WHERE status = 'ended')
  );

-- Ensure responses can still be read after quiz ends
DROP POLICY IF EXISTS "Participants can view their own responses" ON public.live_quiz_responses;
CREATE POLICY "Participants can view their own responses" ON public.live_quiz_responses
  FOR SELECT TO anon, authenticated
  USING (true);
