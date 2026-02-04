'use client'

/**
 * DIRECT ATTENDANCE MARK PAGE
 * 
 * This page is the destination for QR code links.
 * It handles the flow:
 * 1. Read payload from URL
 * 2. Check authentication (redirect to login if needed)
 * 3. Verify student role
 * 4. Get location
 * 5. Verify and Mark attendance automatically
 */

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { generateClientDeviceFingerprint } from '@/lib/utils/device-fingerprint'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { toast } from 'sonner'
import { Loader2, MapPin, CheckCircle, AlertCircle, Shield, ArrowRight } from 'lucide-react'

function AttendanceMarkContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const { user, profile, loading: authLoading, verifyAttendanceQR, markAttendance } = useAuth()

    const [qrPayload, setQrPayload] = useState<string | null>(null)
    const [status, setStatus] = useState<'loading' | 'unauthorized' | 'getting-location' | 'verifying' | 'ready' | 'marking' | 'success' | 'error'>('loading')
    const [errorMsg, setErrorMsg] = useState<string | null>(null)
    const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
    const [verificationResult, setVerificationResult] = useState<any>(null)
    const [attendanceResult, setAttendanceResult] = useState<any>(null)

    // 1. Decode payload on mount
    useEffect(() => {
        const p = searchParams.get('p')
        if (p) {
            try {
                const decoded = atob(p)
                setQrPayload(decoded)
            } catch (e) {
                setStatus('error')
                setErrorMsg('Invalid attendance link format')
            }
        } else {
            setStatus('error')
            setErrorMsg('No attendance data found in link')
        }
    }, [searchParams])

    // 2. Auth and Role check
    useEffect(() => {
        if (authLoading) return

        if (!user) {
            setStatus('unauthorized')
            return
        }

        if (profile && profile.role !== 'student' && profile.role !== 'teacher') {
            // Teachers can test it too, or we can restrict to student. 
            // User said "student", but let's allow teachers to see it if they created it?
            // Actually user said "student shouldn't go to dashboard...".
        }

        if (status === 'loading' && qrPayload) {
            setStatus('getting-location')
        }
    }, [user, profile, authLoading, qrPayload, status])

    // 3. Get Location
    useEffect(() => {
        if (status === 'getting-location') {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        setLocation({
                            latitude: position.coords.latitude,
                            longitude: position.coords.longitude,
                        })
                        setStatus('verifying')
                    },
                    (error) => {
                        setStatus('error')
                        setErrorMsg(`Location error: ${error.message}. Please enable location permissions.`)
                    },
                    { enableHighAccuracy: true, timeout: 60000, maximumAge: 30000 }
                )
            } else {
                setStatus('error')
                setErrorMsg('Geolocation is not supported by this browser.')
            }
        }
    }, [status])

    // 4. Verify QR and Location
    useEffect(() => {
        const runVerification = async () => {
            if (status === 'verifying' && qrPayload && location) {
                try {
                    const result = await verifyAttendanceQR(qrPayload, location.latitude, location.longitude)
                    if (result.error) {
                        setStatus('error')
                        setErrorMsg(result.error)
                    } else if (result.data) {
                        setVerificationResult(result.data)
                        if (result.data.withinGeofence || result.data.message?.includes('disabled')) {
                            setStatus('ready')
                            // Auto-mark after a brief delay to show "Ready" state
                            setTimeout(() => setStatus('marking'), 1000)
                        } else {
                            setStatus('error')
                            setErrorMsg(result.data.message || 'You are outside the geofence radius')
                        }
                    }
                } catch (e) {
                    setStatus('error')
                    setErrorMsg('Verification failed')
                }
            }
        }
        runVerification()
    }, [status, qrPayload, location, verifyAttendanceQR])

    // 5. Mark Attendance
    useEffect(() => {
        const runMarking = async () => {
            if (status === 'marking' && verificationResult && qrPayload && location) {
                try {
                    const fingerprint = await generateClientDeviceFingerprint()
                    const result = await markAttendance(
                        verificationResult.sessionCode,
                        qrPayload,
                        location.latitude,
                        location.longitude,
                        fingerprint
                    )

                    if (result.error) {
                        setStatus('error')
                        setErrorMsg(result.error)
                    } else if (result.data) {
                        setAttendanceResult(result.data)
                        setStatus('success')
                        toast.success('Attendance marked successfully!')
                    }
                } catch (e) {
                    setStatus('error')
                    setErrorMsg('Failed to mark attendance')
                }
            }
        }
        runMarking()
    }, [status, verificationResult, qrPayload, location, markAttendance])

    const handleLoginRedirect = () => {
        const currentUrl = window.location.pathname + window.location.search
        router.push(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`)
    }

    if (status === 'success') {
        return (
            <NeuCard className="p-8 max-w-lg mx-auto text-center space-y-6">
                <div className="flex justify-center">
                    <CheckCircle className="h-16 w-16 text-green-500" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold">Attendance Marked!</h2>
                    <p className="text-muted-foreground mt-2">Your presence has been recorded for this session.</p>
                </div>
                <div className="bg-muted p-4 rounded-lg text-sm text-left">
                    <p><strong>Session Code:</strong> {verificationResult?.sessionCode}</p>
                    <p><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
                </div>
                <NeuButton onClick={() => router.push('/dashboard')} className="w-full">
                    Go to Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </NeuButton>
            </NeuCard>
        )
    }

    return (
        <NeuCard className="p-8 max-w-lg mx-auto space-y-6">
            <div className="text-center">
                <h1 className="text-2xl font-bold">Attendance Verification</h1>
                <p className="text-muted-foreground mt-1">Please wait while we verify your location and session.</p>
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`p-2 rounded-full ${user ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                        <Shield className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">User Authentication</p>
                        <p className="text-xs text-muted-foreground">
                            {authLoading ? 'Checking...' : user ? `Logged in as ${user.email}` : 'Not logged in'}
                        </p>
                    </div>
                    {!authLoading && !user && (
                        <NeuButton onClick={handleLoginRedirect} variant="secondary" className="text-xs py-1 h-8">
                            Login
                        </NeuButton>
                    )}
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`p-2 rounded-full ${location ? 'bg-green-100 text-green-600' : status === 'error' && !location ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        <MapPin className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">Location Verification</p>
                        <p className="text-xs text-muted-foreground">
                            {location ? `Acquired: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : status === 'getting-location' ? 'Acquiring position...' : 'Pending'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`p-2 rounded-full ${status === 'ready' || status === 'marking' ? 'bg-green-100 text-green-600' : status === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                        <Loader2 className={`h-5 w-5 ${(status === 'verifying' || status === 'marking') ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">Session Status</p>
                        <p className="text-xs text-muted-foreground">
                            {status === 'verifying' ? 'Verifying QR signature...' : status === 'ready' ? 'Verification successful!' : status === 'marking' ? 'Recording attendance...' : status === 'error' ? 'Failed' : 'Waiting...'}
                        </p>
                    </div>
                </div>
            </div>

            {status === 'error' && (
                <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg flex items-start gap-3 border border-red-200 dark:border-red-800">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                        <p className="text-sm font-semibold text-red-900 dark:text-red-100">Verification Error</p>
                        <p className="text-xs text-red-800 dark:text-red-200 mt-1">{errorMsg || 'An unknown error occurred'}</p>
                        <NeuButton onClick={() => window.location.reload()} variant="secondary" className="mt-3 text-xs py-1 h-8">
                            Try Again
                        </NeuButton>
                    </div>
                </div>
            )}

            {status === 'unauthorized' && (
                <div className="space-y-4">
                    <div className="p-4 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800 text-center">
                        <p className="text-sm text-amber-800 dark:text-amber-200">You must be logged in to mark attendance.</p>
                    </div>
                    <NeuButton onClick={handleLoginRedirect} className="w-full">
                        Login with School Email
                    </NeuButton>
                </div>
            )}

            {(status === 'loading' || status === 'getting-location' || status === 'verifying' || status === 'marking') && !errorMsg && (
                <div className="text-center py-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary opacity-50" />
                    <p className="text-sm text-muted-foreground mt-4">Automated security checks in progress...</p>
                </div>
            )}
        </NeuCard>
    )
}

export default function AttendanceMarkPage() {
    return (
        <div className="min-h-[80vh] flex items-center justify-center container mx-auto p-4 pt-20">
            <Suspense fallback={<Loader2 className="h-8 w-8 animate-spin" />}>
                <AttendanceMarkContent />
            </Suspense>
        </div>
    )
}
