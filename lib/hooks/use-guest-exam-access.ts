'use client'

import { useState } from 'react'
import { Exam, ExamSession } from '@/lib/types'

export function useGuestExamAccess() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const joinExamAsGuest = async (
    roomCode: string, 
    guestName: string, 
    guestEmail: string
  ): Promise<{ exam: Exam; session: ExamSession } | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/exam/guest-join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomCode,
          guestName,
          guestEmail
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to join exam')
      }

      return {
        exam: data.exam,
        session: data.session
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }

  const validateGuestInfo = (name: string, email: string): string | null => {
    if (!name.trim()) {
      return 'Name is required'
    }
    
    if (!email.trim()) {
      return 'Email is required'
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    
    return null
  }

  return {
    joinExamAsGuest,
    validateGuestInfo,
    loading,
    error,
    clearError: () => setError(null)
  }
}