'use client'

/**
 * TEACHER ATTENDANCE QR GENERATOR COMPONENT
 * 
 * Allows teachers to:
 * 1. Generate TOTP-based QR codes for attendance
 * 2. Configure geofencing parameters
 * 3. Set session duration
 * 4. Display rotating QR codes (updates every 15 seconds)
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuInput } from '@/components/ui/neu-input'
import { toast } from 'sonner'
import { Loader2, QrCode, MapPin, Clock } from 'lucide-react'

export default function AttendanceQRGenerator({
  onCreated,
  existingSession
}: {
  onCreated?: (sessionId?: string) => void,
  existingSession?: any
}) {
  const { profile, generateAttendanceQR } = useAuth()
  const [sessionName, setSessionName] = useState(existingSession?.session_name || '')
  const [radius, setRadius] = useState(existingSession?.geofence_radius_meters || 50)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [moduleName, setModuleName] = useState(existingSession?.module_name || '')
  const [sectionName, setSectionName] = useState(existingSession?.section_name || '')
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrData, setQrData] = useState<any>(null)
  const [geofencingEnabled, setGeofencingEnabled] = useState(existingSession?.geofencing_enabled ?? true)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(
    existingSession ? { latitude: existingSession.teacher_latitude, longitude: existingSession.teacher_longitude } : null
  )
  const [locationError, setLocationError] = useState<string | null>(null)
  const [remainingTime, setRemainingTime] = useState<number>(0)
  const [rotationTimer, setRotationTimer] = useState(20)

  // Get user's current location - only if not resuming
  useEffect(() => {
    if (existingSession) return;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
          setLocationError(null)
        },
        (error) => {
          setLocationError(`Location error: ${error.message}`)
          toast.error('Failed to get location. Please enable location permissions.')
        },
        { enableHighAccuracy: true, timeout: 60000, maximumAge: 30000 }
      )
    } else {
      setLocationError('Geolocation is not supported by this browser.')
      toast.error('Geolocation is not supported by this browser.')
    }
  }, [existingSession])

  // Initial fetch for existing session
  useEffect(() => {
    if (existingSession && !qrData) {
      fetchFreshQR(existingSession.id);
    }
  }, [existingSession])

  const fetchFreshQR = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/attendance/sessions/${sessionId}/qr`);
      if (res.ok) {
        const data = await res.json();
        setQrData(data);
      } else {
        toast.error('Failed to load session QR');
      }
    } catch (e) {
      console.error('Fetch QR error:', e);
    }
  }

  // Countdown timer for session expiration and QR rotation
  useEffect(() => {
    if (qrData?.expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime()
        const expiresAt = new Date(qrData.expiresAt).getTime()
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
        setRemainingTime(remaining)

        // Rotate QR every 20 seconds if session is active
        setRotationTimer((prev) => {
          if (prev <= 1) {
            fetchFreshQR(qrData.sessionId || existingSession?.id);
            return 20;
          }
          return prev - 1;
        });

        if (remaining === 0) {
          toast.warning('QR code session has expired')
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [qrData, existingSession])

  const handleGenerate = async () => {
    if (!sessionName.trim()) {
      toast.error('Please enter a session name')
      return
    }

    if (geofencingEnabled && !location) {
      toast.error('Location not available. Please enable location permissions or disable geofencing.')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateAttendanceQR(
        sessionName,
        geofencingEnabled ? location?.latitude ?? null : null,
        geofencingEnabled ? location?.longitude ?? null : null,
        radius,
        durationMinutes,
        geofencingEnabled,
        moduleName,
        sectionName
      )

      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        setQrData(result.data)
        toast.success('QR code generated successfully!')
        // Removed auto-redirect: allow user to see the QR code first
      }
    } catch (error) {
      toast.error('Failed to generate QR code')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReset = () => {
    setQrData(null)
    setSessionName('')
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  // Only teachers can access this component
  if (profile?.role !== 'teacher') {
    return (
      <NeuCard className="p-8">
        <p className="text-center text-muted-foreground">
          Only teachers can generate attendance QR codes.
        </p>
      </NeuCard>
    )
  }

  if (qrData) {
    return (
      <NeuCard className="p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Attendance Session Active</h2>
            <p className="text-muted-foreground">{sessionName}</p>
          </div>

          {/* QR Code Display */}
          <div className="flex flex-col items-center justify-center p-6  rounded-2xl shadow-xl border-4 border-primary/10">
            <div className="relative group">
              <div className="absolute -inset-1 bg-linear-to-r from-primary to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-white p-4 rounded-xl">
                <img
                  src={qrData.qrDataUrl}
                  alt="Attendance QR Code"
                  className="w-96 h-96 transition-all duration-500"
                />
              </div>
            </div>

            {/* Rotation Timer Progress Bar */}
            <div className="mt-8 w-full max-w-sm flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-muted/80 px-4 py-1.5 rounded-full border border-border/50">
                <Clock className="w-4 h-4 animate-pulse text-primary" />
                <span><span className="text-primary font-bold text-2xl tabular-nums">{rotationTimer}s</span></span>
              </div>
              <div className="w-full h-2 bg-foreground rounded-full overflow-hidden border border-border/10 shadow-inner">
                <div
                  className="h-full bg-linear-to-r from-primary to-primary/60 transition-all duration-1000 ease-linear"
                  style={{ width: `${(rotationTimer / 20) * 100}%` }}
                />
              </div>
              {/* <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold opacity-60">Security rotation active</p> */}
            </div>
          </div>

          {/* Session Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-medium">Session Code:</span>
              <code className="bg-muted px-2 py-1 rounded">{qrData.sessionCode}</code>
            </div>


            <div className="flex items-center space-x-2 text-sm">
              <span className="font-medium">Expires in:</span>
              <span className={remainingTime < 60 ? 'text-red-500 font-bold' : ''}>
                {formatTime(remainingTime)}
              </span>
            </div>

            {qrData.geofencingEnabled && location && (
              <div className="flex items-center space-x-2 text-sm">
                <QrCode className="h-4 w-4 text-purple-500" />
                <span className="font-medium">Location:</span>
                <span className="text-xs">
                  {location?.latitude.toFixed(4)}, {location?.longitude.toFixed(4)}
                </span>
              </div>
            )}
          </div>


          <div className="flex gap-4">
            <NeuButton onClick={handleReset} variant="secondary" className="flex-1">
              End Local View
            </NeuButton>
            {onCreated && (
              <NeuButton onClick={() => onCreated(qrData?.sessionId || existingSession?.id)} className="flex-1">
                {existingSession ? "Back to Dashboard" : "Finish & View Session"}
              </NeuButton>
            )}
          </div>
        </div>
      </NeuCard>
    )
  }

  return (
    <NeuCard className="p-4 md:p-8 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Generate Attendance QR Code</h2>
          <p className="text-muted-foreground">
            Create a secure, time-based QR code for student attendance
          </p>
        </div>

        {/* Geofencing Toggle */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="space-y-0.5">
              <div className="text-sm font-medium">Geofencing (Location Verification)</div>
              <div className="text-xs text-muted-foreground">
                {geofencingEnabled
                  ? "Students must be physically present at your location"
                  : "Students can mark attendance from any location"}
              </div>
            </div>
            <div
              onClick={() => setGeofencingEnabled(!geofencingEnabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${geofencingEnabled ? 'bg-primary' : 'bg-muted-foreground/30'}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${geofencingEnabled ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </div>
          </label>
        </div>

        {/* Location Status - Only show if geofencing is enabled */}
        {geofencingEnabled && (
          <>
            {locationError ? (
              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg flex flex-col gap-3">
                <p className="text-red-800 dark:text-red-200 text-sm font-medium">{locationError}</p>
                <div className="flex gap-2">
                  <NeuButton
                    onClick={() => window.location.reload()}
                    variant="secondary"
                    className="text-xs py-1"
                  >
                    Retry Location
                  </NeuButton>
                  <NeuButton
                    onClick={() => setGeofencingEnabled(false)}
                    variant="secondary"
                    className="text-xs py-1"
                  >
                    Skip Geofencing
                  </NeuButton>
                </div>
              </div>
            ) : location ? (
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-800 dark:text-green-200 font-medium">
                    Location Acquired: {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </span>
                </div>
                <NeuButton
                  onClick={() => window.location.reload()}
                  variant="secondary"
                  className="h-8 w-8 p-0"
                >
                  <Clock className="h-4 w-4" />
                </NeuButton>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <p className="text-blue-800 dark:text-blue-200 text-sm font-medium font-medium">Acquiring highly accurate position...</p>
              </div>
            )}
          </>
        )}

        {!geofencingEnabled && (
          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
              ⚠️ Geofencing Disabled: Students will be able to mark attendance from anywhere.
              Only TOTP security will be active.
            </p>
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Session Name</label>
            <NeuInput
              type="text"
              value={sessionName}
              onChange={(e) => setSessionName(e.target.value)}
              placeholder="e.g., Week 5 Lecture"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Module</label>
              <NeuInput
                type="text"
                value={moduleName}
                onChange={(e) => setModuleName(e.target.value)}
                placeholder="e.g., Computer Science"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Section</label>
              <NeuInput
                type="text"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="e.g., G01"
              />
            </div>
          </div>

          {geofencingEnabled && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Geofence Radius (meters)
              </label>
              <NeuInput
                type="number"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value) || 50)}
                min={10}
                max={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Students must be within this distance to mark attendance
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">
              Session Duration (minutes)
            </label>
            <NeuInput
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 60)}
              min={5}
              max={240}
            />
            <p className="text-xs text-muted-foreground mt-1">
              How long the QR code session remains valid
            </p>
          </div>
        </div>

        <NeuButton
          onClick={handleGenerate}
          disabled={isGenerating || (geofencingEnabled && !location)}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Generating...
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4 mr-2" />
              Generate Secure QR Code
            </>
          )}
        </NeuButton>
      </div>
    </NeuCard >
  )
}
