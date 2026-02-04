/**
 * ATTENDANCE QR CODE GENERATION ENDPOINT
 * 
 * POST /api/attendance/generate-qr
 * 
 * Teacher-facing endpoint to generate Time-based One-Time Password (TOTP) QR codes
 * QR codes rotate every 15 seconds and are cryptographically signed
 * 
 * Security Features:
 * - HMAC-SHA256 signing of QR data
 * - TOTP with 15-second rotation
 * - Teacher coordinates binding for geofencing
 * - Session-based access control
 * 
 * Request Body:
 * {
 *   sessionName: string,
 *   latitude: number,
 *   longitude: number,
 *   radius?: number (default: 50 meters),
 *   durationMinutes?: number (default: 60)
 * }
 * 
 * Response:
 * {
 *   sessionCode: string,
 *   qrDataUrl: string (base64 QR code image),
 *   expiresAt: string (ISO timestamp),
 *   totpSecret: string (for development/debugging only)
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateTOTPSecret, generateQRPayload } from '@/lib/utils/attendance-crypto'
import { cacheAttendanceSession, cacheTOTPSecret } from '@/lib/utils/redis-cache'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify user is a teacher
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Only teachers can generate attendance QR codes' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      sessionName,
      latitude,
      longitude,
      radius = 50,
      durationMinutes = 60,
      geofencingEnabled = true,
      moduleName,
      sectionName
    } = body

    // Validate required fields
    if (!sessionName) {
      return NextResponse.json(
        { error: 'Missing session name' },
        { status: 400 }
      )
    }

    if (geofencingEnabled && (typeof latitude !== 'number' || typeof longitude !== 'number')) {
      return NextResponse.json(
        { error: 'Position required when geofencing is enabled' },
        { status: 400 }
      )
    }

    // Validate coordinates
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    // Generate TOTP secret
    const totpSecret = generateTOTPSecret()
    
    // Generate unique session code (8 characters)
    const sessionCode = generateSessionCode()
    
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000)

    // Insert attendance session into database
    const { data: session, error: insertError } = await (supabase as any)
      .from('attendance_sessions')
      .insert({
        teacher_id: user.id,
        session_name: sessionName,
        session_code: sessionCode,
        totp_secret: totpSecret,
        teacher_latitude: geofencingEnabled ? latitude : null,
        teacher_longitude: geofencingEnabled ? longitude : null,
        geofence_radius_meters: radius,
        expires_at: expiresAt.toISOString(),
        is_active: true,
        geofencing_enabled: geofencingEnabled,
        module_name: moduleName,
        section_name: sectionName
      })
      .select()
      .single() as any

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create attendance session' },
        { status: 500 }
      )
    }

    // Cache session data in Redis for fast lookups
    await cacheAttendanceSession(sessionCode, {
      sessionId: session.id,
      teacherId: user.id,
      teacherLat: latitude,
      teacherLon: longitude,
      radius,
      totpSecret,
      expiresAt: expiresAt.toISOString()
    }, durationMinutes * 60)

    // Cache TOTP secret separately
    await cacheTOTPSecret(sessionCode, totpSecret, durationMinutes * 60)

    // Generate QR code payload
    const qrPayload = generateQRPayload(sessionCode, user.id, totpSecret)
    
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
      success: true,
      sessionCode,
      sessionId: session.id,
      qrDataUrl,
      expiresAt: expiresAt.toISOString(),
      totpSecret,
      geofencingEnabled: session.geofencing_enabled
    })

  } catch (error) {
    console.error('Generate QR error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Generate a unique 8-character session code
 */
function generateSessionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
