import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const examId = id

    // Get exam details
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Get all exam sessions with student info
    const { data: sessions, error: sessionsError } = await supabase
      .from('exam_sessions')
      .select(`
        *,
        student:profiles (
          id,
          email,
          full_name
        )
      `)
      .eq('exam_id', examId)
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json({ error: sessionsError.message }, { status: 400 })
    }

    // Get all questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json({ error: questionsError.message }, { status: 400 })
    }

    // Calculate statistics
    const completedSessions = (sessions || []).filter(s => s.status === 'completed')
    const totalAttempts = sessions?.length || 0
    const completedAttempts = completedSessions.length
    const avgScore = completedAttempts > 0
      ? Math.round(
          completedSessions.reduce((sum, s) => sum + (s.score || 0), 0) / completedAttempts
        )
      : 0

    // Calculate question statistics
    const questionStats = (questions || []).map(question => {
      let correctCount = 0
      let totalAttempted = 0

      for (const session of completedSessions) {
        const answers = session.answers as any[] || []
        const questionAnswer = answers.find(a => a.question_id === question.id)
        if (questionAnswer) {
          totalAttempted++
          if (questionAnswer.is_correct) {
            correctCount++
          }
        }
      }

      const correctPercentage = totalAttempted > 0
        ? Math.round((correctCount / totalAttempted) * 100)
        : 0

      return {
        id: question.id,
        question_text: question.question_text,
        correct_count: correctCount,
        total_attempted: totalAttempted,
        correct_percentage: correctPercentage,
        points: question.points
      }
    })

    // Calculate pass/fail counts
    const passingScore = exam.passing_score
    const passedCount = completedSessions.filter(s => {
      const percentage = s.total_points > 0
        ? Math.round((s.score || 0) / s.total_points * 100)
        : 0
      return percentage >= passingScore
    }).length

    return NextResponse.json({
      exam,
      sessions: sessions || [],
      questions: questions || [],
      statistics: {
        totalAttempts,
        completedAttempts,
        avgScore,
        passedCount,
        failedCount: completedAttempts - passedCount,
        passPercentage: completedAttempts > 0
          ? Math.round((passedCount / completedAttempts) * 100)
          : 0
      },
      questionStats
    })
  } catch (error) {
    console.error('Error fetching exam results:', error)
    return NextResponse.json({ error: 'Failed to fetch exam results' }, { status: 500 })
  }
}
