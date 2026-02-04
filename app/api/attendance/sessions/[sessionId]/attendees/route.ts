import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/attendance/sessions/[sessionId]/attendees
 * Fetch all attendees for a specific session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user owns this session
    const { data: session, error: sessionError } = await (supabase as any)
      .from('attendance_sessions')
      .select('id, teacher_id, session_name')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to view this session' }, { status: 403 })
    }

    // Fetch attendees with their profile info
    const { data: attendees, error: attendeesError } = await (supabase as any)
      .from('attendance_logs')
      .select(`
        id,
        student_id,
        student_latitude,
        student_longitude,
        distance_meters,
        marked_at,
        profiles:student_id(
          full_name,
          username,
          email
        )
      `)
      .eq('session_id', sessionId)
      .order('marked_at', { ascending: true })

    if (attendeesError) {
      console.error('Error fetching attendees:', attendeesError)
      return NextResponse.json({ error: 'Failed to fetch attendees' }, { status: 500 })
    }

    // Transform the data for easier consumption
    const transformedAttendees = attendees?.map((attendee: any) => ({
      id: attendee.id,
      studentId: attendee.student_id,
      studentName: attendee.profiles?.full_name || attendee.profiles?.username || 'Unknown',
      studentEmail: attendee.profiles?.email,
      latitude: attendee.student_latitude,
      longitude: attendee.student_longitude,
      distanceMeters: attendee.distance_meters,
      markedAt: attendee.marked_at
    }))

    return NextResponse.json({ 
      session: {
        id: session.id,
        name: session.session_name
      },
      attendees: transformedAttendees 
    })
  } catch (error) {
    console.error('Error in GET /api/attendance/sessions/[sessionId]/attendees:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
