import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

// GET /api/attendance/sessions - List teacher's attendance sessions
export async function GET() {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createServiceRoleClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get teacher's sessions using service role client (faster)
    const { data: sessions, error } = await supabaseAdmin
      .from('attendance_sessions')
      .select('*')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching sessions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      )
    }

    return NextResponse.json({ sessions: sessions || [] })
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
    const supabaseAdmin = createServiceRoleClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a teacher
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile || profile.role !== 'teacher') {
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
      qr_refresh_interval,
      week,
      section_num,
      auto_close_duration_minutes
    } = body

    // Validate required fields
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    // Create session
    const { data: session, error: insertError } = await supabaseAdmin
      .from('attendance_sessions')
      .insert({
        title,
        description,
        teacher_id: user.id,
        module_name,
        section_group,
        location_lat,
        location_lng,
        max_distance_meters: max_distance_meters || 100,
        qr_refresh_interval: qr_refresh_interval || 60,
        week: week || null,
        section_num: section_num || null,
        auto_close_duration_minutes: auto_close_duration_minutes || 0,
        is_active: true
      })
      .select()
      .single()

    if (insertError || !session) {
      console.error('Error creating session:', insertError)
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
