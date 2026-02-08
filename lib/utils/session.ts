/**
 * Attendance session utilities for common operations
 */

/**
 * Check if an attendance session has auto-closed based on duration
 * @param startedAt - Session start timestamp (ISO string)
 * @param autoCloseDurationMinutes - Auto-close duration in minutes
 * @returns true if session has auto-closed, false otherwise
 */
export function hasSessionAutoClosed(
    startedAt: string | null,
    autoCloseDurationMinutes: number | null
): boolean {
    if (!autoCloseDurationMinutes || autoCloseDurationMinutes <= 0 || !startedAt) {
        return false
    }

    const startTime = new Date(startedAt).getTime()
    const autoCloseTime = startTime + autoCloseDurationMinutes * 60 * 1000

    return Date.now() >= autoCloseTime
}

/**
 * Calculate remaining time for session auto-close
 * @param startedAt - Session start timestamp (ISO string)
 * @param autoCloseDurationMinutes - Auto-close duration in minutes
 * @returns Remaining milliseconds, or null if no auto-close is set
 */
export function getRemainingSessionTime(
    startedAt: string | null,
    autoCloseDurationMinutes: number | null
): number | null {
    if (!autoCloseDurationMinutes || autoCloseDurationMinutes <= 0 || !startedAt) {
        return null
    }

    const startTime = new Date(startedAt).getTime()
    const autoCloseTime = startTime + autoCloseDurationMinutes * 60 * 1000
    const remainingMs = autoCloseTime - Date.now()

    return Math.max(0, remainingMs)
}
