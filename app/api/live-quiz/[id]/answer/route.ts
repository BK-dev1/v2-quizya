import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Note: Live quiz tables are created by migration. Using 'as any' until types are regenerated.

// POST: Submit an answer to a question
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: quizId } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { participant_id, question_id, selected_options, response_time_ms } = body

    if (!participant_id || !question_id || !selected_options) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify participant exists
    const { data: participant } = await (supabase
      .from('live_quiz_participants' as any)
      .select('*')
      .eq('id', participant_id)
      .eq('quiz_id', quizId)
      .single() as any)

    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
    }

    // Validate session token (single device enforcement)
    // If participant has a session token, the request MUST include a matching token
    if (participant.session_token) {
      const sessionToken = request.headers.get('X-Session-Token')
      if (!sessionToken || sessionToken !== participant.session_token) {
        return NextResponse.json({ error: 'SESSION_INVALID' }, { status: 403 })
      }
    }

    // Get the question and verify it's active
    const { data: question } = await (supabase
      .from('live_quiz_questions' as any)
      .select('*')
      .eq('id', question_id)
      .eq('quiz_id', quizId)
      .single() as any)

    if (!question) {
      return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    }

    // Check if question is still accepting answers
    if (question.state !== 'active') {
      return NextResponse.json({ error: 'This question is no longer accepting answers' }, { status: 400 })
    }

    // Check if time has expired for this question
    if (question.started_at) {
      const startTime = new Date(question.started_at).getTime()
      const timeElapsed = Date.now() - startTime
      const timeLimit = question.time_limit_seconds * 1000

      if (timeElapsed > timeLimit + 1000) { // 1 second grace period
        return NextResponse.json({ error: 'Time has expired for this question' }, { status: 400 })
      }
    }

    // Check if already answered
    const { data: existingResponse } = await (supabase
      .from('live_quiz_responses' as any)
      .select('id')
      .eq('question_id', question_id)
      .eq('participant_id', participant_id)
      .single() as any)

    if (existingResponse) {
      return NextResponse.json({ error: 'You have already answered this question' }, { status: 400 })
    }

    // Calculate if the answer is correct
    // Answer is correct only if all correct options are selected and no incorrect ones
    const correctOptions = question.correct_options as string[]
    const selectedSet = new Set<string>(selected_options)
    const correctSet = new Set<string>(correctOptions)

    const isCorrect = 
      selectedSet.size === correctSet.size &&
      [...selectedSet].every(opt => correctSet.has(opt))

    const pointsEarned = isCorrect ? question.points : 0

    // Insert the response
    const { data: response, error: responseError } = await (supabase
      .from('live_quiz_responses' as any)
      .insert({
        quiz_id: quizId,
        question_id,
        participant_id,
        selected_options,
        is_correct: isCorrect,
        points_earned: pointsEarned,
        response_time_ms: response_time_ms || null
      })
      .select()
      .single() as any)

    if (responseError) {
      console.error('Error submitting response:', responseError)
      return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 })
    }

    // Update participant's total score
    await (supabase
      .from('live_quiz_participants' as any)
      .update({
        total_score: participant.total_score + pointsEarned,
        total_correct: participant.total_correct + (isCorrect ? 1 : 0),
        last_seen_at: new Date().toISOString()
      })
      .eq('id', participant_id) as any)

    return NextResponse.json({
      success: true,
      response,
      is_correct: isCorrect,
      points_earned: pointsEarned
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/live-quiz/[id]/answer:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
