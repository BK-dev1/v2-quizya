/**
 * ATTENDANCE VERIFICATION ENDPOINT
 * 
 * POST /api/attendance/verify
 * 
 * Student-facing endpoint for verifying QR code and geofencing before marking attendance
 * 
 * Security Features:
 * - TOTP verification (15-second rotation)
 * - HMAC signature verification
 * - Geofencing validation (Haversine formula)
 * - QR code freshness check (max 30 seconds old)
 * 
 * Request Body:
 * {
 *   qrPayload: string (JSON from scanned QR),
 *   studentLatitude: number,
 *   studentLongitude: number
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   sessionCode?: string,
 *   distance?: number,
 *   withinGeofence?: boolean,
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyQRPayload, validateGeofence } from '@/lib/utils/attendance-crypto'
import { getCachedAttendanceSession, getCachedTOTPSecret } from '@/lib/utils/redis-cache'

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

    // Verify user is a student
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || profile?.role !== 'student') {
      return NextResponse.json(
        { error: 'Only students can verify attendance QR codes' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { qrPayload, studentLatitude, studentLongitude } = body

    // Validate required fields
    if (!qrPayload || typeof studentLatitude !== 'number' || typeof studentLongitude !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields: qrPayload, studentLatitude, studentLongitude' },
        { status: 400 }
      )
    }

    // Validate coordinates
    if (studentLatitude < -90 || studentLatitude > 90 || studentLongitude < -180 || studentLongitude > 180) {
      return NextResponse.json(
        { error: 'Invalid coordinates' },
        { status: 400 }
      )
    }

    // Parse QR payload
    let parsedPayload
    try {
      parsedPayload = JSON.parse(qrPayload)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid QR code format' },
        { status: 400 }
      )
    }

    const { sessionCode } = parsedPayload

    if (!sessionCode) {
      return NextResponse.json(
        { error: 'Invalid QR code: missing session code' },
        { status: 400 }
      )
    }

    // Try to get session from cache first
    let sessionData = await getCachedAttendanceSession(sessionCode)
    
    // If not in cache, fetch from database
    if (!sessionData) {
      const { data: dbSession, error: sessionError } = await (supabase as any)
        .from('attendance_sessions')
        .select('*')
        .eq('session_code', sessionCode)
        .single() as any

      if (sessionError || !dbSession) {
        return NextResponse.json(
          { error: 'Invalid session code' },
          { status: 404 }
        )
      }

      // Check if session is active and not expired
      if (!dbSession.is_active || new Date(dbSession.expires_at) < new Date()) {
        return NextResponse.json(
          { error: 'Session is expired or inactive' },
          { status: 400 }
        )
      }

      sessionData = {
        sessionId: dbSession.id,
        teacherId: dbSession.teacher_id,
        teacherLat: dbSession.teacher_latitude ? parseFloat(dbSession.teacher_latitude) : null,
        teacherLon: dbSession.teacher_longitude ? parseFloat(dbSession.teacher_longitude) : null,
        radius: dbSession.geofence_radius_meters,
        totpSecret: dbSession.totp_secret,
        expiresAt: dbSession.expires_at,
        geofencingEnabled: dbSession.geofencing_enabled ?? true
      }
    }

    // Get TOTP secret (try cache first, then use session data)
    let totpSecret = await getCachedTOTPSecret(sessionCode)
    if (!totpSecret) {
      totpSecret = sessionData.totpSecret
    }

    if (!totpSecret) {
      return NextResponse.json(
        { error: 'TOTP secret not found' },
        { status: 500 }
      )
    }

    // Verify QR payload (signature, timestamp, TOTP)
    const verification = verifyQRPayload(qrPayload, sessionData.teacherId, totpSecret)
    
    if (!verification.isValid) {
      return NextResponse.json(
        { error: verification.error || 'Invalid QR code' },
        { status: 400 }
      )
    }

    // Validate geofencing if enabled
    let distance = null
    let isValid = true
    if (sessionData.geofencingEnabled) {
      const geofenceResult = validateGeofence(
        sessionData.teacherLat!,
        sessionData.teacherLon!,
        studentLatitude,
        studentLongitude,
        sessionData.radius
      )
      distance = geofenceResult.distance
      isValid = geofenceResult.isValid
    }

    // Log geofence validation
    await (supabase as any)
      .from('geofence_validations')
      .insert({
        session_id: sessionData.sessionId,
        student_id: user.id,
        is_valid: isValid,
        distance_meters: distance,
        validation_reason: !sessionData.geofencingEnabled
          ? 'Geofencing disabled for this session'
          : isValid 
            ? 'Within geofence radius' 
            : `Outside geofence radius (${distance}m > ${sessionData.radius}m)`
      } as any)

    return NextResponse.json({
      success: true,
      sessionCode,
      sessionId: sessionData.sessionId,
      distance: distance,
      withinGeofence: isValid,
      maxDistance: sessionData.radius,
      message: isValid 
        ? 'QR code and location verified successfully' 
        : `You are ${distance}m away. Must be within ${sessionData.radius}m to mark attendance.`
    })

  } catch (error) {
    console.error('Verify attendance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
