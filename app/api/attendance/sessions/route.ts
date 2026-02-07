import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createAttendanceSession,
  getTeacherAttendanceSessions
} from '@/lib/services/attendance-sessions'

// GET /api/attendance/sessions - List teacher's attendance sessions
export async function GET() {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get teacher's sessions
    const sessions = await getTeacherAttendanceSessions(user.id)

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error('Error fetching attendance sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/attendance/sessions - Create new attendance session
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a teacher
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can create attendance sessions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      title,
      description,
      module_name,
      section_group,
      location_lat,
      location_lng,
      max_distance_meters,
      qr_refresh_interval
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create session
    const session = await createAttendanceSession({
      title,
      description,
      teacher_id: user.id,
      module_name,
      section_group,
      location_lat,
      location_lng,
      max_distance_meters: max_distance_meters || 50,
      qr_refresh_interval: qr_refresh_interval || 60,
      is_active: true
    })

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create attendance session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ session }, { status: 201 })
  } catch (error) {
    console.error('Error creating attendance session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
