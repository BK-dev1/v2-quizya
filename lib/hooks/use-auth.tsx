'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Profile } from '@/lib/types'

interface User {
  id: string
  email: string
  user_metadata?: Record<string, any>
}

interface AuthContextType {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, fullName: string, role?: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  // Attendance functions
  generateAttendanceQR: (sessionName: string, latitude: number, longitude: number, radius?: number, durationMinutes?: number) => Promise<{ error?: string; data?: any }>
  verifyAttendanceQR: (qrPayload: string, latitude: number, longitude: number) => Promise<{ error?: string; data?: any }>
  markAttendance: (sessionCode: string, qrPayload: string, latitude: number, longitude: number, deviceFingerprint: string) => Promise<{ error?: string; data?: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    try {
      const res = await fetch(`/api/settings/profile?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setProfile(data)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      try {
        const res = await fetch('/api/auth/me')

        // Check if response is OK first
        if (!res.ok) {
          console.error('Failed to fetch user:', res.status, res.statusText)
          setLoading(false)
          return
        }

        // Check if response is JSON
        const contentType = res.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Response is not JSON:', contentType)
          setLoading(false)
          return
        }

        const data = await res.json()
        setUser(data.user)

        if (data.user) {
          await fetchProfile(data.user.id)
        }
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (!res.ok) {
        const data = await res.json()
        return { error: data.error || 'Sign in failed' }
      }

      const data = await res.json()
      setUser(data.user)
      if (data.user) {
        await fetchProfile(data.user.id)
      }

      return {}
    } catch (error) {
      return { error: String(error) }
    }
  }

  const signUp = async (email: string, password: string, fullName: string, role: string = 'student') => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName, role })
      })

      if (!res.ok) {
        const data = await res.json()
        return { error: data.error || 'Sign up failed' }
      }

      const data = await res.json()

      // Set user after successful signup (user will need to verify email)
      if (data.user) {
        setUser(data.user)
      }

      return {}
    } catch (error) {
      return { error: String(error) }
    }
  }

  const signOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  // Attendance functions
  const generateAttendanceQR = async (
    sessionName: string,
    latitude: number,
    longitude: number,
    radius: number = 50,
    durationMinutes: number = 60
  ) => {
    try {
      const res = await fetch('/api/attendance/generate-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName, latitude, longitude, radius, durationMinutes })
      })

      if (!res.ok) {
        const data = await res.json()
        return { error: data.error || 'Failed to generate QR code' }
      }

      const data = await res.json()
      return { data }
    } catch (error) {
      return { error: String(error) }
    }
  }

  const verifyAttendanceQR = async (
    qrPayload: string,
    latitude: number,
    longitude: number
  ) => {
    try {
      const res = await fetch('/api/attendance/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrPayload, studentLatitude: latitude, studentLongitude: longitude })
      })

      if (!res.ok) {
        const data = await res.json()
        return { error: data.error || 'Verification failed' }
      }

      const data = await res.json()
      return { data }
    } catch (error) {
      return { error: String(error) }
    }
  }

  const markAttendance = async (
    sessionCode: string,
    qrPayload: string,
    latitude: number,
    longitude: number,
    deviceFingerprint: string
  ) => {
    try {
      const res = await fetch('/api/attendance/mark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionCode,
          qrPayload,
          studentLatitude: latitude,
          studentLongitude: longitude,
          deviceFingerprint,
          userAgent: navigator.userAgent,
          screenResolution: `${screen.width}x${screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })

      if (!res.ok) {
        const data = await res.json()
        return { error: data.error || 'Failed to mark attendance' }
      }

      const data = await res.json()
      return { data }
    } catch (error) {
      return { error: String(error) }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
      generateAttendanceQR,
      verifyAttendanceQR,
      markAttendance
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}