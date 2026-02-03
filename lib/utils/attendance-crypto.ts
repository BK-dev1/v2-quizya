/**
 * ATTENDANCE SYSTEM CRYPTOGRAPHIC UTILITIES
 * 
 * This module provides cryptographic functions for the Hard-to-Break Attendance System:
 * - TOTP (Time-based One-Time Password) generation and verification
 * - HMAC-SHA256 signing for secure QR code data
 * - Device fingerprinting for preventing duplicate submissions
 * 
 * SECURITY MECHANISMS:
 * 1. TOTP rotates every 15 seconds (configurable window)
 * 2. HMAC ensures QR data integrity and binds to teacher session
 * 3. Device fingerprints are hashed using SHA-256 for privacy
 */

import { generate, verify, generateSecret } from 'otplib'
import { createHmac, createHash } from 'crypto'

/**
 * Generate a new TOTP secret for an attendance session
 * @returns Base32 encoded secret string
 */
export function generateTOTPSecret(): string {
  return generateSecret()
}

/**
 * Generate current TOTP code from a secret
 * @param secret - The TOTP secret (base32 encoded)
 * @returns 6-digit TOTP code
 */
export function generateTOTPCode(secret: string): string {
  return generate(secret, { step: 15 })
}

/**
 * Verify a TOTP code against a secret
 * @param code - The 6-digit code to verify
 * @param secret - The TOTP secret (base32 encoded)
 * @returns true if valid, false otherwise
 */
export function verifyTOTPCode(code: string, secret: string): boolean {
  try {
    return verify({ token: code, secret, step: 15, window: 1 })
  } catch (error) {
    console.error('TOTP verification error:', error)
    return false
  }
}

/**
 * Generate HMAC-SHA256 signature for QR code data
 * Binds QR data (Teacher ID + Timestamp + Session Code) to prevent tampering
 * 
 * @param data - Data to sign (e.g., "teacherId|timestamp|sessionCode")
 * @param secret - Signing secret (should be session-specific)
 * @returns Hex-encoded HMAC signature
 */
export function signQRData(data: string, secret: string): string {
  const hmac = createHmac('sha256', secret)
  hmac.update(data)
  return hmac.digest('hex')
}

/**
 * Verify HMAC-SHA256 signature for QR code data
 * 
 * @param data - Original data that was signed
 * @param signature - The signature to verify
 * @param secret - Signing secret
 * @returns true if signature is valid, false otherwise
 */
export function verifyQRSignature(data: string, signature: string, secret: string): boolean {
  const expectedSignature = signQRData(data, secret)
  // Use constant-time comparison to prevent timing attacks
  return timingSafeEqual(signature, expectedSignature)
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  
  let result = 0
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i)
  }
  return result === 0
}

/**
 * Generate device fingerprint from browser metadata
 * Combines User-Agent, Device Memory, and other available metrics
 * 
 * PRIVACY: The fingerprint is hashed using SHA-256 for privacy protection
 * 
 * @param userAgent - Browser User-Agent string
 * @param deviceMemory - Navigator.deviceMemory (if available)
 * @param screenResolution - Screen resolution string (e.g., "1920x1080")
 * @param timezone - User timezone offset
 * @returns SHA-256 hashed device fingerprint
 */
export function generateDeviceFingerprint(
  userAgent: string,
  deviceMemory?: number,
  screenResolution?: string,
  timezone?: string
): string {
  const components = [
    userAgent,
    deviceMemory?.toString() || 'unknown',
    screenResolution || 'unknown',
    timezone || 'unknown',
  ]
  
  const fingerprintData = components.join('|')
  const hash = createHash('sha256')
  hash.update(fingerprintData)
  return hash.digest('hex')
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Used for geofencing validation
 * 
 * @param lat1 - Latitude of first point (degrees)
 * @param lon1 - Longitude of first point (degrees)
 * @param lat2 - Latitude of second point (degrees)
 * @param lon2 - Longitude of second point (degrees)
 * @returns Distance in meters
 */
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}

/**
 * Validate geofencing constraint
 * @param teacherLat - Teacher latitude
 * @param teacherLon - Teacher longitude
 * @param studentLat - Student latitude
 * @param studentLon - Student longitude
 * @param radiusMeters - Allowed radius (default: 50 meters)
 * @returns Object with validation result and distance
 */
export function validateGeofence(
  teacherLat: number,
  teacherLon: number,
  studentLat: number,
  studentLon: number,
  radiusMeters: number = 50
): { isValid: boolean; distance: number } {
  const distance = calculateHaversineDistance(teacherLat, teacherLon, studentLat, studentLon)
  return {
    isValid: distance <= radiusMeters,
    distance: Math.round(distance * 100) / 100, // Round to 2 decimal places
  }
}

/**
 * Generate QR code data payload
 * Creates a signed, timestamped payload for the QR code
 * 
 * @param sessionCode - Attendance session code
 * @param teacherId - Teacher's user ID
 * @param secret - TOTP secret for signing
 * @returns Stringified JSON payload for QR code
 */
export function generateQRPayload(
  sessionCode: string,
  teacherId: string,
  secret: string
): string {
  const timestamp = Date.now()
  const data = `${teacherId}|${timestamp}|${sessionCode}`
  const signature = signQRData(data, secret)
  const totpCode = generateTOTPCode(secret)
  
  const payload = {
    sessionCode,
    timestamp,
    signature,
    totpCode,
  }
  
  return JSON.stringify(payload)
}

/**
 * Verify QR code payload
 * Validates signature, timestamp freshness, and TOTP code
 * 
 * @param payloadJson - QR code payload JSON string
 * @param teacherId - Expected teacher ID
 * @param secret - TOTP secret for verification
 * @param maxAgeMs - Maximum age of QR code in milliseconds (default: 30 seconds)
 * @returns Validation result with error message if invalid
 */
export function verifyQRPayload(
  payloadJson: string,
  teacherId: string,
  secret: string,
  maxAgeMs: number = 30000
): { isValid: boolean; error?: string; sessionCode?: string } {
  try {
    const payload = JSON.parse(payloadJson)
    const { sessionCode, timestamp, signature, totpCode } = payload
    
    // Check timestamp freshness (prevent replay attacks)
    const age = Date.now() - timestamp
    if (age > maxAgeMs) {
      return { isValid: false, error: 'QR code expired' }
    }
    
    // Verify signature
    const data = `${teacherId}|${timestamp}|${sessionCode}`
    if (!verifyQRSignature(data, signature, secret)) {
      return { isValid: false, error: 'Invalid signature' }
    }
    
    // Verify TOTP code
    if (!verifyTOTPCode(totpCode, secret)) {
      return { isValid: false, error: 'Invalid TOTP code' }
    }
    
    return { isValid: true, sessionCode }
  } catch (error) {
    return { isValid: false, error: 'Invalid QR payload format' }
  }
}
