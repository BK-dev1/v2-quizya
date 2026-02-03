/**
 * CLIENT-SIDE DEVICE FINGERPRINTING
 * 
 * Generates a unique device fingerprint using browser metadata.
 * This runs in the browser and collects available device information.
 * 
 * Note: This is a simple implementation. For production, consider using
 * a more robust library like FingerprintJS.
 */

/**
 * Generate a device fingerprint hash on the client side
 * @returns SHA-256 hash of device characteristics
 */
export async function generateClientDeviceFingerprint(): Promise<string> {
  const components: string[] = []

  // User Agent
  components.push(navigator.userAgent || 'unknown')

  // Device Memory (if available)
  const deviceMemory = (navigator as any).deviceMemory
  components.push(deviceMemory?.toString() || 'unknown')

  // Screen Resolution
  components.push(`${screen.width}x${screen.height}`)

  // Color Depth
  components.push(screen.colorDepth.toString())

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown')

  // Language
  components.push(navigator.language || 'unknown')

  // Platform
  components.push(navigator.platform || 'unknown')

  // Hardware Concurrency (CPU cores)
  components.push(navigator.hardwareConcurrency?.toString() || 'unknown')

  // Pixel Ratio
  components.push(window.devicePixelRatio?.toString() || 'unknown')

  // Touch Support
  components.push(navigator.maxTouchPoints?.toString() || '0')

  // Combine all components
  const fingerprintData = components.join('|')

  // Hash using SubtleCrypto API (SHA-256)
  const encoder = new TextEncoder()
  const data = encoder.encode(fingerprintData)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  return hashHex
}

/**
 * Get device information for fingerprinting
 * @returns Object containing device metadata
 */
export function getDeviceInfo() {
  return {
    userAgent: navigator.userAgent,
    deviceMemory: (navigator as any).deviceMemory,
    screenResolution: `${screen.width}x${screen.height}`,
    colorDepth: screen.colorDepth,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: navigator.language,
    platform: navigator.platform,
    hardwareConcurrency: navigator.hardwareConcurrency,
    pixelRatio: window.devicePixelRatio,
    touchPoints: navigator.maxTouchPoints,
  }
}

/**
 * Check if device fingerprinting is supported
 * @returns true if SubtleCrypto is available
 */
export function isDeviceFingerprintingSupported(): boolean {
  return typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'
}
