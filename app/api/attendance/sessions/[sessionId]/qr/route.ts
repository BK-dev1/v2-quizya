import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateQRPayload } from '@/lib/utils/attendance-crypto'
import QRCode from 'qrcode'

/**
 * GET /api/attendance/sessions/[sessionId]/qr
 * Generate a fresh QR code for an existing active session
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

    // Fetch session details
    const { data: session, error: sessionError } = await (supabase as any)
      .from('attendance_sessions')
      .select('id, teacher_id, session_code, totp_secret, expires_at, is_active, geofencing_enabled')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    if (session.teacher_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if expired
    if (!session.is_active || new Date(session.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Session has expired' }, { status: 410 })
    }

    // Generate fresh QR payload
    const qrPayload = generateQRPayload(session.session_code, user.id, session.totp_secret)
    
    // Create direct attendance link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (request.headers.get('host') ? `${request.nextUrl.protocol}//${request.headers.get('host')}` : '')
    const attendanceLink = `${baseUrl}/attendance/mark?p=${Buffer.from(qrPayload).toString('base64')}`

    // Generate QR code as base64 data URL
    const qrDataUrl = await QRCode.toDataURL(attendanceLink, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2
    })

    return NextResponse.json({ 
      qrDataUrl,
      sessionCode: session.session_code,
      expiresAt: session.expires_at,
      geofencingEnabled: session.geofencing_enabled
    })
  } catch (error) {
    console.error('Error generating QR for existing session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
