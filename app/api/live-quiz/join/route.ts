import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { randomUUID } from 'crypto'

// Note: Live quiz tables are created by migration. Using 'as any' until types are regenerated.

// POST: Join a live quiz
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { quiz_code, participant_name, participant_email } = body

    if (!quiz_code || !participant_name) {
      return NextResponse.json({ error: 'Quiz code and name are required' }, { status: 400 })
    }

    if (!participant_email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(participant_email)) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
    }

    // Find the quiz by code
    const { data: quiz, error: quizError } = await (supabase
      .from('live_quizzes' as any)
      .select('*')
      .eq('quiz_code', quiz_code.toUpperCase())
      .single() as any)

    if (quizError || !quiz) {
      return NextResponse.json({ error: 'Quiz not found' }, { status: 404 })
    }

    // Check if quiz has already ended
    if (quiz.status === 'ended') {
      return NextResponse.json({ error: 'This quiz has already ended' }, { status: 400 })
    }

    // Check if participant already exists by email (email is unique per quiz)
    const { data: existingParticipant } = await (supabase
      .from('live_quiz_participants' as any)
      .select('*')
      .eq('quiz_id', quiz.id)
      .eq('participant_email', participant_email.toLowerCase().trim())
      .single() as any)

    if (existingParticipant) {
      // Verify this is the same person by checking the name matches
      // This prevents someone from hijacking another's email
      if (existingParticipant.participant_name.toLowerCase() !== participant_name.trim().toLowerCase()) {
        return NextResponse.json({ 
          error: 'This email is already registered for this quiz. If you are the owner, please use the same name you used when joining.' 
        }, { status: 400 })
      }

      // Generate a new session token - this invalidates any previous session
      // The old session will be kicked on its next poll attempt
      const newSessionToken = randomUUID()

      // Update last seen and session token, return existing participant
      const { data: updatedParticipant } = await (supabase
        .from('live_quiz_participants' as any)
        .update({ 
          last_seen_at: new Date().toISOString(),
          session_token: newSessionToken
        })
        .eq('id', existingParticipant.id)
        .select()
        .single() as any)

      return NextResponse.json({
        participant: updatedParticipant || existingParticipant,
        quiz: {
          id: quiz.id,
          title: quiz.title,
          status: quiz.status,
          quiz_code: quiz.quiz_code
        },
        session_token: newSessionToken,
        rejoined: true
      })
    }

    // Check if user is logged in
    let userId = null
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      userId = user.id
    }

    // Generate random display position for teacher's screen
    const displayPosition = {
      x: Math.random() * 80 + 10, // 10-90%
      y: Math.random() * 80 + 10  // 10-90%
    }

    // Generate session token for single-device enforcement
    const sessionToken = randomUUID()

    // Create new participant (names can be duplicate, email is unique per quiz)
    const { data: participant, error: participantError } = await (supabase
      .from('live_quiz_participants' as any)
      .insert({
        quiz_id: quiz.id,
        participant_name: participant_name.trim(),
        participant_email: participant_email.toLowerCase().trim(),
        user_id: userId,
        display_position: displayPosition,
        session_token: sessionToken,
        total_score: 0,
        total_correct: 0
      })
      .select()
      .single() as any)

    if (participantError) {
      console.error('Error creating participant:', participantError)
      return NextResponse.json({ error: 'Failed to join quiz' }, { status: 500 })
    }

    return NextResponse.json({
      participant,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        status: quiz.status,
        quiz_code: quiz.quiz_code
      },
      session_token: sessionToken,
      rejoined: false
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/live-quiz/join:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
