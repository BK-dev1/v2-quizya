/**
 * REDIS CACHING UTILITY FOR ATTENDANCE SYSTEM
 * 
 * Provides Redis connection and caching functions for:
 * - TOTP secrets and validation state
 * - Session metadata for fast lookups
 * - Rate limiting for attendance marking
 * 
 * FALLBACK: If Redis is not available, operations will fail gracefully
 * and fall back to database-only mode
 */

import Redis from 'ioredis'

// Initialize Redis client (lazy initialization)
let redisClient: Redis | null = null

/**
 * Get or create Redis client
 * @returns Redis client instance or null if connection fails
 */
function getRedisClient(): Redis | null {
  if (redisClient) return redisClient

  try {
    const redisUrl = process.env.REDIS_URL
    
    if (!redisUrl) {
      console.warn('REDIS_URL not configured. Running without Redis cache.')
      return null
    }

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      lazyConnect: true,
    })

    redisClient.on('error', (err) => {
      console.error('Redis connection error:', err)
    })

    redisClient.on('connect', () => {
      console.log('Redis connected successfully')
    })

    return redisClient
  } catch (error) {
    console.error('Failed to initialize Redis:', error)
    return null
  }
}

/**
 * Cache attendance session data
 * @param sessionCode - Unique session code
 * @param data - Session data to cache
 * @param ttlSeconds - Time to live in seconds (default: 3600 = 1 hour)
 */
export async function cacheAttendanceSession(
  sessionCode: string,
  data: any,
  ttlSeconds: number = 3600
): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    const key = `attendance:session:${sessionCode}`
    await client.setex(key, ttlSeconds, JSON.stringify(data))
  } catch (error) {
    console.error('Redis cache set error:', error)
  }
}

/**
 * Get cached attendance session data
 * @param sessionCode - Unique session code
 * @returns Cached session data or null
 */
export async function getCachedAttendanceSession(sessionCode: string): Promise<any | null> {
  const client = getRedisClient()
  if (!client) return null

  try {
    const key = `attendance:session:${sessionCode}`
    const data = await client.get(key)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Redis cache get error:', error)
    return null
  }
}

/**
 * Cache TOTP secret for a session
 * @param sessionCode - Unique session code
 * @param secret - TOTP secret to cache
 * @param ttlSeconds - Time to live in seconds
 */
export async function cacheTOTPSecret(
  sessionCode: string,
  secret: string,
  ttlSeconds: number = 3600
): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    const key = `attendance:totp:${sessionCode}`
    await client.setex(key, ttlSeconds, secret)
  } catch (error) {
    console.error('Redis TOTP cache error:', error)
  }
}

/**
 * Get cached TOTP secret
 * @param sessionCode - Unique session code
 * @returns TOTP secret or null
 */
export async function getCachedTOTPSecret(sessionCode: string): Promise<string | null> {
  const client = getRedisClient()
  if (!client) return null

  try {
    const key = `attendance:totp:${sessionCode}`
    return await client.get(key)
  } catch (error) {
    console.error('Redis TOTP get error:', error)
    return null
  }
}

/**
 * Rate limiting for attendance marking
 * Prevents rapid repeated submissions from the same user
 * 
 * @param userId - User ID
 * @param sessionCode - Session code
 * @param windowSeconds - Rate limit window (default: 60 seconds)
 * @returns true if rate limit exceeded, false otherwise
 */
export async function checkAttendanceRateLimit(
  userId: string,
  sessionCode: string,
  windowSeconds: number = 60
): Promise<boolean> {
  const client = getRedisClient()
  if (!client) return false // No rate limiting if Redis unavailable

  try {
    const key = `attendance:ratelimit:${userId}:${sessionCode}`
    const exists = await client.exists(key)
    
    if (exists) {
      return true // Rate limit exceeded
    }
    
    // Set rate limit key with expiration
    await client.setex(key, windowSeconds, '1')
    return false
  } catch (error) {
    console.error('Redis rate limit check error:', error)
    return false // Allow on error
  }
}

/**
 * Mark device fingerprint as used for a session
 * Prevents multiple submissions from same device
 * 
 * @param deviceFingerprint - Hashed device fingerprint
 * @param sessionCode - Session code
 * @param ttlSeconds - Time to live (default: 24 hours)
 */
export async function markDeviceUsed(
  deviceFingerprint: string,
  sessionCode: string,
  ttlSeconds: number = 86400
): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    const key = `attendance:device:${sessionCode}:${deviceFingerprint}`
    await client.setex(key, ttlSeconds, '1')
  } catch (error) {
    console.error('Redis device marking error:', error)
  }
}

/**
 * Check if device fingerprint has been used for a session
 * @param deviceFingerprint - Hashed device fingerprint
 * @param sessionCode - Session code
 * @returns true if device already used, false otherwise
 */
export async function isDeviceUsed(
  deviceFingerprint: string,
  sessionCode: string
): Promise<boolean> {
  const client = getRedisClient()
  if (!client) return false // Allow if Redis unavailable

  try {
    const key = `attendance:device:${sessionCode}:${deviceFingerprint}`
    const exists = await client.exists(key)
    return exists === 1
  } catch (error) {
    console.error('Redis device check error:', error)
    return false // Allow on error
  }
}

/**
 * Invalidate all cached data for a session
 * @param sessionCode - Session code to invalidate
 */
export async function invalidateSessionCache(sessionCode: string): Promise<void> {
  const client = getRedisClient()
  if (!client) return

  try {
    const pattern = `attendance:*:${sessionCode}*`
    
    // Use SCAN instead of KEYS for better performance in production
    const keys: string[] = []
    let cursor = '0'
    
    do {
      const result = await client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
      cursor = result[0]
      keys.push(...result[1])
    } while (cursor !== '0')
    
    if (keys.length > 0) {
      await client.del(...keys)
    }
  } catch (error) {
    console.error('Redis cache invalidation error:', error)
  }
}

/**
 * Close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit()
    redisClient = null
  }
}
