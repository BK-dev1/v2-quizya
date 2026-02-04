'use client'

import { useState, useEffect } from 'react'
import {
    Calendar,
    Plus,
    Search,
    Filter,
    BarChart3,
    ChevronRight,
    ArrowLeft,
    Users,
    BookOpen,
    LayoutGrid,
    Loader2,
    QrCode,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuInput } from '@/components/ui/neu-input'
import { toast } from 'sonner'
import { format } from 'date-fns'
import AttendanceTable from './AttendanceTable'
import AttendanceQRGenerator from './qr-generator'
import AttendanceAnalytics from './AttendanceAnalytics'

interface AttendanceSession {
    id: string
    session_name: string
    session_code: string
    module_name?: string
    section_name?: string
    attendanceCount: number
    is_active: boolean
    created_at: string
    expires_at: string
}

type ViewMode = 'overview' | 'detail' | 'create' | 'analytics'

export default function AttendanceDashboard() {
    const [view, setView] = useState<ViewMode>('overview')
    const [sessions, setSessions] = useState<AttendanceSession[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedSession, setSelectedSession] = useState<AttendanceSession | null>(null)
    const [attendees, setAttendees] = useState<any[]>([])
    const [loadingAttendees, setLoadingAttendees] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchSessions()
    }, [])

    const fetchSessions = async (): Promise<AttendanceSession[]> => {
        setLoading(true)
        try {
            const res = await fetch('/api/attendance/sessions')
            if (res.ok) {
                const data = await res.json()
                const fetchedSessions = data.sessions || []
                setSessions(fetchedSessions)
                return fetchedSessions
            }
        } catch (error) {
            toast.error('Failed to load sessions')
        } finally {
            setLoading(false)
        }
        return []
    }

    const handleSelectSession = async (session: AttendanceSession) => {
        setSelectedSession(session)
        setView('detail')
        setLoadingAttendees(true)
        try {
            await fetchAttendees(session.id)
        } catch (error) {
            toast.error('Failed to load attendees')
        } finally {
            setLoadingAttendees(false)
        }
    }

    const fetchAttendees = async (sessionId: string) => {
        const res = await fetch(`/api/attendance/sessions/${sessionId}/attendees`)
        if (res.ok) {
            const data = await res.json()
            setAttendees(data.attendees || [])
        }
    }

    // Realtime subscription (matches ExamMonitor pattern)
    useEffect(() => {
        if (!selectedSession || view !== 'detail') return

        // Initial fetch
        fetchAttendees(selectedSession.id)

        const supabase = createClient()
        const channel = supabase
            .channel(`attendance_${selectedSession.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'attendance_logs',
                    filter: `session_id=eq.${selectedSession.id}`
                },
                (payload: any) => {
                    // Start a new fetch to get the full joined data (student name, etc.)
                    fetchAttendees(selectedSession.id)
                    toast.success('New student arrived!')
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [selectedSession, view])

    const filteredSessions = sessions.filter(s =>
        s.session_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.module_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.section_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.session_code.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading && view === 'overview') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading attendance data...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    {view === 'overview' ? (
                        <>
                            <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
                            <p className="text-muted-foreground">Track and manage student presence across your modules.</p>
                        </>
                    ) : (
                        <button
                            onClick={() => { setView('overview'); setSelectedSession(null); }}
                            className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-medium">Back to Sessions</span>
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    {view === 'overview' && (
                        <>
                            <NeuButton onClick={() => setView('analytics')} variant="secondary" className="flex-1 md:flex-none gap-2">
                                <BarChart3 className="h-4 w-4" />
                                Analytics
                            </NeuButton>
                            <NeuButton onClick={() => setView('create')} className="flex-1 md:flex-none gap-2">
                                <Plus className="h-4 w-4" />
                                New Session
                            </NeuButton>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content Areas */}
            {view === 'overview' && (
                <div className="space-y-6">
                    {/* Search/Filter Bar */}
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <NeuInput
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search by module, section, or session code..."
                                className="pl-10 h-11"
                            />
                        </div>
                        <NeuButton variant="secondary" className="h-11 px-4">
                            <Filter className="h-4 w-4" />
                        </NeuButton>
                    </div>

                    {/* Sessions Grid */}
                    {filteredSessions.length === 0 ? (
                        <NeuCard className="p-12 text-center border-dashed">
                            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-30" />
                            <h3 className="text-xl font-semibold mb-2">No sessions found</h3>
                            <p className="text-muted-foreground mb-6">Start by creating a new attendance session for your students.</p>
                            <NeuButton onClick={() => setView('create')} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Create First Session
                            </NeuButton>
                        </NeuCard>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredSessions.map((session) => (
                                <NeuCard
                                    key={session.id}
                                    className="group hover:border-primary transition-all cursor-pointer relative overflow-hidden"
                                    onClick={() => handleSelectSession(session)}
                                >
                                    <div className="p-5 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${session.is_active && new Date(session.expires_at) > new Date()
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-muted text-muted-foreground'
                                                }`}>
                                                {session.is_active && new Date(session.expires_at) > new Date() ? 'LIVE' : 'FINISHED'}
                                            </div>
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{session.session_name}</h3>
                                            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                                                <BookOpen className="h-3.5 w-3.5" />
                                                <span>{session.module_name || 'No Module'}</span>
                                                <span className="opacity-30">•</span>
                                                <LayoutGrid className="h-3.5 w-3.5" />
                                                <span>{session.section_name || 'No Section'}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-2 border-t border-border">
                                            <div className="flex items-center gap-1.5 text-sm">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold">{session.attendanceCount}</span>
                                                <span className="text-muted-foreground text-xs uppercase tracking-tighter">Present</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {session.is_active && new Date(session.expires_at) > new Date() && (
                                                    <NeuButton
                                                        variant="secondary"
                                                        className="h-7 px-2 text-[10px] gap-1"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedSession(session);
                                                            setView('create'); // We'll recycle create view as viewer if session passed
                                                        }}
                                                    >
                                                        <QrCode className="h-3 w-3" />
                                                        LIVE QR
                                                    </NeuButton>
                                                )}
                                                <div className="text-xs text-muted-foreground font-mono">
                                                    {format(new Date(session.created_at), 'MMM dd, HH:mm')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ChevronRight className="h-5 w-5 text-primary" />
                                    </div>
                                </NeuCard>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {view === 'create' && (
                <div className="max-w-4xl mx-auto">
                    <AttendanceQRGenerator
                        existingSession={selectedSession || undefined}
                        onCreated={async (sessionId) => {
                            const allSessions = await fetchSessions() as AttendanceSession[]; // Now we await the result
                            if (sessionId) {
                                const newSession = allSessions.find((s: AttendanceSession) => s.id === sessionId)
                                if (newSession) {
                                    setSelectedSession(newSession)
                                    handleSelectSession(newSession)
                                    return
                                }
                            }
                            // Fallback
                            setSelectedSession(null);
                            setView('overview');
                        }}
                    />
                </div>
            )}

            {view === 'detail' && selectedSession && (
                <div className="space-y-6">
                    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
                        <div className="flex flex-col md:flex-row justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-2xl font-bold">{selectedSession.session_name}</h2>
                                    <code className="bg-muted px-2 py-0.5 rounded text-sm font-mono">{selectedSession.session_code}</code>
                                </div>
                                <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1.5">
                                        <BookOpen className="h-4 w-4" />
                                        <strong>Module:</strong> {selectedSession.module_name || 'Unassigned'}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <LayoutGrid className="h-4 w-4" />
                                        <strong>Section:</strong> {selectedSession.section_name || 'Unassigned'}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="h-4 w-4" />
                                        <strong>Date:</strong> {format(new Date(selectedSession.created_at), 'PPPP')}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-6">
                                {selectedSession.is_active && new Date(selectedSession.expires_at) > new Date() && (
                                    <NeuButton onClick={() => setView('create')} className="gap-2">
                                        <QrCode className="h-4 w-4" />
                                        Show QR
                                    </NeuButton>
                                )}
                                <div className="text-center">
                                    <p className="text-3xl font-black text-primary">{selectedSession.attendanceCount}</p>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Attendees</p>
                                </div>
                                <div className="h-10 w-px bg-border"></div>
                                <div className="text-center">
                                    <p className="text-3xl font-black text-foreground">
                                        {format(new Date(selectedSession.created_at), 'HH:mm')}
                                    </p>
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Start Time</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <NeuCard className="p-6">
                        {loadingAttendees ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                <p className="mt-4 text-muted-foreground">Loading attendee list...</p>
                            </div>
                        ) : (
                            <AttendanceTable attendees={attendees} sessionName={selectedSession.session_name} />
                        )}
                    </NeuCard>
                </div>
            )}

            {view === 'analytics' && (
                <AttendanceAnalytics />
            )}
        </div>
    )
}
