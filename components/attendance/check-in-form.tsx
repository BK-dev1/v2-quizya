'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuInput } from '@/components/ui/neu-input'
import { Label } from '@/components/ui/label'
import {
  CheckCircle2,
  Loader2,
  MapPin,
  QrCode,
  AlertCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

export default function CheckInForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [studentName, setStudentName] = useState('')
  const [studentEmail, setStudentEmail] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [gettingLocation, setGettingLocation] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const session = searchParams.get('session')
    const t = searchParams.get('token')
    
    if (session && t) {
      setSessionId(session)
      setToken(t)
    } else {
      setError('Invalid QR code. Please scan again.')
    }
  }, [searchParams])

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    setGettingLocation(true)
    toast.info('Getting your location...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setGettingLocation(false)
        toast.success('Location captured')
      },
      (error) => {
        console.error('Location error:', error)
        setGettingLocation(false)
        
        let message = 'Failed to get location'
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Please enable location access to check in'
            break
          case error.POSITION_UNAVAILABLE:
            message = 'Location unavailable'
            break
          case error.TIMEOUT:
            message = 'Location request timed out'
            break
        }
        toast.error(message)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!sessionId || !token) {
      toast.error('Invalid session. Please scan QR code again.')
      return
    }

    if (!studentName.trim()) {
      toast.error('Please enter your name')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          token,
          studentName: studentName.trim(),
          studentEmail: studentEmail.trim() || null,
          locationLat: location?.lat,
          locationLng: location?.lng
        })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        toast.success('Attendance recorded successfully!')
      } else {
        setError(data.error || 'Failed to record attendance')
        toast.error(data.error || 'Failed to record attendance')
      }
    } catch (error) {
      console.error('Error checking in:', error)
      setError('Network error. Please try again.')
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!sessionId || !token) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <NeuCard className="max-w-md w-full p-8 text-center">
          <XCircle className="h-16 w-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Invalid QR Code</h2>
          <p className="text-muted-foreground">
            Please scan a valid attendance QR code
          </p>
        </NeuCard>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <NeuCard className="max-w-md w-full p-8 text-center">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Check-in Successful!</h2>
          <p className="text-muted-foreground mb-6">
            Your attendance has been recorded
          </p>
          <NeuButton onClick={() => router.push('/')} className="w-full">
            Done
          </NeuButton>
        </NeuCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <NeuCard className="max-w-md w-full p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <QrCode className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Attendance Check-in</h2>
          <p className="text-muted-foreground">
            Fill in your details to record attendance
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <NeuInput
              id="name"
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder="Enter your full name"
              required
              disabled={submitting}
            />
          </div>

          <div>
            <Label htmlFor="email">Email (Optional)</Label>
            <NeuInput
              id="email"
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              placeholder="your.email@example.com"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label>Location Verification</Label>
            <NeuButton
              type="button"
              variant="outline"
              onClick={handleGetLocation}
              disabled={gettingLocation || location !== null || submitting}
              className="w-full"
            >
              {gettingLocation ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting Location...
                </>
              ) : location ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  Location Captured
                </>
              ) : (
                <>
                  <MapPin className="mr-2 h-4 w-4" />
                  Get My Location
                </>
              )}
            </NeuButton>
            <p className="text-xs text-muted-foreground text-center">
              Location may be required by your teacher
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          <NeuButton type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking In...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Check In
              </>
            )}
          </NeuButton>
        </form>

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-xs text-muted-foreground">
            By checking in, you confirm your attendance for this session
          </p>
        </div>
      </NeuCard>
    </div>
  )
}
