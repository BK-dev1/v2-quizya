'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

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
  const { t } = useTranslation()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace(redirectTo)
        return
      }

      if (profile && requireRole && profile.role !== requireRole) {
        if (requireRole === 'teacher') {
          toast.error(`${t('accessDenied')} ${t('teacherAccountRequired')}`)
        } else {
          toast.error(`${t('accessDenied')} ${t('studentAccountRequired')}`)
        }
        
        if (profile.role === 'student') {
          router.replace('/join')
        } else {
          router.replace('/auth/login')
        }
        return
      }
    }
  }, [user, profile, loading, router, requireRole, redirectTo, t])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t('checkingPermissions')}</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  if (requireRole && profile.role !== requireRole) {
    return null
  }

  return <>{children}</>
}