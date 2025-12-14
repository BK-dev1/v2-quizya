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

    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', examId)
      .single()

    if (examError || !exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
    }

    // Get questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select('*')
      .eq('exam_id', examId)
      .order('order_index', { ascending: true })

    if (questionsError) {
      console.error('Error fetching questions:', questionsError)
      return NextResponse.json({ error: questionsError.message }, { status: 400 })
    }

    return NextResponse.json({
      exam,
      questions: questions || []
    })
  } catch (error) {
    console.error('Error fetching exam:', error)
    return NextResponse.json({ error: 'Failed to fetch exam' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id } = await params
    const examId = id

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check ownership
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('created_by')
      .eq('id', examId)
      .single()

    if (examError || !exam || exam.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update exam
    const { data: updatedExam, error: updateError } = await supabase
      .from('exams')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', examId)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    return NextResponse.json(updatedExam)
  } catch (error) {
    console.error('Error updating exam:', error)
    return NextResponse.json({ error: 'Failed to update exam' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params
    const examId = id

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check ownership
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('created_by')
      .eq('id', examId)
      .single()

    if (examError || !exam || exam.created_by !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete questions first
    const { error: deleteQuestionsError } = await supabase
      .from('questions')
      .delete()
      .eq('exam_id', examId)

    if (deleteQuestionsError) {
      console.error('Error deleting questions:', deleteQuestionsError)
    }

    // Delete exam sessions
    const { error: deleteSessionsError } = await supabase
      .from('exam_sessions')
      .delete()
      .eq('exam_id', examId)

    if (deleteSessionsError) {
      console.error('Error deleting sessions:', deleteSessionsError)
    }

    // Delete exam
    const { error: deleteError } = await supabase
      .from('exams')
      .delete()
      .eq('id', examId)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting exam:', error)
    return NextResponse.json({ error: 'Failed to delete exam' }, { status: 500 })
  }
}

