'use client'

import { useState, useEffect } from 'react'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import {
    Loader2,
    Calendar,
    Users,
    MapPin,
    Clock,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    XCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow, format } from 'date-fns'

interface AttendanceSession {
    id: string
    session_name: string
    session_code: string
    teacher_latitude: number
    teacher_longitude: number
    geofence_radius_meters: number
    expires_at: string
    is_active: boolean
    created_at: string
    attendanceCount: number
    geofencing_enabled: boolean
}

interface Attendee {
    id: string
    studentId: string
    studentName: string
    studentEmail?: string
    latitude: number
    longitude: number
    distanceMeters: number
    markedAt: string
}

export default function AttendanceSessionsList() {
    const [sessions, setSessions] = useState<AttendanceSession[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedSession, setExpandedSession] = useState<string | null>(null)
    const [attendees, setAttendees] = useState<{ [key: string]: Attendee[] }>({})
    const [loadingAttendees, setLoadingAttendees] = useState<string | null>(null)

    useEffect(() => {
        fetchSessions()
    }, [])

    const fetchSessions = async () => {
        try {
            const res = await fetch('/api/attendance/sessions')
            if (res.ok) {
                const data = await res.json()
                setSessions(data.sessions || [])
            } else {
                toast.error('Failed to load attendance sessions')
            }
        } catch (error) {
            console.error('Error fetching sessions:', error)
            toast.error('Failed to load attendance sessions')
        } finally {
            setLoading(false)
        }
    }

    const fetchAttendees = async (sessionId: string) => {
        if (attendees[sessionId]) {
            // Already loaded, just expand
            setExpandedSession(expandedSession === sessionId ? null : sessionId)
            return
        }

        setLoadingAttendees(sessionId)
        try {
            const res = await fetch(`/api/attendance/sessions/${sessionId}/attendees`)
            if (res.ok) {
                const data = await res.json()
                setAttendees(prev => ({ ...prev, [sessionId]: data.attendees || [] }))
                setExpandedSession(sessionId)
            } else {
                toast.error('Failed to load attendees')
            }
        } catch (error) {
            console.error('Error fetching attendees:', error)
            toast.error('Failed to load attendees')
        } finally {
            setLoadingAttendees(null)
        }
    }

    const toggleSession = (sessionId: string) => {
        if (expandedSession === sessionId) {
            setExpandedSession(null)
        } else {
            fetchAttendees(sessionId)
        }
    }

    const isExpired = (expiresAt: string) => {
        return new Date(expiresAt) < new Date()
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading sessions...</span>
            </div>
        )
    }

    if (sessions.length === 0) {
        return (
            <NeuCard className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No attendance sessions yet</h3>
                <p className="text-muted-foreground">
                    Create your first attendance session using the form above.
                </p>
            </NeuCard>
        )
    }

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Previous Sessions
            </h2>

            {sessions.map((session) => {
                const expired = isExpired(session.expires_at)
                const isExpanded = expandedSession === session.id
                const sessionAttendees = attendees[session.id] || []

                return (
                    <NeuCard key={session.id} className="overflow-hidden">
                        {/* Session Header */}
                        <button
                            onClick={() => toggleSession(session.id)}
                            className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex-1 text-left">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-semibold">{session.session_name}</h3>
                                    {expired ? (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                            Expired
                                        </span>
                                    ) : (
                                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                            Active
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                        <Users className="h-4 w-4" />
                                        {session.attendanceCount} attendees
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {session.geofencing_enabled
                                            ? `${session.geofence_radius_meters}m radius`
                                            : 'Geofencing Disabled'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {loadingAttendees === session.id ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : isExpanded ? (
                                    <ChevronUp className="h-5 w-5" />
                                ) : (
                                    <ChevronDown className="h-5 w-5" />
                                )}
                            </div>
                        </button>

                        {/* Expandable Attendees List */}
                        {isExpanded && (
                            <div className="border-t border-border">
                                {sessionAttendees.length === 0 ? (
                                    <div className="p-4 text-center text-muted-foreground">
                                        <XCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No attendees recorded for this session</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-border">
                                        <div className="p-3 bg-muted/30 text-xs font-medium text-muted-foreground grid grid-cols-12 gap-2">
                                            <span className="col-span-1">#</span>
                                            <span className="col-span-4">Student</span>
                                            <span className="col-span-3">Time</span>
                                            <span className="col-span-2">Distance</span>
                                            <span className="col-span-2">Status</span>
                                        </div>
                                        {sessionAttendees.map((attendee, index) => (
                                            <div
                                                key={attendee.id}
                                                className="p-3 grid grid-cols-12 gap-2 items-center text-sm hover:bg-muted/20"
                                            >
                                                <span className="col-span-1 text-muted-foreground">
                                                    {index + 1}
                                                </span>
                                                <div className="col-span-4">
                                                    <p className="font-medium truncate">{attendee.studentName}</p>
                                                    {attendee.studentEmail && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {attendee.studentEmail}
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="col-span-3 text-muted-foreground">
                                                    {format(new Date(attendee.markedAt), 'HH:mm:ss')}
                                                </span>
                                                <span className="col-span-2">
                                                    {attendee.distanceMeters
                                                        ? `${Math.round(attendee.distanceMeters)}m`
                                                        : 'N/A'}
                                                </span>
                                                <span className="col-span-2">
                                                    <span className="flex items-center gap-1 text-green-600">
                                                        <CheckCircle className="h-4 w-4" />
                                                        Present
                                                    </span>
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </NeuCard>
                )
            })}
        </div>
    )
}
