'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireRole?: 'teacher' | 'student'
  redirectTo?: string
}

export function ProtectedRoute({ 
  children, 
  requireRole = 'teacher', 
  redirectTo = '/auth/login' 
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Not authenticated
        router.replace(redirectTo)
        return
      }

      if (profile && requireRole && profile.role !== requireRole) {
        // Wrong role
        toast.error(`Access denied. ${requireRole.charAt(0).toUpperCase() + requireRole.slice(1)} account required.`)
        
        // Redirect based on user role
        if (profile.role === 'student') {
          router.replace('/join')
        } else {
          router.replace('/auth/login')
        }
        return
      }
    }
  }, [user, profile, loading, router, requireRole, redirectTo])

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  // Don't render content if not authenticated or wrong role
  if (!user || !profile) {
    return null
  }

  if (requireRole && profile.role !== requireRole) {
    return null
  }

  // User is authenticated and has correct role
  return <>{children}</>
}