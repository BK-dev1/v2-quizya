import QRCode from 'qrcode'
import crypto from 'crypto'

export interface QRTokenData {
  sessionId: string
  token: string
  expiresAt: number
}

/**
 * Generate a secure token for QR code
 */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create QR data with expiration
 */
export function createQRData(sessionId: string, refreshInterval: number = 20): QRTokenData {
  const token = generateToken()
  const expiresAt = Date.now() + (refreshInterval * 1000) // Convert seconds to milliseconds
  
  return {
    sessionId,
    token,
    expiresAt
  }
}

/**
 * Generate QR code as data URL
 */
export async function generateQRCode(data: QRTokenData): Promise<string> {
  try {
    const qrData = JSON.stringify(data)
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
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

// In-memory token store (for server-side validation)
// PRODUCTION NOTE: This in-memory storage will NOT work correctly in:
// - Multi-instance deployments (load-balanced servers)
// - Serverless environments (Vercel, AWS Lambda, etc.)
// For production, use Redis, a database, or another shared storage solution
const tokenStore = new Map<string, Set<string>>()

/**
 * Store a valid token for a session
 */
export function storeToken(sessionId: string, token: string, ttl: number = 20000): void {
  if (!tokenStore.has(sessionId)) {
    tokenStore.set(sessionId, new Set())
  }
  
  const tokens = tokenStore.get(sessionId)!
  tokens.add(token)
  
  // Auto-cleanup after TTL
  setTimeout(() => {
    tokens.delete(token)
    if (tokens.size === 0) {
      tokenStore.delete(sessionId)
    }
  }, ttl)
}

/**
 * Verify if a token is valid for a session
 */
export function verifyToken(sessionId: string, token: string): boolean {
  const tokens = tokenStore.get(sessionId)
  return tokens ? tokens.has(token) : false
}

/**
 * Clear all tokens for a session
 */
export function clearSessionTokens(sessionId: string): void {
  tokenStore.delete(sessionId)
}
