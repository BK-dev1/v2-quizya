import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; sessionId: string }> }
) {
  try {
    const supabase = await createClient()
    const { sessionId } = await params

    // Get exam session with exam details
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select(`
        *,
        exam:exams (*)
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Get all questions for the exam
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', session.exam_id)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json({ error: questionsError.message }, { status: 400 })
    }

    // Enrich answers with question details
    const answers = (session.answers as any[] || []).map(answer => {
      const question = (questions || []).find(q => q.id === answer.question_id)
      return {
        ...answer,
        question_text: question?.question_text,
        correct_answer: question?.correct_answer,
        points: question?.points
      }
    })

    const percentage = session.total_points > 0
      ? Math.round((session.score / session.total_points) * 100)
      : 0

    return NextResponse.json({
      session: {
        ...session,
        percentage,
        passed: percentage >= session.exam.passing_score
      },
      answers,
      questions
    })
  } catch (error) {
    console.error('Error fetching session details:', error)
    return NextResponse.json({ error: 'Failed to fetch session details' }, { status: 500 })
  }
}
