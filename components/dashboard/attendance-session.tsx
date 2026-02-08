'use client'

import { useEffect, useState, useCallback, useMemo, useRef, memo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import {
  QrCode,
  Users,
  Clock,
  Loader2,
  StopCircle,
  ArrowLeft,
  MapPin,
  CheckCircle2,
  Download,
  AlertCircle
} from 'lucide-react'
import { AttendanceSession, AttendanceRecord, AttendanceQRData } from '@/lib/types'
import { toast } from 'sonner'
import Image from 'next/image'


// Memoized timer component to prevent parent re-renders
const QRTimer = memo(({ timeLeft }: { timeLeft: number }) => {
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-primary/5 rounded-lg border border-primary/10">
      <p className="text-sm text-muted-foreground font-medium mb-1">Code Expires In</p>
      <p className="text-3xl font-mono font-bold tabular-nums text-foreground">
        {minutes}:{seconds.toString().padStart(2, '0')}
      </p>
    </div>
  )
})
QRTimer.displayName = 'QRTimer'

// Summary Stat Card Component
const StatCard = ({ icon: Icon, label, value, colorClass }: { icon: any, label: string, value: string | number, colorClass: string }) => (
  <div className="flex items-center gap-4 p-4 rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm">
    <div className={`p-3 rounded-full ${colorClass} bg-opacity-10}`}>
      <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  </div>
)

