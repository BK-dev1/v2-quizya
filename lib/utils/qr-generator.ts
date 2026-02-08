import QRCode from 'qrcode'
import crypto from 'crypto'

export interface QRTokenData {
  sessionId: string
  token: string
  expiresAt: number
}

/**
 * Generate a stateless signed token
 * Format: timestamp.signature
 */
export function generateSignedToken(sessionId: string, secret: string): string {
  const timestamp = Date.now().toString()
  const data = `${sessionId}:${timestamp}`
  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex')

  return `${timestamp}.${signature}`
}

/**
 * Verify a stateless signed token
 */
export function verifySignedToken(
  token: string,
  sessionId: string,
  secret: string,
  validityWindowMs: number
): boolean {
  try {
    const [timestampStr, signature] = token.split('.')
    if (!timestampStr || !signature) return false

    const timestamp = parseInt(timestampStr, 10)
    if (isNaN(timestamp)) return false

    // Check expiration
    const now = Date.now()
    if (now - timestamp > validityWindowMs) return false // Expired
    if (timestamp > now + 30000) return false // From future (allow 30s clock drift)

    // Check signature
    const data = `${sessionId}:${timestamp}`
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex')

    return signature === expectedSignature
  } catch (err) {
    return false
  }
}

/**
 * Create QR data with stateless token
 */
export function createQRData(sessionId: string, refreshInterval: number = 20): QRTokenData {
  // Use service role key as secret - fallback to anon key if missing (not recommended for prod but works for dev)
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'default-secret'
  const token = generateSignedToken(sessionId, secret)

  // Calculate expiry for UI display purposes
  // Actual expiry is enforced by verifySignedToken using refreshInterval + grace period
  const expiresAt = Date.now() + (refreshInterval * 1000)

  return {
    sessionId,
    token,
    expiresAt
  }
}

/**
 * Generate QR code as data URL from string data
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'H',
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })

    return qrCodeDataUrl
  } catch (error) {
    console.error('Error generating QR code:', error)
    throw new Error('Failed to generate QR code')
  }
}

/**
 * Validate if QR token is still valid
 */
export function validateQRToken(expiresAt: number): boolean {
  return Date.now() < expiresAt
}

/**
 * Create a full check-in URL for QR code (used for student scanning)
 */
export function createCheckInURL(baseUrl: string, sessionId: string, token: string): string {
  return `${baseUrl}/attendance/check-in?session=${sessionId}&token=${token}`
}

