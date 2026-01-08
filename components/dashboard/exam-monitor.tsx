'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Exam, ExamSession } from '@/lib/types'
import { cn } from '@/lib/utils'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuCard } from '@/components/ui/neu-card'
import {
    Users,
    Play,
    Square,
    RefreshCw,
    AlertTriangle,
    CheckCircle,
    Clock,
    EyeOff,
    Search
} from 'lucide-react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

interface ExamMonitorProps {
    examId: string
}

export default function ExamMonitor({ examId }: ExamMonitorProps) {
    const supabase = createClient()
    const { t } = useTranslation()

    const [exam, setExam] = useState<Exam | null>(null)
    const [sessions, setSessions] = useState<ExamSession[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')

    useEffect(() => {
        fetchData()

        const channel = supabase
            .channel(`monitor_${examId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'exam_sessions',
                    filter: `exam_id=eq.${examId}`,
                },
                (payload) => {
                    handleRealtimeUpdate(payload)
                }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [examId])

    const handleRealtimeUpdate = (payload: any) => {
        if (payload.eventType === 'INSERT') {
            setSessions(prev => {
                if (prev.find(s => s.id === payload.new.id)) return prev
                return [...prev, payload.new as ExamSession]
            })
            toast.info(t('newStudentJoined') || 'New student joined')
        } else if (payload.eventType === 'UPDATE') {
            setSessions(prev => prev.map(s =>
                s.id === payload.new.id ? { ...s, ...payload.new } : s
            ))

            // Check for new infractions
            const newSession = payload.new as ExamSession
            const oldSession = sessions.find(s => s.id === newSession.id)
            const newInfractions = (newSession.proctoring_data as any)?.infractions?.length || 0
            const oldInfractions = (oldSession?.proctoring_data as any)?.infractions?.length || 0

            if (newInfractions > oldInfractions) {
                toast.error(t('infractionDetected') || `Infraction detected: ${newSession.guest_name || newSession.guest_email}`, {
                    description: t('infractionDescription') || "Student switched tabs or lost focus."
                })
            }
        }
    }

    const fetchData = async () => {
        try {
            const [examRes, sessionsRes] = await Promise.all([
                fetch(`/api/exams/${examId}`),
                fetch(`/api/exams/${examId}/sessions`)
            ])

            if (examRes.ok) {
                const data = await examRes.json()
                setExam(data.exam)
            }
            if (sessionsRes.ok) {
                setSessions(await sessionsRes.json())
            }
        } catch (error) {
            console.error('Error fetching monitor data:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchSessions = async () => {
        // Background refresh
        try {
            const res = await fetch(`/api/exams/${examId}/sessions`)
            if (res.ok) setSessions(await res.json())
        } catch (e) {
            console.error("Bg refresh failed", e)
        }
    }

    const updateStatus = async (status: 'upcoming' | 'active' | 'ended') => {
        if (!exam) return
        try {
            const res = await fetch(`/api/exams/${examId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            })

            if (res.ok) {
                setExam({ ...exam, status })
                toast.success(t('examStatusUpdated') || `Exam is now ${status.toUpperCase()}`)
            } else {
                toast.error(t('updateStatusFailed') || 'Failed to update status')
            }
        } catch (e) {
            toast.error(t('updateStatusError') || 'Error updating status')
        }
    }

    const filteredSessions = sessions.filter(s =>
        (s.guest_email || 'Student').toLowerCase().includes(filter.toLowerCase()) ||
        (s.guest_name || 'Guest').toLowerCase().includes(filter.toLowerCase())
    )

    if (loading) return <div className="p-8 text-center text-muted-foreground">{t('loadingMonitor') || 'Loading monitor...'}</div>
    if (!exam) return <div className="p-8 text-center text-destructive">{t('examNotFound') || 'Exam not found'}</div>

    const activeCount = sessions.filter(s => s.status === 'in_progress').length
    const completedCount = sessions.filter(s => s.status === 'completed').length
    const infractionCount = sessions.reduce((acc, s) => {
        const data = s.proctoring_data as any
        return acc + (data?.infractions?.length || 0)
    }, 0)

    return (
        <div className="space-y-6">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        {exam.title}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border uppercase ${exam.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                            exam.status === 'ended' ? 'bg-red-100 text-red-700 border-red-200' :
                                'bg-amber-100 text-amber-700 border-amber-200'
                            }`}>
                            {t(exam.status || '')}
                        </span>
                    </h1>
                    <p className="text-muted-foreground text-sm flex items-center gap-2">
                        {t('code') || 'Code'}: <code className="bg-muted px-1 rounded">{exam.room_code || 'N/A'}</code>
                        • {t('duration') || 'Duration'}: {exam.duration_minutes}m
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {exam.status === 'upcoming' && (
                        <NeuButton
                            className="bg-green-600 hover:bg-green-700 gap-2 text-white"
                            onClick={() => updateStatus('active')}
                        >
                            <Play className="w-4 h-4" /> {t('startExam') || 'Start Exam'}
                        </NeuButton>
                    )}

                    {exam.status === 'active' && (
                        <NeuButton
                            className="bg-red-600 hover:bg-red-700 gap-2 text-white"
                            onClick={() => updateStatus('ended')}
                        >
                            <Square className="w-4 h-4" /> {t('endExam') || 'End Exam'}
                        </NeuButton>
                    )}

                    {exam.status === 'ended' && (
                        <NeuButton
                            variant="outline"
                            className="gap-2"
                            onClick={() => updateStatus('active')}
                        >
                            <RefreshCw className="w-4 h-4" /> {t('resumeExam') || 'Resume'}
                        </NeuButton>
                    )}

                    {/* Manual refresh button for debugging */}
                    <NeuButton
                        variant="ghost"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                            console.log('Manual refresh triggered')
                            fetchSessions()
                        }}
                        title={t('manualRefresh') || "Manually refresh session data"}
                    >
                        <RefreshCw className="w-4 h-4" /> {t('refresh') || 'Refresh'}
                    </NeuButton>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <NeuCard className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{sessions.length}</p>
                        <p className="text-xs text-muted-foreground">{t('joined') || 'Joined'}</p>
                    </div>
                </NeuCard>
                <NeuCard className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <Clock className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{activeCount}</p>
                        <p className="text-xs text-muted-foreground">{t('active') || 'Active'}</p>
                    </div>
                </NeuCard>
                <NeuCard className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                        <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{completedCount}</p>
                        <p className="text-xs text-muted-foreground">{t('finished') || 'Finished'}</p>
                    </div>
                </NeuCard>
                <NeuCard className="p-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                        <EyeOff className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{infractionCount}</p>
                        <p className="text-xs text-muted-foreground">{t('infractions') || 'Infractions'}</p>
                    </div>
                </NeuCard>
            </div>

            {/* Student List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">{t('liveParticipants') || 'Live Participants'}</h2>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder={t('searchStudentPlaceholder') || "Search student..."}
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background text-sm"
                        />
                    </div>
                </div>

                <div className="grid gap-3">
                    {filteredSessions.map(session => {
                        const data = session.proctoring_data as any
                        const infractions = data?.infractions?.length || 0
                        return (
                            <NeuCard key={session.id} className={cn(
                                "p-4 flex items-center justify-between transition-all duration-300",
                                infractions > 0 ? "border-l-4 border-l-red-500 bg-red-50/10" : ""
                            )}>
                                <div className="flex items-center gap-4">
                                    <div className={`w-2 h-2 rounded-full ${session.status === 'completed' ? 'bg-green-500' :
                                        session.status === 'in_progress' ? 'bg-blue-500 animate-pulse' :
                                            'bg-muted'
                                        }`} />
                                    <div>
                                        <p className="font-medium">{session.guest_name || session.guest_email || t('unknown') || 'Unknown'}</p>
                                        <p className="text-xs text-muted-foreground">{session.guest_email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-sm font-medium">{t('status') || 'Status'}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{t(session.status)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-medium">{t('score') || 'Score'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {session.score !== null ? `${Math.round((session.score / (session.total_points || 1)) * 100)}%` : '--'}
                                        </p>
                                    </div>
                                    <div className={`text-right ${infractions > 0 ? 'text-red-700 font-bold' : 'text-muted-foreground'}`}>
                                        <div className="flex items-center justify-end gap-1">
                                            <EyeOff className={cn("w-3 h-3", infractions > 0 && "animate-pulse")} />
                                            <p className="text-sm">{infractions}</p>
                                        </div>
                                        <p className="text-xs opacity-75">{t('alerts') || 'Alerts'}</p>
                                    </div>
                                </div>
                            </NeuCard>
                        )
                    })}

                    {filteredSessions.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            {t('noParticipantsFound') || 'No participants found.'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}