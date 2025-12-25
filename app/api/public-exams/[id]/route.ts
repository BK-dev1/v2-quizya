import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await context.params

    // Fetch the exam with creator profile and questions
    const { data: exam, error } = await supabase
      .from('exams')
      .select(`
        *,
        profiles!exams_created_by_fkey (
          username,
          full_name
        ),
        questions (
          id,
          question_text,
          question_type,
          options,
          correct_answer,
          points,
          order_index
        )
      `)
      .eq('id', id)
      .eq('is_public', true)
      .single()

    if (error) {
      console.error('Error fetching exam:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Exam not found' },
          { status: 404 }
        )
      }
      throw error
    }

    // Fetch session count separately
    const { count: sessionCount } = await supabase
      .from('exam_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('exam_id', id)

    // Transform the response to include session count
    const transformedExam = {
      ...exam,
      _count: {
        exam_sessions: sessionCount || 0
      }
    }

    return NextResponse.json(transformedExam)
  } catch (error) {
    console.error('Error fetching public exam:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exam' },
      { status: 500 }
    )
  }
}
