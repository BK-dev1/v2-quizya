import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/attendance/sessions
 * Fetch all attendance sessions for the current teacher with attendance counts
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can view attendance sessions' }, { status: 403 })
    }

    // Fetch sessions with attendance count
    // Using 'as any' because attendance tables aren't in generated Supabase types yet
    const { data: sessions, error: sessionsError } = await (supabase as any)
      .from('attendance_sessions')
      .select(`
        id,
        session_name,
        session_code,
        teacher_latitude,
        teacher_longitude,
        geofence_radius_meters,
        expires_at,
        is_active,
        created_at,
        geofencing_enabled,
        module_name,
        section_name,
        totp_secret,
        attendance_logs(count)
      `)
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (sessionsError) {
      console.error('Error fetching sessions:', sessionsError)
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    // Transform the data to include attendance count
    const transformedSessions = sessions?.map((session: any) => ({
      ...session,
      attendanceCount: session.attendance_logs?.[0]?.count || 0,
      attendance_logs: undefined // Remove the nested object
    }))

    return NextResponse.json({ sessions: transformedSessions })
  } catch (error) {
    console.error('Error in GET /api/attendance/sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
