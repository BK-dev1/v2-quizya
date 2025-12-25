import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { roomCode, guestName, guestEmail } = await request.json()

    if (!roomCode || !guestName || !guestEmail) {
      return NextResponse.json(
        { error: 'Room code, guest name, and guest email are required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Find exam by room code
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('room_code', roomCode)
      .eq('is_active', true)
      .single()

    if (examError || !exam) {
      return NextResponse.json(
        { error: 'Invalid room code or exam not found' },
        { status: 404 }
      )
    }

    // Use Service Role for session operations to bypass RLS during join
    const supabaseAdmin = await createClient() // wait, I should probably create a specific admin client helper or just use the env here
    // But createClient from @/lib/supabase/server uses cookies/anon key.

    // I will use createServerClient directly with the service role key
    const { createServerClient } = await import('@supabase/ssr')
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()

    const adminClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch { }
          },
        },
      }
    )

    // Check if guest already has a session for this exam
    const { data: existingSession } = await adminClient
      .from('exam_sessions')
      .select('*')
      .eq('exam_id', exam.id)
      .eq('guest_email', guestEmail)
      .eq('is_guest', true)
      .single()

    if (existingSession) {
      return NextResponse.json({
        exam,
        session: existingSession,
        message: 'Returning to existing exam session'
      })
    }

    // Get total points for the exam
    const { data: questions } = await adminClient
      .from('questions')
      .select('points')
      .eq('exam_id', exam.id)

    const totalPoints = questions?.reduce((sum, q) => sum + q.points, 0) || 0

    // Create new guest session using admin client to bypass RLS constraints during join
    const { data: newSession, error: sessionError } = await adminClient
      .from('exam_sessions')
      .insert({
        exam_id: exam.id,
        guest_name: guestName,
        guest_email: guestEmail,
        is_guest: true,
        total_points: totalPoints,
        status: 'not_started'
      })
      .select()
      .single()

    if (sessionError) {
      console.error('Error creating guest session:', sessionError)
      return NextResponse.json(
        { error: 'Failed to create exam session' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      exam,
      session: newSession,
      message: 'Successfully joined exam as guest'
    })

  } catch (error) {
    console.error('Error in guest join:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}