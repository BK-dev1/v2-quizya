'use client'

/**
 * ATTENDANCE DASHBOARD PAGE
 * 
 * Role-based attendance interface:
 * - Teachers: Generate and manage attendance QR codes, view session history
 * - Students: Scan QR codes and mark attendance
 */

import { useAuth } from '@/lib/hooks/use-auth'
import AttendanceScanner from '@/components/attendance/scanner'
import AttendanceDashboard from '@/components/attendance/AttendanceDashboard'
import { NeuCard } from '@/components/ui/neu-card'
import { Loader2 } from 'lucide-react'

export default function AttendancePage() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <NeuCard className="p-12 text-center">
          <p className="text-muted-foreground">
            Please log in to access the attendance system.
          </p>
        </NeuCard>
      </div>
    )
  }

  // Student view
  if (profile.role !== 'teacher') {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Attendance</h1>
          <p className="text-muted-foreground">
            Scan QR codes to mark your attendance
          </p>
        </div>
        <AttendanceScanner />
      </div>
    )
  }

  // Teacher view - The New Dashboard
  return (
    <div className="container mx-auto p-4 md:p-8">
      <AttendanceDashboard />
    </div>
  )
}
