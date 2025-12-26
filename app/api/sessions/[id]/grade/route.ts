import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

interface EssayGrade {
  question_id: string
  points_earned: number
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: sessionId } = await context.params
    const body = await request.json()
    const { essay_grades }: { essay_grades: EssayGrade[] } = body

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get session and verify teacher owns the exam
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select(`
        id,
        exam_id,
        answers,
        exams!inner (
          id,
          created_by
        )
      `)
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Verify teacher owns this exam
    if (session.exams.created_by !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get all questions for this exam
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('id, question_type, points')
      .eq('exam_id', session.exam_id)

    if (questionsError || !questions) {
      return NextResponse.json({ error: 'Failed to fetch questions' }, { status: 500 })
    }

    // Create a map of essay grades
    const gradeMap = new Map(essay_grades.map(g => [g.question_id, g.points_earned]))

    // Update answers with new essay scores
    const currentAnswers = (session.answers as any[]) || []
    const updatedAnswers = currentAnswers.map(answer => {
      const question = questions.find(q => q.id === answer.question_id)

      // If this is an essay question and we have a grade for it
      if (question?.question_type === 'essay' && gradeMap.has(answer.question_id)) {
        const newPoints = gradeMap.get(answer.question_id)!
        return {
          ...answer,
          points_earned: newPoints,
          is_correct: newPoints > 0
        }
      }

      return answer
    })

    // Recalculate total score
    const totalScore = updatedAnswers.reduce((sum, ans) => sum + (ans.points_earned || 0), 0)

    // Update session
    const { data: updatedSession, error: updateError } = await supabase
      .from('exam_sessions')
      .update({
        answers: updatedAnswers,
        score: totalScore,
        grading_status: 'graded' as any,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating session:', updateError)
      return NextResponse.json({ error: 'Failed to update grades' }, { status: 500 })
    }

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Error grading essays:', error)
    return NextResponse.json({ error: 'Failed to grade essays' }, { status: 500 })
  }
}
