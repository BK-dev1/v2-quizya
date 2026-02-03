'use client'

/**
 * ATTENDANCE DASHBOARD PAGE
 * 
 * Role-based attendance interface:
 * - Teachers: Generate and manage attendance QR codes
 * - Students: Scan QR codes and mark attendance
 */

import { useAuth } from '@/lib/hooks/use-auth'
import AttendanceQRGenerator from '@/components/attendance/qr-generator'
import AttendanceScanner from '@/components/attendance/scanner'
import { NeuCard } from '@/components/ui/neu-card'
import { Loader2 } from 'lucide-react'

export default function AttendancePage() {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <NeuCard className="p-8">
          <p className="text-center text-muted-foreground">
            Please log in to access the attendance system.
          </p>
        </NeuCard>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Attendance System</h1>
        <p className="text-muted-foreground">
          {profile.role === 'teacher'
            ? 'Generate secure QR codes for student attendance'
            : 'Scan QR codes to mark your attendance'}
        </p>
      </div>

      {profile.role === 'teacher' ? (
        <AttendanceQRGenerator />
      ) : (
        <AttendanceScanner />
      )}

      {/* Security Notice */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>
          Protected by multi-layer security: TOTP rotation, geofencing, device fingerprinting,
          and HMAC signatures
        </p>
      </div>
    </div>
  )
}
