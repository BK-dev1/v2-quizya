import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { addProctoringEvent } from '@/lib/services/exam-sessions'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
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

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error recording infraction:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
