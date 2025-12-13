import { ExamSession } from '@/lib/types'

export interface GuestSessionData {
  sessionId: string
  examId: string
  guestName: string
  guestEmail: string
  isGuest: true
}

export function getGuestSessionData(): GuestSessionData | null {
  if (typeof window === 'undefined') return null
  
  try {
    const data = sessionStorage.getItem('guestExamSession')
    if (!data) return null
    
    const parsed = JSON.parse(data)
    if (!parsed.isGuest) return null
    
    return parsed as GuestSessionData
  } catch {
    return null
  }
}

export function clearGuestSessionData(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem('guestExamSession')
}

export function isGuestSession(): boolean {
  const guestData = getGuestSessionData()
  return guestData !== null
}

export function getSessionIdentifier(): { studentId?: string; guestEmail?: string } {
  const guestData = getGuestSessionData()
  
  if (guestData) {
    return { guestEmail: guestData.guestEmail }
  }
  
  // For authenticated users, return their user ID
  // This would be populated by your auth context
  return {}
}