import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { addProctoringEvent } from '@/lib/services/exam-sessions'
import { createNotificationIfEnabled } from '@/lib/services/notifications'

const infractionTypeLabels: Record<string, string> = {
    'tab_switch': 'Tab switch',
    'focus_lost': 'Window focus lost',
    'fullscreen_exit': 'Fullscreen exit',
    'suspicious_activity': 'Suspicious activity'
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const body = await request.json()
        const { type, details } = body

        if (!type) {
            return NextResponse.json({ error: 'Infraction type is required' }, { status: 400 })
        }

        const success = await addProctoringEvent(id, type, details)

        if (!success) {
            return NextResponse.json({ error: 'Failed to record infraction' }, { status: 500 })
        }

        const { data: session, error: sessionError } = await supabase
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

        if (session && session.exam && session.exam.created_by) {
            const studentName = session.guest_name || 'A student'
            const infractionLabel = infractionTypeLabels[type] || type

            await createNotificationIfEnabled(
                session.exam.created_by,
                'proctoring_infraction',
                `Proctoring alert: ${infractionLabel}`,
                `${studentName} triggered a proctoring alert in "${session.exam.title}"`,
                {
                    student_name: studentName,
                    student_email: session.guest_email,
                    exam_title: session.exam.title,
                    session_id: id,
                    infraction_type: type
                },
                session.exam.id
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error recording infraction:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
