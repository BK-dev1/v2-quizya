import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get exams
    const { data: exams, error } = await supabase
      .from('exams')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(exams || [])
  } catch (error) {
    console.error('Error fetching exams:', error)
    return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const body = await request.json()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Extract questions from body
    const { questions, ...examData } = body

    // Create exam
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .insert({ 
        ...examData, 
        created_by: user.id 
      })
      .select()
      .single()

    if (examError) {
      return NextResponse.json({ error: examError.message }, { status: 400 })
    }

    // Create questions if provided
    if (questions && questions.length > 0) {
      const questionsData = questions.map((q: any) => ({
        exam_id: exam.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        correct_answer: q.correct_answer,
        order_index: q.order_index,
        points: q.points || 1,
        time_limit: q.time_limit || null
      }))

      const { error: questionsError } = await supabase
        .from('questions')
        .insert(questionsData)

      if (questionsError) {
        console.error('Error creating questions:', questionsError)
        // Still return the exam, questions insert failed but exam was created
      }
    }

    return NextResponse.json(exam)
  } catch (error) {
    console.error('Error creating exam:', error)
    return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 })
  }
}
