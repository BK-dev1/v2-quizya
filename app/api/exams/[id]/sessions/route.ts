import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check if user is the creator of the exam (optional but good for security)
        // RLS policies should handle this actually (Teachers can view sessions for *their* exams) 
        // but explicit check is safer if we want to fail fast.

        // We already have RLS policy: "Teachers can view sessions for their exams" which relies on 
        // EXISTS (SELECT 1 FROM exams WHERE exams.id = exam_sessions.exam_id AND exams.created_by = auth.uid())
        // So simple select should work and be secure.

        const { data: sessions, error } = await supabase
            .from('exam_sessions')
            .select('*')
            .eq('exam_id', id)
            .order('created_at', { ascending: false })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        return NextResponse.json(sessions)
    } catch (error) {
        console.error('Error fetching exam sessions:', error)
        return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }
}
