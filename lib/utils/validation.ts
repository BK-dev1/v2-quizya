/**
 * Validation utilities for input sanitization and validation
 */

/**
 * Validate email format using a simple regex
 * This is for basic format checking, not comprehensive email validation
 */
export function isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') {
        return false
    }

    // Basic email regex - checks for basic format like xxx@yyy.zzz
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email.trim())
}

/**
 * Sanitize string input by trimming and limiting length
 * Prevents excessively long inputs that could cause issues
 */
export function sanitizeString(input: string | null | undefined, maxLength: number = 255): string {
    if (!input || typeof input !== 'string') {
        return ''
    }

    return input.trim().slice(0, maxLength)
}

/**
 * Validate and sanitize student name
 * Must be between 2 and 100 characters
 */
export function isValidStudentName(name: string): boolean {
    const sanitized = sanitizeString(name, 100)
    return sanitized.length >= 2 && sanitized.length <= 100
}

/**
 * Create a standardized error response object
 */
export function createErrorResponse(message: string, statusCode: number, additionalData?: Record<string, any>) {
    return {
        body: {
            error: message,
            ...additionalData
        },
        status: statusCode
    }
}
