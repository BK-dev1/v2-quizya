import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const VALID_TYPES = ['mcq', 'truefalse', 'shortanswer', 'essay']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const { questions } = await request.json()

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Questions array is required' }, { status: 400 })
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate exam ownership
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('created_by, status')
      .eq('id', id)
      .single()

    if (examError || !exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    if (exam.created_by !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    if (exam.status === 'ended') return NextResponse.json({ error: 'Cannot edit ended exam' }, { status: 400 })

    // Validate questions
    for (const q of questions) {
      if (!q.question_text || !q.question_type || !VALID_TYPES.includes(q.question_type)) {
        return NextResponse.json({ error: `Invalid question: ${JSON.stringify(q)}` }, { status: 400 })
      }
      if (q.question_type === 'mcq' && (!q.options || !Array.isArray(q.options) || q.options.length < 2)) {
        return NextResponse.json({ error: `MCQ must have at least 2 options: ${q.question_text}` }, { status: 400 })
      }
      if (q.correct_answer == null) {
        return NextResponse.json({ error: `Missing correct_answer for question: ${q.question_text}` }, { status: 400 })
      }
    }

    // Insert questions
    const questionsData = questions.map((q: any) => {
      let dbType = q.question_type
      if (q.question_type === 'mcq') dbType = 'multiple_choice'
      else if (q.question_type === 'truefalse') dbType = 'true_false'
      else if (q.question_type === 'shortanswer') dbType = 'short_answer'
      let correctAnswerValue: string
      if (Array.isArray(q.correct_answer)) {
        correctAnswerValue = JSON.stringify(q.correct_answer)
      } else {
        correctAnswerValue = String(q.correct_answer)
      }

      return {
        exam_id: id,
        question_text: q.question_text,
        question_type: dbType,
        options: q.options || null,
        correct_answer: correctAnswerValue,
        order_index: q.order_index || null,
        points: q.points || 1,
        time_limit: q.time_limit || null
      }
    })

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsData)

    if (questionsError) return NextResponse.json({ error: questionsError.message }, { status: 400 })

    return NextResponse.json({ success: true, added: questions.length })
  } catch (error) {
    console.error('Error adding questions:', error)
    return NextResponse.json({ error: 'Failed to add questions' }, { status: 500 })
  }
}


export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: examId } = await params

    if (!examId) {
      return NextResponse.json(
        { error: 'Exam ID missing' },
        { status: 400 }
      )
    }

    const { data: questions, error } = await supabase
      .from('questions')
      .select(`
        id,
        question_text,
        question_type,
        options,
        points,
        order_index,
        time_limit
      `)
      .eq('exam_id', examId)
      .order('order_index', { ascending: true })

    if (error) {
      console.error(error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(questions)
  } catch (err) {
    console.error('GET questions failed:', err)
    return NextResponse.json(
      { error: 'Failed to fetch questions' },
      { status: 500 }
    )
  }
}
