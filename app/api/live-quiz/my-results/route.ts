import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

// Force dynamic - no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

// GET: Get all live quiz results for the authenticated user
export async function GET(request: NextRequest) {
  try {
    // First, verify user authentication with regular client
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Use admin client to bypass RLS for data operations
    const adminClient = createAdminClient()

    // Run profile fetch and linking in background (don't await linking)
    const profilePromise = adminClient
      .from('profiles')
      .select('email')
      .eq('id', user.id)
      .single()

    // Get participations with optimized query - filter at DB level
    // Only fetch ended quizzes with results published
    const participationsPromise = (adminClient
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
          show_results_to_students
        )
      `)
      .eq('user_id', user.id)
      .eq('quiz.status', 'ended')
      .eq('quiz.show_results_to_students', true)
      .order('joined_at', { ascending: false })
      .limit(50) as any)

    // Wait for both in parallel
    const [profileResult, participationsResult] = await Promise.all([
      profilePromise,
      participationsPromise
    ])

    // Link unlinked participations in background (don't block response)
    if (profileResult.data?.email) {
      // Fire and forget - don't await
      (adminClient
        .from('live_quiz_participants' as any)
        .update({ user_id: user.id })
        .eq('participant_email', profileResult.data.email.toLowerCase())
        .is('user_id', null) as any).then(() => {})
    }

    if (participationsResult.error) {
      return NextResponse.json({ error: 'Failed to fetch results' }, { status: 500 })
    }

    // Get question counts in a single query
    const quizIds = (participationsResult.data || []).map((p: any) => p.quiz.id)
    let questionCounts: Record<string, number> = {}
    
    if (quizIds.length > 0) {
      const { data: counts } = await (adminClient
        .from('live_quiz_questions' as any)
        .select('quiz_id')
        .in('quiz_id', quizIds) as any)
      
      if (counts) {
        questionCounts = counts.reduce((acc: Record<string, number>, q: any) => {
          acc[q.quiz_id] = (acc[q.quiz_id] || 0) + 1
          return acc
        }, {})
      }
    }

    // Format response
    const results = (participationsResult.data || []).map((p: any) => ({
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
        total_questions: questionCounts[p.quiz.id] || 0
      }
    }))

    // Add cache control headers to prevent browser caching
    const response = NextResponse.json(results)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    return response
  } catch (error) {
    console.error('Error in GET /api/live-quiz/my-results:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
