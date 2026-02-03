'use client'

/**
 * STUDENT ATTENDANCE SCANNER COMPONENT
 * 
 * Allows students to:
 * 1. Scan QR codes for attendance
 * 2. Verify location and QR validity
 * 3. Mark attendance with device fingerprinting
 * 4. View attendance confirmation
 */

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { generateClientDeviceFingerprint } from '@/lib/utils/device-fingerprint'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuInput } from '@/components/ui/neu-input'
import { toast } from 'sonner'
import { Loader2, MapPin, CheckCircle, AlertCircle, Scan, Shield } from 'lucide-react'

export default function AttendanceScanner() {
  const { profile, verifyAttendanceQR, markAttendance } = useAuth()
  const [qrInput, setQrInput] = useState('')
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isMarking, setIsMarking] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [attendanceResult, setAttendanceResult] = useState<any>(null)
  const [deviceFingerprint, setDeviceFingerprint] = useState<string>('')

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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    } else {
      setLocationError('Geolocation is not supported by this browser.')
      toast.error('Geolocation is not supported by this browser.')
    }
  }, [])

  // Generate device fingerprint on mount
  useEffect(() => {
    const generateFingerprint = async () => {
      try {
        const fingerprint = await generateClientDeviceFingerprint()
        setDeviceFingerprint(fingerprint)
      } catch (error) {
        console.error('Failed to generate device fingerprint:', error)
        toast.warning('Device fingerprinting unavailable. Some security features may be limited.')
      }
    }

    generateFingerprint()
  }, [])

  const handleVerify = async () => {
    if (!qrInput.trim()) {
      toast.error('Please enter or scan a QR code')
      return
    }

    if (!location) {
      toast.error('Location not available. Please enable location permissions.')
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)
    setAttendanceResult(null)

    try {
      const result = await verifyAttendanceQR(qrInput, location.latitude, location.longitude)

      if (result.error) {
        toast.error(result.error)
        setVerificationResult({ success: false, error: result.error })
      } else if (result.data) {
        setVerificationResult(result.data)
        
        if (result.data.withinGeofence) {
          toast.success('QR code and location verified! Ready to mark attendance.')
        } else {
          toast.warning(result.data.message || 'You are outside the geofence radius')
        }
      }
    } catch (error) {
      toast.error('Verification failed')
      setVerificationResult({ success: false, error: 'Verification failed' })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleMarkAttendance = async () => {
    if (!verificationResult || !verificationResult.withinGeofence) {
      toast.error('Please verify QR code and location first')
      return
    }

    if (!deviceFingerprint) {
      toast.error('Device fingerprint not available. Please refresh the page.')
      return
    }

    setIsMarking(true)

    try {
      const result = await markAttendance(
        verificationResult.sessionCode,
        qrInput,
        location!.latitude,
        location!.longitude,
        deviceFingerprint
      )

      if (result.error) {
        toast.error(result.error)
        setAttendanceResult({ success: false, error: result.error })
      } else if (result.data) {
        setAttendanceResult(result.data)
        toast.success('Attendance marked successfully! 🎉')
      }
    } catch (error) {
      toast.error('Failed to mark attendance')
      setAttendanceResult({ success: false, error: 'Failed to mark attendance' })
    } finally {
      setIsMarking(false)
    }
  }

  const handleReset = () => {
    setQrInput('')
    setVerificationResult(null)
    setAttendanceResult(null)
  }

  // Only students can access this component
  if (profile?.role !== 'student') {
    return (
      <NeuCard className="p-8">
        <p className="text-center text-muted-foreground">
          Only students can mark attendance.
        </p>
      </NeuCard>
    )
  }

  // Show success screen after marking attendance
  if (attendanceResult?.success) {
    return (
      <NeuCard className="p-8 max-w-2xl mx-auto">
        <div className="space-y-6 text-center">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-2">Attendance Marked! ✓</h2>
            <p className="text-muted-foreground">
              Your attendance has been successfully recorded
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="font-medium text-green-900 dark:text-green-100">Attendance ID:</span>
                <code className="text-green-800 dark:text-green-200">
                  {attendanceResult.attendanceId?.slice(0, 8)}...
                </code>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-green-900 dark:text-green-100">Marked At:</span>
                <span className="text-green-800 dark:text-green-200">
                  {new Date(attendanceResult.markedAt).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium text-green-900 dark:text-green-100">Distance:</span>
                <span className="text-green-800 dark:text-green-200">
                  {attendanceResult.distance?.toFixed(2)}m from teacher
                </span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-left text-sm">
                <p className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Security Verifications Passed:
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                  <li>TOTP code validated</li>
                  <li>Geofence verification passed</li>
                  <li>Device fingerprint recorded</li>
                  <li>Location coordinates verified</li>
                </ul>
              </div>
            </div>
          </div>

          <NeuButton onClick={handleReset} className="w-full">
            Mark Another Attendance
          </NeuButton>
        </div>
      </NeuCard>
    )
  }

  return (
    <NeuCard className="p-8 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Mark Attendance</h2>
          <p className="text-muted-foreground">
            Scan or enter the QR code from your teacher
          </p>
        </div>

        {/* Location Status */}
        {locationError ? (
          <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <p className="text-red-800 dark:text-red-200 text-sm">{locationError}</p>
            </div>
          </div>
        ) : location ? (
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 dark:text-green-200">
                Location detected: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
              <p className="text-blue-800 dark:text-blue-200 text-sm">Getting location...</p>
            </div>
          </div>
        )}

        {/* QR Input */}
        <div>
          <label className="block text-sm font-medium mb-2">QR Code Data</label>
          <NeuInput
            type="text"
            value={qrInput}
            onChange={(e) => setQrInput(e.target.value)}
            placeholder="Paste QR code data here or use scanner"
            disabled={isVerifying || isMarking}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Note: Real QR scanning requires camera integration (not implemented in this demo)
          </p>
        </div>

        {/* Verification Result */}
        {verificationResult && (
          <div
            className={
              verificationResult.withinGeofence
                ? 'bg-green-50 dark:bg-green-950 p-4 rounded-lg'
                : 'bg-amber-50 dark:bg-amber-950 p-4 rounded-lg'
            }
          >
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                {verificationResult.withinGeofence ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                )}
                <span className="font-semibold">Verification Result</span>
              </div>
              <div className="space-y-1">
                <p>
                  <span className="font-medium">Distance:</span> {verificationResult.distance}m
                </p>
                <p>
                  <span className="font-medium">Max Distance:</span> {verificationResult.maxDistance}m
                </p>
                <p>
                  <span className="font-medium">Within Geofence:</span>{' '}
                  {verificationResult.withinGeofence ? 'Yes ✓' : 'No ✗'}
                </p>
              </div>
              {verificationResult.message && (
                <p className="text-xs mt-2">{verificationResult.message}</p>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <NeuButton
            onClick={handleVerify}
            disabled={isVerifying || isMarking || !location || !qrInput.trim()}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Verifying...
              </>
            ) : (
              <>
                <Scan className="h-4 w-4 mr-2" />
                Verify QR Code & Location
              </>
            )}
          </NeuButton>

          {verificationResult?.withinGeofence && (
            <NeuButton
              onClick={handleMarkAttendance}
              disabled={isMarking}
              className="w-full"
            >
              {isMarking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Marking Attendance...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark My Attendance
                </>
              )}
            </NeuButton>
          )}
        </div>

        {/* Security Info */}
        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-sm flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security Checks:
          </h3>
          <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
            <li>TOTP code verification (15-second validity)</li>
            <li>Geofencing validation using GPS</li>
            <li>Device fingerprint uniqueness check</li>
            <li>HMAC signature verification</li>
            <li>Rate limiting protection</li>
          </ul>
        </div>
      </div>
    </NeuCard>
  )
}
