import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Note: Live quiz tables are created by migration. Using 'as any' until types are regenerated.

// Helper: Check and close expired questions (only called once when needed)
async function checkAndCloseExpiredQuestions(supabase: any, quizId: string) {
  // Get the current active question
  const { data: quiz } = await (supabase
    .from('live_quizzes' as any)
    .select('*, questions:live_quiz_questions(*)')
    .eq('id', quizId)
    .eq('status', 'active')
    .order('order_index', { referencedTable: 'live_quiz_questions' })
    .single() as any)

  if (!quiz || quiz.status !== 'active') return false

  const currentQuestion = quiz.questions?.[quiz.current_question_index]
  if (!currentQuestion || currentQuestion.state !== 'active' || !currentQuestion.started_at) return false

  const serverTime = Date.now()
  const startTime = new Date(currentQuestion.started_at).getTime()
  const elapsed = (serverTime - startTime) / 1000
  const timeLimit = currentQuestion.time_limit_seconds || 30

  if (elapsed >= timeLimit) {
    // Close the question
    await (supabase
      .from('live_quiz_questions' as any)
      .update({ state: 'closed', ended_at: new Date().toISOString() })
      .eq('id', currentQuestion.id) as any)

    // Update quiz status to paused
    await (supabase
      .from('live_quizzes' as any)
      .update({ status: 'paused' })
      .eq('id', quizId) as any)

    return true
  }
  return false
}

