'use client'

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import {
  QrCode,
  Users,
  Clock,
  Loader2,
  RefreshCw,
  StopCircle,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Download
} from 'lucide-react'
import { AttendanceSession, AttendanceRecord, AttendanceQRData } from '@/lib/types'
import { toast } from 'sonner'
import Image from 'next/image'

// QR code generation is only needed when viewing an active session
// We use dynamic import inside the component to avoid SSR issues and reduce bundle size

export default function AttendanceSessionComponent() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [session, setSession] = useState<AttendanceSession | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrData, setQrData] = useState<AttendanceQRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isEnding, setIsEnding] = useState(false)
  const lastScanUrlRef = useRef<string | null>(null)

  const loadSessionData = useCallback(async () => {
    if (!id) return

    try {
      const res = await fetch(`/api/attendance/sessions/${id}`)

      if (res.ok) {
        const data = await res.json()
        setSession(data.session)
        setRecords(data.session.attendance_records || [])

        if (data.scanUrl && data.qrData) {
          setQrData(data.qrData)

          if (data.scanUrl !== lastScanUrlRef.current) {
            // Generate QR code on client side using dynamically imported module
            const QRCode = await import('qrcode')
            const qrCodeUrl = await QRCode.toDataURL(data.scanUrl, {
              errorCorrectionLevel: 'H',
              width: 400,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            })
            setQrCode(qrCodeUrl)
            lastScanUrlRef.current = data.scanUrl
          }

          // Calculate time left
          const expiresAt = data.qrData.expiresAt
          const now = Date.now()
          const secondsLeft = Math.max(0, Math.floor((expiresAt - now) / 1000))
          setTimeLeft(secondsLeft)
        }
      } else if (res.status === 403) {
        toast.error('You do not have access to this session')
        router.push('/dashboard/attendance')
      } else {
        toast.error('Failed to load session')
      }
    } catch (error) {
      console.error('Error loading session:', error)
      toast.error('Error loading session')
    } finally {
      setLoading(false)
    }
  }, [id, router])

  // Memoize whether we should refresh based on time left
  const shouldRefresh = useMemo(() => {
    return timeLeft <= 1
  }, [timeLeft])

  useEffect(() => {
    if (user) {
      loadSessionData()
    }
  }, [user, loadSessionData])

  // Combined timer: countdown + auto-refresh when needed
  useEffect(() => {
    if (!session?.is_active || !qrData) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        const newTimeLeft = prev - 1

        // Refresh data when time expires
        if (newTimeLeft <= 0) {
          loadSessionData()
          return session.qr_refresh_interval
        }

        return newTimeLeft
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [session?.is_active, session?.qr_refresh_interval, qrData, loadSessionData])

  // Real-time attendance updates - poll every 15 seconds when session is active
  useEffect(() => {
    if (!session?.is_active) return

    const pollInterval = setInterval(() => {
      loadSessionData()
    }, 15000) // Poll every 15 seconds

    return () => clearInterval(pollInterval)
  }, [session?.is_active, loadSessionData])

  const handleEndSession = useCallback(async () => {
    if (!confirm('Are you sure you want to end this attendance session?')) {
      return
    }

    setIsEnding(true)

    try {
      const res = await fetch(`/api/attendance/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: false, ended_at: new Date().toISOString() })
      })

      if (res.ok) {
        toast.success('Session ended successfully')
        loadSessionData()
      } else {
        toast.error('Failed to end session')
      }
    } catch (error) {
      console.error('Error ending session:', error)
      toast.error('Error ending session')
    } finally {
      setIsEnding(false)
    }
  }, [id, loadSessionData])

  const handleExport = useCallback(async () => {
    try {
      const res = await fetch(`/api/attendance/sessions/${id}/export`)

      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const fileName = session?.module_name.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'attendance'
        a.download = `attendance_${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        toast.success('Attendance exported successfully')
      } else {
        toast.error('Failed to export attendance')
      }
    } catch (error) {
      console.error('Error exporting:', error)
      toast.error('Error exporting attendance')
    }
  }, [id, session?.module_name])

  // Memoize formatted dates and computed values
  const formattedStartTime = useMemo(() =>
    session ? new Date(session.started_at).toLocaleString() : '',
    [session?.started_at]
  )

  const formattedEndTime = useMemo(() =>
    session?.ended_at ? new Date(session.ended_at).toLocaleString() : null,
    [session?.ended_at]
  )

  const recordCount = useMemo(() => records.length, [records.length])

  const hasLocationVerification = useMemo(() =>
    Boolean(session?.location_lat && session?.location_lng),
    [session?.location_lat, session?.location_lng]
  )

  // Memoize auto-close countdown
  const autoCloseCountdown = useMemo(() => {
    if (!session?.auto_close_duration_minutes || !session.started_at || !session.is_active) {
      return null
    }
    const startTime = new Date(session.started_at).getTime()
    const autoCloseTime = startTime + session.auto_close_duration_minutes * 60 * 1000
    const now = Date.now()
    const minutesRemaining = Math.max(0, Math.ceil((autoCloseTime - now) / 60000))

    if (minutesRemaining <= 0) {
      return 'Auto-closing soon'
    }
    const autoCloseDate = new Date(autoCloseTime).toLocaleTimeString()
    return `Auto-closes in ${minutesRemaining}m (${autoCloseDate})`
  }, [session?.auto_close_duration_minutes, session?.started_at, session?.is_active, timeLeft])

  // Memoize rendered records to prevent re-rendering table on every state change
  const renderedRecords = useMemo(() =>
    records.map((record, index) => (
      <tr key={record.id} className="border-b hover:bg-muted/50">
        <td className="py-3 px-4">{index + 1}</td>
        <td className="py-3 px-4 font-medium">{record.student_name}</td>
        <td className="py-3 px-4 text-muted-foreground">
          {record.student_email || 'N/A'}
        </td>
        <td className="py-3 px-4 text-sm">
          {new Date(record.check_in_time).toLocaleTimeString()}
        </td>
        <td className="py-3 px-4">
          {record.location_lat && record.location_lng ? (
            <span className="flex items-center gap-1 text-green-600">
              <CheckCircle2 className="h-4 w-4" />
              Verified
            </span>
          ) : (
            <span className="text-muted-foreground text-sm">No location</span>
          )}
        </td>
      </tr>
    )),
    [records]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="container mx-auto p-6">
        <NeuCard className="p-12 text-center">
          <p className="text-muted-foreground">Session not found</p>
          <NeuButton onClick={() => router.push('/dashboard/attendance')} className="mt-4">
            Back to Attendance
          </NeuButton>
        </NeuCard>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <NeuButton variant="outline" onClick={() => router.push('/dashboard/attendance')}>
            <ArrowLeft className="h-4 w-4" />
          </NeuButton>
          <div>
            <h1 className="text-3xl font-bold">{session.module_name}</h1>
            {session.section_group && (
              <p className="text-muted-foreground mt-1">{session.section_group}</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <NeuButton variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </NeuButton>
          {session.is_active && (
            <NeuButton variant="destructive" onClick={handleEndSession} disabled={isEnding}>
              {isEnding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ending...
                </>
              ) : (
                <>
                  <StopCircle className="mr-2 h-4 w-4" />
                  End Session
                </>
              )}
            </NeuButton>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Session Info */}
        <NeuCard className="p-6">
          <h3 className="font-semibold mb-4">Session Info</h3>
          <div className="space-y-3 text-sm">
            {session.module_name && (
              <div>
                <span className="text-muted-foreground">Module:</span>
                <p className="font-medium">{session.module_name}</p>
              </div>
            )}
            {session.section_group && (
              <div>
                <span className="text-muted-foreground">Section:</span>
                <p className="font-medium">{session.section_group}</p>
              </div>
            )}
            {session.week && (
              <div>
                <span className="text-muted-foreground">Week:</span>
                <p className="font-medium">Week {session.week}</p>
              </div>
            )}
            {session.section_num && (
              <div>
                <span className="text-muted-foreground">Section Number:</span>
                <p className="font-medium">Section {session.section_num}</p>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Started:</span>
              <p className="font-medium">{formattedStartTime}</p>
            </div>
            {formattedEndTime && (
              <div>
                <span className="text-muted-foreground">Ended:</span>
                <p className="font-medium">{formattedEndTime}</p>
              </div>
            )}
            {session.auto_close_duration_minutes ? (
              <div>
                <span className="text-muted-foreground">Auto-close:</span>
                <p className="font-medium">{session.auto_close_duration_minutes} min</p>
              </div>
            ) : null}
            {hasLocationVerification && (
              <div>
                <span className="text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Location:
                </span>
                <p className="font-medium">Within {session.max_distance_meters}m</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {session.location_lat?.toFixed(6)}, {session.location_lng?.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </NeuCard>


        {/* QR Code */}
        <NeuCard className="p-6">
          {session.is_active && qrCode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">QR Code</h3>
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>{timeLeft}s</span>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg">
                <Image
                  src={qrCode}
                  alt="Attendance QR Code"
                  width={300}
                  height={300}
                  className="w-full h-auto"
                  unoptimized
                  priority
                />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Students scan this code to check in
              </p>
              {autoCloseCountdown && (
                <p className="text-xs text-center text-orange-600 font-semibold">
                  {autoCloseCountdown}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <QrCode className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Session has ended</p>
            </div>
          )}
        </NeuCard>
      </div>

      {/* Attendance Records */}
      <NeuCard className="p-6">
        <h3 className="font-semibold mb-4">Attendance Records ({recordCount})</h3>

        {recordCount === 0 ? (
          <div className="text-center py-12">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No students have checked in yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">#</th>
                  <th className="text-left py-3 px-4">Name</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Check-in Time</th>
                  <th className="text-left py-3 px-4">Location</th>
                </tr>
              </thead>
              <tbody>
                {renderedRecords}
              </tbody>
            </table>
          </div>
        )}
      </NeuCard>
    </div>
  )
}
