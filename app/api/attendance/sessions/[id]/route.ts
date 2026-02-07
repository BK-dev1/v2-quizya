import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'
import { createQRData, createCheckInURL } from '@/lib/utils/qr-generator'
import { hasSessionAutoClosed } from '@/lib/utils/session'

// GET /api/attendance/sessions/[id] - Get session details with QR code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createServiceRoleClient()
    const { id: sessionId } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user owns this session by fetching it first (light query)
    const { data: session, error: sessionFetchError } = await supabaseAdmin
      .from('attendance_sessions')
      .select(`
        id, module_name, section_group, started_at, ended_at, is_active,
        qr_refresh_interval, location_lat, location_lng, max_distance_meters,
        week, section_num, auto_close_duration_minutes, teacher_id
      `)
      .eq('id', sessionId)
      .single()

    if (sessionFetchError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (session.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Fetch records separately to optimize performance (limit to latest 200)
    // Also get total count
    const { data: records, count: totalCount, error: recordsError } = await supabaseAdmin
      .from('attendance_records')
      .select('*', { count: 'exact' })
      .eq('session_id', sessionId)
      .order('check_in_time', { ascending: false })
      .limit(200)

    // Construct session object with records
    const sessionWithRecords = {
      ...session,
      attendance_records: records || [],
      total_records: totalCount || 0
    }

    // Check if session should be auto-closed
    let sessionData = { ...sessionWithRecords }
    if (sessionData.is_active && hasSessionAutoClosed(sessionData.started_at, sessionData.auto_close_duration_minutes)) {
      // Session should be auto-closed
      const { error: updateError } = await supabaseAdmin
        .from('attendance_sessions')
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq('id', sessionId)

      if (!updateError) {
        sessionData.is_active = false
        sessionData.ended_at = new Date().toISOString()
      }
    }

    // Generate QR code if session is active
    let qrCode = null
    let qrData = null
    let scanUrl = null
    const refreshIntervalSeconds = 60

    if (sessionData.is_active) {
      // Use environment variable for base URL, fallback to request URL if not set
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
      // Generate stateless signed token using service role key
      // This eliminates database writes and reads for token management
      qrData = createQRData(sessionId, refreshIntervalSeconds)

      scanUrl = createCheckInURL(baseUrl, sessionId, qrData.token)
      // Note: qrCode generation moved to client-side for performance
    }

    return NextResponse.json({
      session: {
        ...sessionData,
        qr_refresh_interval: refreshIntervalSeconds
      },
      qrCode,
      qrData,
      scanUrl
    })
  } catch (error) {
    console.error('Error fetching attendance session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/attendance/sessions/[id] - Update session
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createServiceRoleClient()
    const { id: sessionId } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership using service role client (faster)
    const { data: existingSession, error: fetchError } = await supabaseAdmin
      .from('attendance_sessions')
      .select('teacher_id')
      .eq('id', sessionId)
      .single()

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (existingSession.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()

    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from('attendance_sessions')
      .update(body)
      .eq('id', sessionId)
      .select()
      .single()

    if (updateError || !updatedSession) {
      console.error('Error updating session:', updateError)
      return NextResponse.json(
        { error: 'Failed to update session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ session: updatedSession })
  } catch (error) {
    console.error('Error updating attendance session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/attendance/sessions/[id] - Delete session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const supabaseAdmin = createServiceRoleClient()
    const { id: sessionId } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership using service role client (faster)
    const { data: existingSession, error: fetchError } = await supabaseAdmin
      .from('attendance_sessions')
      .select('teacher_id')
      .eq('id', sessionId)
      .single()

    if (fetchError || !existingSession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (existingSession.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const { error: deleteError } = await supabaseAdmin
      .from('attendance_sessions')
      .delete()
      .eq('id', sessionId)

    if (deleteError) {
      console.error('Error deleting session:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attendance session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