export default function AttendanceSessionComponent({ id: propId }: { id?: string }) {
  const router = useRouter()
  const params = useParams()
  const id = propId || (params?.id as string)
  const { user, loading: authLoading } = useAuth()
  const [session, setSession] = useState<(AttendanceSession & { total_records?: number }) | null>(null)
  const [records, setRecords] = useState<AttendanceRecord[]>([])
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [qrData, setQrData] = useState<AttendanceQRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isEnding, setIsEnding] = useState(false)
  const lastScanUrlRef = useRef<string | null>(null)

  const loadSessionData = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }

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
    if (authLoading) return

    if (user) {
      loadSessionData()
    } else {
      setLoading(false)
    }
  }, [user, authLoading, loadSessionData])

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

  // Memoized rendered records to prevent re-rendering table on every state change
  const renderedRecords = useMemo(() =>
    records.map((record, index) => (
      <tr key={record.id} className="border-b hover:bg-muted/50 transition-colors">
        <td className="py-4 px-6 text-sm font-medium text-foreground">{index + 1}</td>
        <td className="py-4 px-6">
          <div className="flex flex-col">
            <span className="font-medium text-sm text-foreground">{record.student_name}</span>
            <span className="text-xs text-muted-foreground md:hidden">{record.student_email}</span>
          </div>
        </td>
        <td className="py-4 px-6 hidden md:table-cell text-sm text-muted-foreground">{record.student_email || 'N/A'}</td>
        <td className="py-4 px-6 text-sm tabular-nums text-muted-foreground">
          {new Date(record.check_in_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </td>
        <td className="py-4 px-6 text-right">
          {record.location_lat && record.location_lng ? (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
              <MapPin className="w-3 h-3" />
              Verified
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
              Manual
            </div>
          )}
        </td>
      </tr>
    )),
    [records]
  )


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading session...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
        <div className="bg-destructive/5 p-4 rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Session Not Found</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          The attendance session you are looking for does not exist or you don't have permission to view it.
        </p>
        <NeuButton onClick={() => router.push('/dashboard/attendance')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </NeuButton>
      </div>
    )
  }

  const uniqueStudents = new Set(records.map(r => r.student_email)).size

  return (
    <div className="container mx-auto p-4 lg:p-8 max-w-7xl space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <NeuButton variant="ghost" size="sm" onClick={() => router.push('/dashboard/attendance')} className="h-8 w-8 p-0 rounded-full">
              <ArrowLeft className="h-4 w-4" />
            </NeuButton>
            <h1 className="text-3xl font-bold tracking-tight">{session.module_name}</h1>
            {session.is_active ? (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-600 border border-green-500/20 flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                LIVE
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-600 border border-gray-500/20">
                ENDED
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-muted-foreground pl-11">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span>{session.section_group || 'All Sections'}</span>
            </div>
            {session.week && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>Week {session.week}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span>{new Date(session.started_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {session.is_active ? (
            <NeuButton
              variant="destructive"
              onClick={handleEndSession}
              disabled={isEnding}
              className="shadow-md hover:shadow-lg transition-all"
            >
              {isEnding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <StopCircle className="mr-2 h-4 w-4" />
              )}
              End Session
            </NeuButton>
          ) : (
            <NeuButton variant="outline" onClick={() => router.push('/dashboard/attendance')}>
              Back to List
            </NeuButton>
          )}
        </div>
      </div>

      {session.is_active && (
        <div className="grid lg:grid-cols-12 gap-8">
          {/* Left Column: QR Code */}
          <div className="lg:col-span-5 space-y-6">
            <NeuCard className="p-8 flex flex-col items-center text-center relative overflow-hidden ring-1 ring-primary/5 shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent pointer-events-none" />

              <div className="relative mb-8">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-20 blur-xl animate-pulse" />
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-border/50 relative">
                  {qrCode ? (
                    <Image
                      src={qrCode}
                      alt="Attendance QR Code"
                      width={280}
                      height={280}
                      className="rounded-lg"
                      priority
                    />
                  ) : (
                    <div className="h-[280px] w-[280px] flex items-center justify-center bg-muted/30 rounded-lg">
                      <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full max-w-xs space-y-6">
                {qrData && <QRTimer timeLeft={timeLeft} />}

                {autoCloseCountdown && (
                  <div className="text-xs font-semibold px-3 py-1 bg-orange-100 text-orange-700 rounded-full inline-block">
                    {autoCloseCountdown}
                  </div>
                )}
              </div>
            </NeuCard>

            <div className="grid grid-cols-2 gap-4">
              <StatCard
                icon={Users}
                label="Total Checked In"
                value={session?.total_records ?? records.length}
                colorClass="bg-blue-100 text-blue-600"
              />
              <StatCard
                icon={CheckCircle2}
                label="Unique Students"
                value={uniqueStudents}
                colorClass="bg-green-100 text-green-600"
              />
            </div>
          </div>

          {/* Right Column: Live Feed */}
          <div className="lg:col-span-7 space-y-6">
            <NeuCard className="h-full flex flex-col overflow-hidden border-0 shadow-lg ring-1 ring-border/50">
              <div className="p-6 border-b bg-muted/10 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <span className="relative flex h-2 w-2 mr-1">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  Live Feed
                </h2>
              </div>

              <div className="flex-1 overflow-auto max-h-[600px] p-0">
                {records.length > 0 ? (
                  <table className="w-full">
                    <thead className="bg-muted/30 sticky top-0 z-10 backdrop-blur-sm">
                      <tr>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Student</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                        <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                        <th className="text-right py-3 px-6 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                      {renderedRecords}
                    </tbody>
                  </table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center space-y-4">
                    <div className="bg-muted/30 p-4 rounded-full">
                      <Users className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">No check-ins yet</p>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Waiting for students to scan the QR code. Check-ins will appear here instantly.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </NeuCard>
          </div>
        </div>
      )}

      {!session.is_active && (
        <div className="grid gap-8">
          <div className="grid md:grid-cols-3 gap-6">
            <NeuCard className="p-6 flex items-center gap-4 bg-primary/5 border-primary/20">
              <div className="p-3 bg-primary/10 rounded-full text-primary">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Final Count</p>
                <p className="text-3xl font-bold">{records.length}</p>
              </div>
            </NeuCard>

            <NeuCard className="p-6 flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unique Students</p>
                <p className="text-3xl font-bold">{uniqueStudents}</p>
              </div>
            </NeuCard>

            <NeuCard className="p-6 flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-full text-purple-600">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Duration</p>
                <p className="text-3xl font-bold">
                  {session.ended_at && session.started_at
                    ? Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / (1000 * 60)) + 'm'
                    : '--'}
                </p>
              </div>
            </NeuCard>
          </div>

          <NeuCard className="overflow-hidden">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Attendance Record</h2>
              <NeuButton variant="outline" size="sm" onClick={() => window.location.href = `/api/attendance/sessions/${id}/export`}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </NeuButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/30">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase">#</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase">Student</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase hidden md:table-cell">Email</th>
                    <th className="text-left py-3 px-6 text-xs font-semibold text-muted-foreground uppercase">Time</th>
                    <th className="text-right py-3 px-6 text-xs font-semibold text-muted-foreground uppercase">Location</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {renderedRecords}
                </tbody>
              </table>
              {records.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  No attendance records found for this session.
                </div>
              )}
            </div>
          </NeuCard>
        </div>
      )}
    </div>
  )
}
