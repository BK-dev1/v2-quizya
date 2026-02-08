import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Save a live quiz as a reusable template
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the original quiz with questions
    const { data: originalQuiz, error: quizError } = await (supabase
      .from('live_quizzes' as any)
      .select('*, questions:live_quiz_questions(*)')
      .eq('id', id)
      .eq('created_by', user.id)
      .single() as any)

    if (quizError || !originalQuiz) {
      return NextResponse.json({ error: 'Quiz not found or unauthorized' }, { status: 404 })
    }

    // Generate a unique ID for the template
    const generateId = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
      })
    }

    // Create the template (a copy of the quiz marked as template)
    const templateId = generateId()
    const { data: template, error: templateError } = await (supabase
      .from('live_quizzes' as any)
      .insert({
        id: templateId,
        title: `${originalQuiz.title} (Template)`,
        description: originalQuiz.description,
        created_by: user.id,
        quiz_code: null, // Templates don't need a code
        status: 'waiting',
        is_template: true,
        template_source_id: originalQuiz.is_template ? originalQuiz.template_source_id : originalQuiz.id,
        current_question_index: -1,
        show_results_to_students: false
      })
      .select()
      .single() as any)

    if (templateError) {
      console.error('Error creating template:', templateError)
      return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
    }

    // Copy questions to the template
    if (originalQuiz.questions && originalQuiz.questions.length > 0) {
      const templateQuestions = originalQuiz.questions.map((q: any, index: number) => ({
        id: generateId(),
        quiz_id: templateId,
        question_text: q.question_text,
        options: q.options,
        correct_options: q.correct_options,
        time_limit_seconds: q.time_limit_seconds,
        points: q.points,
        order_index: index,
        state: 'hidden'
      }))

      const { error: questionsError } = await (supabase
        .from('live_quiz_questions' as any)
        .insert(templateQuestions) as any)

      if (questionsError) {
        console.error('Error copying questions:', questionsError)
        // Clean up the template if questions failed
        await (supabase.from('live_quizzes' as any).delete().eq('id', templateId) as any)
        return NextResponse.json({ error: 'Failed to copy questions' }, { status: 500 })
      }
    }

    return NextResponse.json({ 
      success: true, 
      template_id: templateId,
      message: 'Quiz saved as template successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/live-quiz/[id]/save-template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
