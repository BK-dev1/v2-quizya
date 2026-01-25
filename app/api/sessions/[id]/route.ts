import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id } = await params

    // Get exam session
    const { data: session, error: sessionError } = await supabase
      .from('exam_sessions')
      .select(`
        *,
        exam:exams (*)
      `)
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    return NextResponse.json(session)
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json({ error: 'Failed to fetch session' }, { status: 500 })
  }
}

// Import submitExamSession
import { submitExamSession } from '@/lib/services/exam-sessions'
import { createNotificationIfEnabled } from '@/lib/services/notifications'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const body = await request.json()
    const { id } = await params

    // If submitting the exam, use the secure service
    if (body.status === 'completed') {
      // Pass answers to the service for server-side grading
      // We expect body.answers to be in the format required by submitExamSession
      // Note: submitExamSession expects StudentAnswer[], but body.answers might be Record<string, string>
      // The frontend currently sends an array of StudentAnswer objects, which matches.

      try {
        const result = await submitExamSession(id, body.answers)

        if (!result) {
          return NextResponse.json({ error: 'Failed to submit exam' }, { status: 500 })
        }

        // Get session and exam details for notification
        const { data: sessionDetails } = await supabase
          .from('exam_sessions')
          .select(`
            *,
            exam:exams (
              id,
              title,
              created_by
            )
          `)
          .eq('id', id)
          .single()

        if (sessionDetails && sessionDetails.exam && sessionDetails.exam.created_by) {
          const studentName = sessionDetails.guest_name || 'A student'
          const scoreDisplay = result.score !== null ? `Score: ${result.score}/${result.total_points}` : ''

          // Send notification to exam creator
          await createNotificationIfEnabled(
            sessionDetails.exam.created_by,
            'exam_submission',
            `${studentName} submitted the exam`,
            `${studentName} has completed "${sessionDetails.exam.title}". ${scoreDisplay}`,
            {
              student_name: studentName,
              student_email: sessionDetails.guest_email,
              exam_title: sessionDetails.exam.title,
              session_id: id,
              score: result.score,
              total_points: result.total_points
            },
            sessionDetails.exam.id
          )
        }

        return NextResponse.json(result)
      } catch (error: any) {
        if (error.message === 'Time limit exceeded') {
          return NextResponse.json({ error: 'Time limit exceeded. Your submission was too late.' }, { status: 403 })
        }
        throw error // Rethrow to be caught by outer catch
      }
    }

    // For other updates (e.g. auto-save), prevent updating sensitive fields
    const { score, total_points, ...safeBody } = body

    // Also prevent setting status to completed directly without validation
    if (safeBody.status === 'completed') {
      delete safeBody.status
    }

    const { data, error } = await supabase
      .from('exam_sessions')
      .update(safeBody)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
  }
}
