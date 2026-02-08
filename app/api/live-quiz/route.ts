import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Note: These tables are created by the migration but types need to be regenerated
// Using 'as any' until types are properly regenerated from database

// GET: List all live quizzes for the current teacher
// POST: Create a new live quiz
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: quizzes, error } = await (supabase
      .from('live_quizzes' as any)
      .select(`
        id,
        title,
        description,
        status,
        quiz_code,
        created_at,
        show_results_to_students,
        questions:live_quiz_questions(id),
        participants:live_quiz_participants(id)
      `)
      .eq('created_by', user.id)
      .order('created_at', { ascending: false }) as any)

    if (error) {
      console.error('Error fetching live quizzes:', error)
      return NextResponse.json({ error: 'Failed to fetch quizzes' }, { status: 500 })
    }

    return NextResponse.json(quizzes)
  } catch (error) {
    console.error('Error in GET /api/live-quiz:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a teacher - check profile first, then user metadata as fallback
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    // If profile doesn't exist, create it (fallback for trigger failure)
    if (profileError?.code === 'PGRST116') {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || 'User',
          role: user.user_metadata?.role || 'student'
        })
        .select('role')
        .single()
      profile = newProfile
    }

    // Determine the user's role from profile or user metadata
    const userRole = profile?.role || user.user_metadata?.role

    if (userRole !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can create quizzes' }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, questions } = body

    if (!title || !questions || questions.length === 0) {
      return NextResponse.json({ error: 'Title and at least one question are required' }, { status: 400 })
    }

    // Generate unique quiz code
    const generateQuizCode = () => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = ''
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return code
    }

    let quizCode = generateQuizCode()
    
    // Ensure code is unique
    let codeExists = true
    while (codeExists) {
      const { data: existing } = await (supabase
        .from('live_quizzes' as any)
        .select('id')
        .eq('quiz_code', quizCode)
        .single() as any)
      
      if (!existing) {
        codeExists = false
      } else {
        quizCode = generateQuizCode()
      }
    }

    // Create the quiz
    const { data: quiz, error: quizError } = await (supabase
      .from('live_quizzes' as any)
      .insert({
        title,
        description,
        quiz_code: quizCode,
        status: 'waiting',
        current_question_index: -1,
        show_results_to_students: false,
        created_by: user.id
      })
      .select()
      .single() as any)

    if (quizError) {
      console.error('Error creating quiz:', quizError)
      return NextResponse.json({ error: 'Failed to create quiz' }, { status: 500 })
    }

    // Create questions
    const questionsToInsert = questions.map((q: any, index: number) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      options: q.options,
      correct_options: q.correct_options,
      time_limit_seconds: q.time_limit_seconds || 30,
      points: q.points || 1,
      order_index: index,
      state: 'hidden'
    }))

    const { error: questionsError } = await (supabase
      .from('live_quiz_questions' as any)
      .insert(questionsToInsert) as any)

    if (questionsError) {
      console.error('Error creating questions:', questionsError)
      // Rollback: delete the quiz
      await (supabase.from('live_quizzes' as any).delete().eq('id', quiz.id) as any)
      return NextResponse.json({ error: 'Failed to create questions' }, { status: 500 })
    }

    return NextResponse.json(quiz, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/live-quiz:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
