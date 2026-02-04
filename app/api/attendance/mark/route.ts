/**
 * MARK ATTENDANCE ENDPOINT
 * 
 * POST /api/attendance/mark
 * 
 * Student-facing endpoint to mark attendance after successful verification
 * 
 * Security Features:
 * - Device fingerprinting (prevents multiple submissions)
 * - Rate limiting (prevents rapid repeated attempts)
 * - Duplicate submission prevention
 * - Geofencing re-validation
 * - TOTP re-verification
 * 
 * Request Body:
 * {
 *   sessionCode: string,
 *   qrPayload: string,
 *   studentLatitude: number,
 *   studentLongitude: number,
 *   deviceFingerprint: string (hashed on client),
 *   userAgent: string,
 *   screenResolution?: string,
 *   timezone?: string
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   attendanceId?: string,
 *   markedAt?: string (ISO timestamp),
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyQRPayload, validateGeofence, generateDeviceFingerprint } from '@/lib/utils/attendance-crypto'
import { 
  getCachedAttendanceSession, 
  getCachedTOTPSecret,
  checkAttendanceRateLimit,
  isDeviceUsed,
  markDeviceUsed
} from '@/lib/utils/redis-cache'

export async function POST(request: NextRequest) {
  try {
    console.log('[Attendance] Mark request received')
    const supabase = await createClient()

    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[Attendance] User unauthorized', authError)
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
      console.log('[Attendance] User is not a student', profile?.role)
      return NextResponse.json(
        { error: 'Only students can mark attendance' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      sessionCode,
      qrPayload,
      studentLatitude,
      studentLongitude,
      deviceFingerprint: clientFingerprint,
      userAgent,
      screenResolution,
      timezone
    } = body
    
    console.log('[Attendance] Processing for session:', sessionCode)

    // Validate required fields
    if (!sessionCode || !qrPayload || typeof studentLatitude !== 'number' || typeof studentLongitude !== 'number') {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Rate limiting check
    const rateLimitExceeded = await checkAttendanceRateLimit(user.id, sessionCode, 60)
    if (rateLimitExceeded) {
      console.log('[Attendance] Rate limit exceeded for user:', user.id)
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before trying again.' },
        { status: 429 }
      )
    }

    // Generate device fingerprint on server side for validation
    const serverDeviceFingerprint = generateDeviceFingerprint(
      userAgent || request.headers.get('user-agent') || 'unknown',
      undefined, // Device memory (not available server-side)
      screenResolution,
      timezone
    )

    // Use client fingerprint if provided, otherwise use server-generated
    const deviceFingerprint = clientFingerprint || serverDeviceFingerprint

    // Check if device has already been used for this session
    const deviceAlreadyUsed = await isDeviceUsed(deviceFingerprint, sessionCode)
    if (deviceAlreadyUsed) {
      console.warn('[Attendance] Device already used:', deviceFingerprint)
      // Note: We might want to allow this for debugging if needed, but strictly it prevents cheating
      return NextResponse.json(
        { error: 'This device has already been used to mark attendance for this session' },
        { status: 409 }
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
        console.error('[Attendance] Session lookup failed:', sessionCode, sessionError)
        return NextResponse.json(
          { error: 'Invalid session code' },
          { status: 404 }
        )
      }

      // Check if session is active and not expired
      if (!dbSession.is_active || new Date(dbSession.expires_at) < new Date()) {
         console.log('[Attendance] Session expired or inactive')
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

    // Check if student has already marked attendance for this session (using session ID now)
    const { data: existingAttendance } = await (supabase as any)
      .from('attendance_logs')
      .select('id')
      .eq('student_id', user.id)
      .eq('session_id', sessionData.sessionId)
      .single() as any

    if (existingAttendance) {
      console.log('[Attendance] Duplicate attendance for user:', user.id)
      return NextResponse.json(
        { error: 'You have already marked attendance for this session' },
        { status: 409 }
      )
    }

    // Get TOTP secret
    let totpSecret = await getCachedTOTPSecret(sessionCode)
    if (!totpSecret) {
      totpSecret = sessionData.totpSecret
    }

    if (!totpSecret) {
      console.error('[Attendance] TOTP secret missing for session:', sessionCode)
      return NextResponse.json(
        { error: 'TOTP secret not found' },
        { status: 500 }
      )
    }

    // Re-verify QR payload (signature, timestamp, TOTP)
    const verification = verifyQRPayload(qrPayload, sessionData.teacherId, totpSecret)
    
    if (!verification.isValid) {
      console.warn('[Attendance] Invalid QR payload:', verification.error)
      return NextResponse.json(
        { error: verification.error || 'Invalid QR code' },
        { status: 400 }
      )
    }

    // Re-validate geofencing if enabled
    let distance = null
    if (sessionData.geofencingEnabled) {
      if (typeof studentLatitude !== 'number' || typeof studentLongitude !== 'number') {
        return NextResponse.json(
          { error: 'Location required for this session' },
          { status: 400 }
        )
      }

      const geofenceResult = validateGeofence(
        sessionData.teacherLat!,
        sessionData.teacherLon!,
        studentLatitude,
        studentLongitude,
        sessionData.radius
      )

      if (!geofenceResult.isValid) {
        console.log('[Attendance] Geofence failed. Distance:', geofenceResult.distance, 'Max:', sessionData.radius)
        return NextResponse.json(
          { 
            error: `Location verification failed. You are ${Math.round(geofenceResult.distance)}m away. Must be within ${sessionData.radius}m.`,
            distance: geofenceResult.distance,
            maxDistance: sessionData.radius
          },
          { status: 400 }
        )
      }
      distance = geofenceResult.distance
    }

    // Extract TOTP code from payload
    const parsedPayload = JSON.parse(qrPayload)
    const totpCode = parsedPayload.totpCode

    console.log('[Attendance] Validation successful. Persisting to DB...')

    // Mark attendance in database
    const { data: attendanceLog, error: insertError } = await (supabase as any)
      .from('attendance_logs')
      .insert({
        session_id: sessionData.sessionId,
        student_id: user.id,
        device_fingerprint: deviceFingerprint,
        student_latitude: studentLatitude,
        student_longitude: studentLongitude,
        distance_meters: distance,
        totp_code: totpCode,
        marked_at: new Date().toISOString()
      } as any)
      .select()
      .single() as any

    if (insertError) {
      console.error('Database insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to mark attendance' },
        { status: 500 }
      )
    }
    
    console.log('[Attendance] Successfully marked:', attendanceLog.id)

    // Register device fingerprint in registry
    await (supabase as any)
      .from('device_registry')
      .upsert({
        device_fingerprint: deviceFingerprint,
        user_id: user.id,
        user_agent: userAgent || request.headers.get('user-agent'),
        last_seen_at: new Date().toISOString()
      } as any, {
        onConflict: 'device_fingerprint',
        ignoreDuplicates: false
      })

    // Mark device as used for this session in Redis
    await markDeviceUsed(deviceFingerprint, sessionCode, 24 * 60 * 60)

    // Log successful geofence validation
    await (supabase as any)
      .from('geofence_validations')
      .insert({
        attendance_log_id: attendanceLog.id,
        session_id: sessionData.sessionId,
        student_id: user.id,
        is_valid: true,
        distance_meters: distance,
        validation_reason: sessionData.geofencingEnabled 
          ? 'Attendance marked successfully within geofence'
          : 'Attendance marked successfully (geofencing disabled)',
        validated_at: new Date().toISOString()
      } as any)

    return NextResponse.json({
      success: true,
      attendanceId: attendanceLog.id,
      markedAt: attendanceLog.marked_at,
      distance: distance,
      message: 'Attendance marked successfully!'
    })

  } catch (error) {
    console.error('Mark attendance error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
