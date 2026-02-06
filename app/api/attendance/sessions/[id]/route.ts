import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAttendanceSession,
  getAttendanceSessionWithRecords,
  updateAttendanceSession,
  deleteAttendanceSession
} from '@/lib/services/attendance-sessions'
import { generateQRCode, createQRData, storeToken } from '@/lib/utils/qr-generator'

// GET /api/attendance/sessions/[id] - Get session details with QR code
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: sessionId } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get session with records
    const session = await getAttendanceSessionWithRecords(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify user owns this session
    if (session.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Generate QR code if session is active
    let qrCode = null
    let qrData = null

    if (session.is_active) {
      qrData = createQRData(sessionId, session.qr_refresh_interval)
      qrCode = await generateQRCode(qrData)

      // Store token for validation
      storeToken(sessionId, qrData.token, session.qr_refresh_interval * 1000)
    }

    return NextResponse.json({
      session,
      qrCode,
      qrData
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
    const { id: sessionId } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership
    const existingSession = await getAttendanceSession(sessionId)

    if (!existingSession) {
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
    const updatedSession = await updateAttendanceSession(sessionId, body)

    if (!updatedSession) {
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
    const { id: sessionId } = await params

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify ownership
    const existingSession = await getAttendanceSession(sessionId)

    if (!existingSession) {
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

    const success = await deleteAttendanceSession(sessionId)

    if (!success) {
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
