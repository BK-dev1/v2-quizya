import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Note: Live quiz tables are created by migration. Using 'as any' until types are regenerated.

// GET: Get the current active question for students - OPTIMIZED for minimal queries
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params
    const supabase = await createClient()
    const serverTime = Date.now()
    const { searchParams } = new URL(request.url)
    const participantId = searchParams.get('participant_id')

    // SINGLE QUERY: Get quiz with all questions and participant in one request
    const { data: quiz } = await (supabase
      .from('live_quizzes' as any)
      .select(`
        *,
        questions:live_quiz_questions(*),
        participants:live_quiz_participants(*)
      `)
      .eq('id', quizId)
      .order('order_index', { referencedTable: 'live_quiz_questions' })
      .single() as any)

    if (!quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Extract data from single query result
    const allQuestions = quiz.questions || []
    const totalQuestions = allQuestions.length
    const currentQuestionData = quiz.current_question_index >= 0 
      ? allQuestions[quiz.current_question_index] 
      : null

    // Find participant from the joined data
    let participantInfo = null
    if (participantId && quiz.participants) {
      participantInfo = quiz.participants.find((p: any) => p.id === participantId) || null
      
      // Validate session token (single device enforcement)
      // If participant has a session token, the request MUST include a matching token
      if (participantInfo && participantInfo.session_token) {
        const sessionToken = request.headers.get('X-Session-Token')
        if (!sessionToken || sessionToken !== participantInfo.session_token) {
          return NextResponse.json({ error: 'SESSION_INVALID' }, { status: 403 })
        }
      }

      // Update last_seen only every 30 seconds (non-blocking)
      if (participantInfo) {
        const lastSeen = new Date(participantInfo.last_seen_at || 0).getTime()
        if (serverTime - lastSeen > 30000) {
          // Fire and forget - don't await
          supabase
            .from('live_quiz_participants' as any)
            .update({ last_seen_at: new Date().toISOString() })
            .eq('id', participantId)
            .then(() => {})
        }
      }
    }

    // Build current question response (no extra query needed)
    let currentQuestion = null
    let participantResponse = null
    let questionStats = null

    if (currentQuestionData) {
      currentQuestion = {
        id: currentQuestionData.id,
        question_text: currentQuestionData.question_text,
        options: currentQuestionData.options,
        time_limit_seconds: currentQuestionData.time_limit_seconds,
        points: currentQuestionData.points,
        order_index: currentQuestionData.order_index,
        state: currentQuestionData.state,
        started_at: currentQuestionData.started_at,
        // Only include correct_options if showing answer
        ...(currentQuestionData.state === 'showing_answer' && { correct_options: currentQuestionData.correct_options })
      }

      // CONDITIONAL QUERY: Only fetch participant's response if needed
      if (participantId && currentQuestionData.state !== 'hidden') {
        const { data: response } = await (supabase
          .from('live_quiz_responses' as any)
          .select('selected_options, is_correct')
          .eq('question_id', currentQuestionData.id)
          .eq('participant_id', participantId)
          .single() as any)

        if (response) {
          participantResponse = {
            selected_options: response.selected_options,
            ...(currentQuestionData.state === 'showing_answer' && { 
              is_correct: response.is_correct,
              correct_options: currentQuestionData.correct_options 
            })
          }
        }
      }

      // CONDITIONAL QUERY: Only fetch stats when showing answer
      if (currentQuestionData.state === 'showing_answer') {
        const { data: responses } = await (supabase
          .from('live_quiz_responses' as any)
          .select('selected_options')
          .eq('question_id', currentQuestionData.id) as any)

        const optionDistribution: Record<string, number> = {}
        const options = currentQuestionData.options as Array<{ id: string; text: string }>
        
        options.forEach((opt: any) => {
          optionDistribution[opt.id] = 0
        })

        responses?.forEach((response: any) => {
          const selectedOptions = response.selected_options as string[]
          selectedOptions.forEach((optId: string) => {
            if (optionDistribution[optId] !== undefined) {
              optionDistribution[optId]++
            }
          })
        })

        const totalResponses = responses?.length || 0
        const optionPercentages: Record<string, number> = {}
        Object.keys(optionDistribution).forEach(optId => {
          optionPercentages[optId] = totalResponses > 0 
            ? Math.round((optionDistribution[optId] / totalResponses) * 100)
            : 0
        })

        questionStats = {
          total_responses: totalResponses,
          option_percentages: optionPercentages
        }
      }
    }

    // Calculate time remaining for synchronization
    let timeRemainingSeconds: number | null = null
    if (currentQuestion?.state === 'active' && currentQuestion?.started_at) {
      const startTime = new Date(currentQuestion.started_at).getTime()
      const elapsed = (serverTime - startTime) / 1000
      timeRemainingSeconds = Math.max(0, (currentQuestion.time_limit_seconds || 30) - elapsed)
    }

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        status: quiz.status,
        current_question_index: quiz.current_question_index,
        total_questions: totalQuestions,
        show_results_to_students: quiz.show_results_to_students,
        redirect_students_home: quiz.redirect_students_home || false
      },
      current_question: currentQuestion,
      participant_response: participantResponse,
      question_stats: questionStats,
      participant: participantInfo,
      server_time: serverTime,
      time_remaining_seconds: timeRemainingSeconds
    })
  } catch (error) {
    console.error('Error in GET /api/live-quiz/[id]/current:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
