import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET: Get all live quiz results for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all participations for this user with quiz details
    const { data: participations, error } = await (supabase
      .from('live_quiz_participants' as any)
      .select(`
        id,
        participant_name,
        total_score,
        total_correct,
        joined_at,
        quiz:live_quizzes!inner(
          id,
          title,
          description,
          status,
          ended_at,
          created_at,
          show_results_to_students,
          questions:live_quiz_questions(count)
        )
      `)
      .eq('user_id', user.id)
      .order('joined_at', { ascending: false }) as any)

    if (error) {
      console.error('Error fetching results:', error)
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
    }

    // Format the response
    const results = (participations || []).map((p: any) => ({
      id: p.id,
      participant_name: p.participant_name,
      total_score: p.total_score,
      total_correct: p.total_correct,
      joined_at: p.joined_at,
      quiz: {
        id: p.quiz.id,
        title: p.quiz.title,
        description: p.quiz.description,
        status: p.quiz.status,
        ended_at: p.quiz.ended_at,
        created_at: p.quiz.created_at,
        show_results_to_students: p.quiz.show_results_to_students,
        total_questions: p.quiz.questions?.[0]?.count || 0
      }
    }))

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error in GET /api/live-quiz/my-results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