// GET: Get a single live quiz with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const checkTimeout = searchParams.get('check_timeout') === 'true'
    
    const supabase = await createClient()
    
    // Auto-close expired questions if requested
    if (checkTimeout) {
      await checkAndCloseExpiredQuestions(supabase, id)
    }
    
    const { data: quiz, error } = await (supabase
      .from('live_quizzes' as any)
      .select(`
        *,
        questions:live_quiz_questions(*),
        participants:live_quiz_participants(*)
      `)
      .eq('id', id)
      .order('order_index', { referencedTable: 'live_quiz_questions' })
      .single() as any)

    if (error || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Calculate server time and remaining time for synchronization
    const serverTime = Date.now()
    let timeRemainingSeconds: number | null = null
    if (quiz.status === 'active' && quiz.current_question_index >= 0) {
      const currentQ = quiz.questions?.[quiz.current_question_index]
      if (currentQ?.state === 'active' && currentQ?.started_at) {
        const startTime = new Date(currentQ.started_at).getTime()
        const elapsed = (serverTime - startTime) / 1000
        timeRemainingSeconds = Math.max(0, (currentQ.time_limit_seconds || 30) - elapsed)
      }
    }

    return NextResponse.json({
      ...quiz,
      server_time: serverTime,
      time_remaining_seconds: timeRemainingSeconds
    })
  } catch (error) {
    console.error('Error in GET /api/live-quiz/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper: Recalculate all participant scores from responses
async function recalculateParticipantScores(supabase: any, quizId: string) {
  // Get all participants
  const { data: participants } = await (supabase
    .from('live_quiz_participants' as any)
    .select('id')
    .eq('quiz_id', quizId) as any)

  if (!participants || participants.length === 0) return

  // Get all responses for this quiz
  const { data: responses } = await (supabase
    .from('live_quiz_responses' as any)
    .select('participant_id, is_correct, points_earned')
    .eq('quiz_id', quizId) as any)

  // Calculate totals per participant
  const participantTotals: Record<string, { total_score: number; total_correct: number }> = {}
  
  for (const p of participants) {
    participantTotals[p.id] = { total_score: 0, total_correct: 0 }
  }

  for (const r of (responses || [])) {
    if (participantTotals[r.participant_id]) {
      participantTotals[r.participant_id].total_score += r.points_earned || 0
      participantTotals[r.participant_id].total_correct += r.is_correct ? 1 : 0
    }
  }

  // Update all participants
  for (const [participantId, totals] of Object.entries(participantTotals)) {
    await (supabase
      .from('live_quiz_participants' as any)
      .update({
        total_score: totals.total_score,
        total_correct: totals.total_correct
      })
      .eq('id', participantId) as any)
  }
}

// PUT: Update quiz (start, pause, advance question, show results, end)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: quiz } = await (supabase
      .from('live_quizzes' as any)
      .select('*, questions:live_quiz_questions(*)')
      .eq('id', id)
      .eq('created_by', user.id)
      .order('order_index', { referencedTable: 'live_quiz_questions' })
      .single() as any)

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found or unauthorized' }, { status: 404 })
    }

    const body = await request.json()
    const { action, show_results_to_students } = body

    switch (action) {
      case 'start': {
        // Start the quiz and show the first question
        const firstQuestion = quiz.questions?.[0]
        
        if (!firstQuestion) {
          return NextResponse.json({ error: 'No questions in quiz' }, { status: 400 })
        }

        // Update quiz status
        await (supabase
          .from('live_quizzes' as any)
          .update({
            status: 'active',
            current_question_index: 0,
            started_at: new Date().toISOString()
          })
          .eq('id', id) as any)

        // Activate first question
        await (supabase
          .from('live_quiz_questions' as any)
          .update({
            state: 'active',
            started_at: new Date().toISOString()
          })
          .eq('id', firstQuestion.id) as any)

        break
      }

      case 'next_question': {
        // Close current question and move to next
        const currentIndex = quiz.current_question_index
        const nextIndex = currentIndex + 1
        const currentQuestion = quiz.questions?.[currentIndex]
        const nextQuestion = quiz.questions?.[nextIndex]

        if (currentQuestion) {
          // Close current question
          await (supabase
            .from('live_quiz_questions' as any)
            .update({
              state: 'closed',
              ended_at: new Date().toISOString()
            })
            .eq('id', currentQuestion.id) as any)
        }

        if (nextQuestion) {
          // Move to next question
          await (supabase
            .from('live_quizzes' as any)
            .update({
              current_question_index: nextIndex,
              status: 'active'
            })
            .eq('id', id) as any)

          // Activate next question
          await (supabase
            .from('live_quiz_questions' as any)
            .update({
              state: 'active',
              started_at: new Date().toISOString()
            })
            .eq('id', nextQuestion.id) as any)
        } else {
          // No more questions, end the quiz and show results automatically
          // Recalculate all scores first
          await recalculateParticipantScores(supabase, id)
          
          await (supabase
            .from('live_quizzes' as any)
            .update({
              status: 'ended',
              ended_at: new Date().toISOString(),
              show_results_to_students: true
            })
            .eq('id', id) as any)
        }

        break
      }

      case 'close_question': {
        // Close current question but don't advance yet (for discussion time)
        const currentQuestion = quiz.questions?.[quiz.current_question_index]
        
        if (currentQuestion) {
          await (supabase
            .from('live_quiz_questions' as any)
            .update({
              state: 'closed',
              ended_at: new Date().toISOString()
            })
            .eq('id', currentQuestion.id) as any)

          await (supabase
            .from('live_quizzes' as any)
            .update({ status: 'paused' })
            .eq('id', id) as any)
        }

        break
      }

      case 'show_answer': {
        // Show the correct answer for current question
        const currentQuestion = quiz.questions?.[quiz.current_question_index]
        
        if (currentQuestion) {
          await (supabase
            .from('live_quiz_questions' as any)
            .update({ state: 'showing_answer' })
            .eq('id', currentQuestion.id) as any)

          await (supabase
            .from('live_quizzes' as any)
            .update({ status: 'showing_results' })
            .eq('id', id) as any)
        }

        break
      }

      case 'end': {
        // End the quiz completely and show results to students
        // Recalculate all scores first
        await recalculateParticipantScores(supabase, id)
        
        await (supabase
          .from('live_quizzes' as any)
          .update({
            status: 'ended',
            ended_at: new Date().toISOString(),
            show_results_to_students: true
          })
          .eq('id', id) as any)

        // Close all remaining open questions
        await (supabase
          .from('live_quiz_questions' as any)
          .update({
            state: 'closed',
            ended_at: new Date().toISOString()
          })
          .eq('quiz_id', id)
          .in('state', ['hidden', 'active']) as any)

        break
      }

      case 'show_final_results': {
        // Show final results to students
        await (supabase
          .from('live_quizzes' as any)
          .update({ show_results_to_students: true })
          .eq('id', id) as any)

        break
      }

      case 'update_settings': {
        // Generic update for settings like show_results_to_students
        const updates: any = {}
        if (typeof show_results_to_students === 'boolean') {
          updates.show_results_to_students = show_results_to_students
        }
        
        if (Object.keys(updates).length > 0) {
          await (supabase
            .from('live_quizzes' as any)
            .update(updates)
            .eq('id', id) as any)
        }

        break
      }

      case 'recalculate_scores': {
        // Manually recalculate all participant scores from responses
        await recalculateParticipantScores(supabase, id)
        break
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Return updated quiz
    const { data: updatedQuiz } = await (supabase
      .from('live_quizzes' as any)
      .select(`
        *,
        questions:live_quiz_questions(*),
        participants:live_quiz_participants(*)
      `)
      .eq('id', id)
      .order('order_index', { referencedTable: 'live_quiz_questions' })
      .single() as any)

    return NextResponse.json(updatedQuiz)
  } catch (error) {
    console.error('Error in PUT /api/live-quiz/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE: Delete a quiz
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await (supabase
      .from('live_quizzes' as any)
      .delete()
      .eq('id', id)
      .eq('created_by', user.id) as any)

    if (error) {
      console.error('Error deleting quiz:', error)
      return NextResponse.json({ error: 'Failed to delete quiz' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/live-quiz/[id]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
