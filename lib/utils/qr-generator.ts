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

