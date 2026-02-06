import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getAttendanceSession,
  createAttendanceRecord,
  checkDuplicateAttendance,
  verifyAttendanceToken
} from '@/lib/services/attendance-sessions'
import { verifyLocation } from '@/lib/utils/location'

// Rate limiting map (in-memory)
// PRODUCTION NOTE: This in-memory storage will NOT work correctly in:
// - Multi-instance deployments (load-balanced servers)
// - Serverless environments (Vercel, AWS Lambda, etc.)
// For production, use Redis or a similar distributed storage solution
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS = 5 // 5 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) || []

  // Filter out old timestamps
  const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)

  if (recentTimestamps.length >= MAX_REQUESTS) {
    return false
  }

  recentTimestamps.push(now)
  rateLimitMap.set(ip, recentTimestamps)

  return true
}

/**
 * Extract the real client IP from forwarded headers
 * Handles x-forwarded-for which may contain multiple IPs
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can contain multiple IPs (client, proxy1, proxy2, ...)
    // The first IP is the original client
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

// POST /api/attendance/check-in - Student check-in
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request)

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      sessionId,
      token,
      studentName,
      studentEmail,
      locationLat,
      locationLng
    } = body

    // Validate required fields
    if (!sessionId || !token || !studentName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify token is valid (database check)
    if (!(await verifyAttendanceToken(sessionId, token))) {
      return NextResponse.json(
        { error: 'Invalid or expired QR code. Please scan again.' },
        { status: 400 }
      )
    }

    // Get session details
    const supabase = await createClient()
    const session = await getAttendanceSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (!session.is_active) {
      return NextResponse.json(
        { error: 'This attendance session has ended' },
        { status: 400 }
      )
    }

    // Check for duplicate attendance
    const isDuplicate = await checkDuplicateAttendance(
      sessionId,
      studentName,
      studentEmail
    )

    if (isDuplicate) {
      return NextResponse.json(
        { error: 'You have already checked in for this session' },
        { status: 400 }
      )
    }

    // Verify location if provided
    if (session.location_lat && session.location_lng && locationLat && locationLng) {
      const locationCheck = verifyLocation(
        session.location_lat,
        session.location_lng,
        locationLat,
        locationLng,
        session.max_distance_meters
      )

      if (!locationCheck.isValid) {
        return NextResponse.json(
          {
            error: locationCheck.message || 'You are too far from the attendance location',
            distance: locationCheck.distance
          },
          { status: 400 }
        )
      }
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || undefined

    // Create attendance record
    const record = await createAttendanceRecord({
      session_id: sessionId,
      student_name: studentName,
      student_email: studentEmail,
      location_lat: locationLat,
      location_lng: locationLng,
      ip_address: ip,
      user_agent: userAgent
    })

    if (!record) {
      return NextResponse.json(
        { error: 'Failed to record attendance' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully',
      record
    }, { status: 201 })
  } catch (error) {
    console.error('Error recording attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
