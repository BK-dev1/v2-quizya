'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { Profile } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'

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
  signInWithGoogle: (next?: string) => Promise<{ error?: string }>
  refreshProfile: () => Promise<void>
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

  const signInWithGoogle = async (next?: string) => {
    try {
      const supabase = createClient()
      const callbackUrl = new URL(`${window.location.origin}/api/auth/callback`)
      if (next) callbackUrl.searchParams.set('next', next)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString()
        }
      })

      if (error) return { error: error.message }
      return {}
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
      signInWithGoogle,
      refreshProfile
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