import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { verifyLocation } from '@/lib/utils/location'
import { isValidEmail, sanitizeString, isValidStudentName } from '@/lib/utils/validation'
import { hasSessionAutoClosed } from '@/lib/utils/session'
import { verifySignedToken } from '@/lib/utils/qr-generator'

// Rate limiting map (in-memory)
// PRODUCTION NOTE: This in-memory storage will NOT work correctly in:
// - Multi-instance deployments (load-balanced servers)
// - Serverless environments (Vercel, AWS Lambda, etc.)
// For production, use Redis or a similar distributed storage solution
const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT_WINDOW = 60000 // 1 minute
const MAX_REQUESTS = 5 // 5 requests per minute
const CLEANUP_INTERVAL = 300000 // Clean up every 5 minutes

// Periodic cleanup to prevent memory leaks
let lastCleanup = Date.now()

function cleanupRateLimitMap() {
  const now = Date.now()

  // Only cleanup if CLEANUP_INTERVAL has passed
  if (now - lastCleanup < CLEANUP_INTERVAL) {
    return
  }

  lastCleanup = now

  // Remove expired entries
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const recentTimestamps = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW)

    if (recentTimestamps.length === 0) {
      rateLimitMap.delete(ip)
    } else {
      rateLimitMap.set(ip, recentTimestamps)
    }
  }
}

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

  // Trigger periodic cleanup
  cleanupRateLimitMap()

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

    // Sanitize and validate student name
    const sanitizedName = sanitizeString(studentName, 100)
    if (!isValidStudentName(sanitizedName)) {
      return NextResponse.json(
        { error: 'Student name must be between 2 and 100 characters' },
        { status: 400 }
      )
    }

    // Validate email format if provided
    const sanitizedEmail = studentEmail ? sanitizeString(studentEmail, 255) : null
    if (sanitizedEmail && !isValidEmail(sanitizedEmail)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Use service role client for all operations (students are not authenticated)
    // This bypasses RLS which is safe here because:
    // - Token is validated first (expires after 60s)
    // - Rate limiting prevents abuse  
    // - Only minimal data is read, and inserts are protected by DB constraints
    const supabase = createServiceRoleClient()
    const now = new Date().toISOString()

    // Run operations sequentially to fail fast and debug performance
    const t0 = Date.now()

    // 1. Validate Token (Stateless Check)
    // Use service role key as secret (must match generation)
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default-secret'
    const isValidToken = verifySignedToken(token, sessionId, secret, 120000) // 2 minutes window

    const t1 = Date.now()
    console.log(`[CheckIn] Token verification (stateless) took ${t1 - t0}ms`)

    if (!isValidToken) {
      return NextResponse.json(
        { error: 'Invalid or expired QR code. Please scan again.' },
        { status: 400 }
      )
    }

    // 2. Fetch Session Details
    const { data: session, error: sessionError } = await supabase
      .from('attendance_sessions')
      .select('id,is_active,location_lat,location_lng,max_distance_meters,started_at,auto_close_duration_minutes')
      .eq('id', sessionId)
      .single()

    const t2 = Date.now()
    console.log(`[CheckIn] Session fetch took ${t2 - t1}ms`)



    if (sessionError || !session) {
      console.error('Session fetch failed:', sessionError)
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

    // Check if session has auto-closed
    if (hasSessionAutoClosed(session.started_at, session.auto_close_duration_minutes)) {
      return NextResponse.json(
        { error: 'This attendance session has ended' },
        { status: 400 }
      )
    }

    // Verify location only if teacher has set a location requirement
    if (session.location_lat && session.location_lng) {
      // Teacher requires location verification
      if (!locationLat || !locationLng) {
        return NextResponse.json(
          { error: 'Location is required for this session. Please enable location services.' },
          { status: 400 }
        )
      }

      const maxDistance = session.max_distance_meters || 100
      const locationCheck = verifyLocation(
        session.location_lat,
        session.location_lng,
        locationLat,
        locationLng,
        maxDistance
      )

      if (!locationCheck.isValid) {
        console.log('Location verification failed:', {
          distance: locationCheck.distance,
          maxDistance,
          teacherCoords: `${session.location_lat}, ${session.location_lng}`,
          studentCoords: `${locationLat}, ${locationLng}`
        })

        return NextResponse.json(
          {
            error: locationCheck.message || 'You are too far from the attendance location',
            distance: locationCheck.distance,
            maxDistance
          },
          { status: 400 }
        )
      }
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || undefined

    // Insert attendance record - UNIQUE constraint catches duplicates
    const { error: insertError } = await supabase
      .from('attendance_records')
      .insert({
        session_id: sessionId,
        student_name: sanitizedName,
        student_email: sanitizedEmail,
        location_lat: locationLat || null,
        location_lng: locationLng || null,
        ip_address: ip,
        user_agent: userAgent
      })

    if (insertError) {
      // Unique constraint violation = duplicate check-in
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'You have already checked in for this session' },
          { status: 400 }
        )
      }
      console.error('Error creating attendance record:', insertError)
      return NextResponse.json(
        { error: 'Failed to record attendance' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance recorded successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error recording attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
