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
import { Loader2, QrCode, MapPin, Clock, Shield } from 'lucide-react'

export default function AttendanceQRGenerator() {
  const { profile, generateAttendanceQR } = useAuth()
  const [sessionName, setSessionName] = useState('')
  const [radius, setRadius] = useState(50)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrData, setQrData] = useState<any>(null)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [remainingTime, setRemainingTime] = useState<number>(0)

  // Get user's current location
  useEffect(() => {
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
        { enableHighAccuracy: true, timeout: 10000 }
      )
    } else {
      setLocationError('Geolocation is not supported by this browser.')
      toast.error('Geolocation is not supported by this browser.')
    }
  }, [])

  // Countdown timer for session expiration
  useEffect(() => {
    if (qrData?.expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime()
        const expiresAt = new Date(qrData.expiresAt).getTime()
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000))
        setRemainingTime(remaining)

        if (remaining === 0) {
          toast.warning('QR code session has expired')
          clearInterval(interval)
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [qrData])

  const handleGenerate = async () => {
    if (!sessionName.trim()) {
      toast.error('Please enter a session name')
      return
    }

    if (!location) {
      toast.error('Location not available. Please enable location permissions.')
      return
    }

    setIsGenerating(true)
    try {
      const result = await generateAttendanceQR(
        sessionName,
        location.latitude,
        location.longitude,
        radius,
        durationMinutes
      )

      if (result.error) {
        toast.error(result.error)
      } else if (result.data) {
        setQrData(result.data)
        toast.success('QR code generated successfully!')
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
          <div className="flex justify-center">
            <div className="p-4 bg-white rounded-lg shadow-lg">
              <img
                src={qrData.qrDataUrl}
                alt="Attendance QR Code"
                className="w-80 h-80"
              />
            </div>
          </div>

          {/* Session Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2 text-sm">
              <Shield className="h-4 w-4 text-blue-500" />
              <span className="font-medium">Session Code:</span>
              <code className="bg-muted px-2 py-1 rounded">{qrData.sessionCode}</code>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <MapPin className="h-4 w-4 text-green-500" />
              <span className="font-medium">Geofence:</span>
              <span>{radius}m radius</span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="font-medium">Expires in:</span>
              <span className={remainingTime < 60 ? 'text-red-500 font-bold' : ''}>
                {formatTime(remainingTime)}
              </span>
            </div>

            <div className="flex items-center space-x-2 text-sm">
              <QrCode className="h-4 w-4 text-purple-500" />
              <span className="font-medium">Location:</span>
              <span className="text-xs">
                {location?.latitude.toFixed(4)}, {location?.longitude.toFixed(4)}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
              Instructions for Students:
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>Scan this QR code with your device</li>
              <li>Ensure location permissions are enabled</li>
              <li>Be within {radius} meters of your location</li>
              <li>Submit attendance before the QR expires</li>
            </ol>
          </div>

          {/* Security Notice */}
          <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Features Active:
            </h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-amber-800 dark:text-amber-200">
              <li>TOTP rotation every 15 seconds</li>
              <li>Geofencing validation (Haversine formula)</li>
              <li>Device fingerprinting enabled</li>
              <li>HMAC-SHA256 signature verification</li>
            </ul>
          </div>

          <NeuButton onClick={handleReset} variant="secondary" className="w-full">
            End Session & Generate New QR
          </NeuButton>
        </div>
      </NeuCard>
    )
  }

  return (
    <NeuCard className="p-8 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Generate Attendance QR Code</h2>
          <p className="text-muted-foreground">
            Create a secure, time-based QR code for student attendance
          </p>
        </div>

        {/* Location Status */}
        {locationError ? (
          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm">{locationError}</p>
          </div>
        ) : location ? (
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 dark:text-green-200">
                Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200 text-sm">Getting location...</p>
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
              placeholder="e.g., CS101 Lecture - Week 5"
              required
            />
          </div>

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
          disabled={isGenerating || !location}
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
    </NeuCard>
  )
}
