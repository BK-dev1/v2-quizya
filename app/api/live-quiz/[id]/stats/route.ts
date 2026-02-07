import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Note: Live quiz tables are created by migration. Using 'as any' until types are regenerated.

// GET: Get statistics for a question or the entire quiz
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const questionId = searchParams.get('question_id')
    const participantId = searchParams.get('participant_id')

    // Get the quiz
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

    // If requesting stats for a specific question
    if (questionId) {
      const { data: responses } = await (supabase
        .from('live_quiz_responses' as any)
        .select('*')
        .eq('question_id', questionId) as any)

      const question = quiz.questions?.find((q: any) => q.id === questionId)
      
      if (!question) {
        return NextResponse.json({ error: 'Question not found' }, { status: 404 })
      }

      // Calculate option distribution
      const optionDistribution: Record<string, number> = {}
      const options = question.options as Array<{ id: string; text: string }>
      
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
      const correctResponses = responses?.filter((r: any) => r.is_correct).length || 0

      // Calculate percentages
      const optionPercentages: Record<string, number> = {}
      Object.keys(optionDistribution).forEach(optId => {
        optionPercentages[optId] = totalResponses > 0 
          ? Math.round((optionDistribution[optId] / totalResponses) * 100)
          : 0
      })

      return NextResponse.json({
        question_id: questionId,
        total_responses: totalResponses,
        correct_responses: correctResponses,
        correct_percentage: totalResponses > 0 ? Math.round((correctResponses / totalResponses) * 100) : 0,
        option_distribution: optionDistribution,
        option_percentages: optionPercentages,
        correct_options: question.correct_options
      })
    }

    // If requesting stats for a specific participant
    if (participantId) {
      const { data: participant } = await (supabase
        .from('live_quiz_participants' as any)
        .select('*')
        .eq('id', participantId)
        .eq('quiz_id', quizId)
        .single() as any)

      if (!participant) {
        return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
      }

      const { data: responses } = await (supabase
        .from('live_quiz_responses' as any)
        .select('*')
        .eq('participant_id', participantId)
        .eq('quiz_id', quizId) as any)

      // Calculate rank with proper tie handling
      const allParticipants = quiz.participants || []
      const sortedParticipants = [...allParticipants].sort((a: any, b: any) => {
        if (b.total_score !== a.total_score) return b.total_score - a.total_score
        return b.total_correct - a.total_correct
      })
      
      // Find rank considering ties
      let rank = 1
      for (let i = 0; i < sortedParticipants.length; i++) {
        if (sortedParticipants[i].id === participantId) {
          // Check if there's a tie with previous participant
          if (i > 0 && sortedParticipants[i].total_score === sortedParticipants[i-1].total_score) {
            // Find the first participant with this score
            for (let j = i - 1; j >= 0; j--) {
              if (sortedParticipants[j].total_score !== sortedParticipants[i].total_score) {
                rank = j + 2
                break
              }
              if (j === 0) rank = 1
            }
          } else {
            rank = i + 1
          }
          break
        }
      }

      return NextResponse.json({
        participant,
        responses,
        total_questions: quiz.questions?.length || 0,
        answered_questions: responses?.length || 0,
        rank,
        total_participants: allParticipants.length
      })
    }

    // Return full quiz statistics
    const { data: allResponses } = await (supabase
      .from('live_quiz_responses' as any)
      .select('*')
      .eq('quiz_id', quizId) as any)

    // Calculate total response time per participant for tiebreaking
    const participantResponseTimes: Record<string, number> = {}
    for (const r of (allResponses || [])) {
      if (!participantResponseTimes[r.participant_id]) {
        participantResponseTimes[r.participant_id] = 0
      }
      participantResponseTimes[r.participant_id] += r.response_time_ms || 0
    }

    // Build leaderboard with better ranking (handles ties, faster time wins on tie)
    const participants = quiz.participants || []
    const sortedParticipants = [...participants].sort((a: any, b: any) => {
      // First sort by score (descending)
      if (b.total_score !== a.total_score) {
        return b.total_score - a.total_score
      }
      // Then by correct count (descending)
      if (b.total_correct !== a.total_correct) {
        return b.total_correct - a.total_correct
      }
      // Then by total response time (ascending - faster is better)
      const aTime = participantResponseTimes[a.id] || 0
      const bTime = participantResponseTimes[b.id] || 0
      return aTime - bTime
    })

    // Assign ranks, handling ties
    let currentRank = 1
    const leaderboard = sortedParticipants.map((p: any, index: number) => {
      if (index > 0) {
        const prevP = sortedParticipants[index - 1]
        if (p.total_score !== prevP.total_score) {
          currentRank = index + 1
        }
      }
      return {
        rank: currentRank,
        participant_id: p.id,
        participant_name: p.participant_name,
        total_score: p.total_score,
        total_correct: p.total_correct,
        total_response_time_ms: participantResponseTimes[p.id] || 0
      }
    })

    // Question-by-question stats
    const questionStats = quiz.questions?.map((q: any) => {
      const questionResponses = allResponses?.filter((r: any) => r.question_id === q.id) || []
      return {
        question_id: q.id,
        question_text: q.question_text,
        total_responses: questionResponses.length,
        correct_responses: questionResponses.filter((r: any) => r.is_correct).length,
        average_response_time: questionResponses.length > 0
          ? Math.round(questionResponses.reduce((sum: number, r: any) => sum + (r.response_time_ms || 0), 0) / questionResponses.length)
          : 0
      }
    })

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        status: quiz.status,
        total_questions: quiz.questions?.length || 0,
        total_participants: participants.length
      },
      leaderboard,
      question_stats: questionStats,
      show_results_to_students: quiz.show_results_to_students
    })
  } catch (error) {
    console.error('Error in GET /api/live-quiz/[id]/stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
