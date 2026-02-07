'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import {
    Play,
    RotateCcw,
    Clock,
    Calendar,
    FileQuestion,
    Trophy,
    ArrowRight,
    Zap
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ExamSession } from '@/lib/types'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { useTranslation } from 'react-i18next'

interface LiveQuizResult {
    id: string
    participant_name: string
    total_score: number
    total_correct: number
    joined_at: string
    quiz: {
        id: string
        title: string
        description?: string
        status: string
        ended_at?: string
        show_results_to_students: boolean
        total_questions: number
    }
}

export default function StudentDashboard() {
    const { user, profile } = useAuth()
    const [sessions, setSessions] = useState<ExamSession[]>([])
    const [liveQuizResults, setLiveQuizResults] = useState<LiveQuizResult[]>([])
    const [loading, setLoading] = useState(true)
    const { t } = useTranslation()

    useEffect(() => {
        if (user) {
            loadSessions()
            loadLiveQuizResults()
        }
    }, [user])

    const loadSessions = async () => {
        try {
            const res = await fetch('/api/student/sessions')
            if (res.ok) {
                const data = await res.json()
                setSessions(data)
            } else {
                toast.error(t('failedLoadAnalytics'))
            }
        } catch (error) {
            console.error('Error loading sessions:', error)
            toast.error(t('failedLoadAnalytics'))
        } finally {
            setLoading(false)
        }
    }

    const loadLiveQuizResults = async () => {
        try {
            const res = await fetch('/api/live-quiz/my-results')
            if (res.ok) {
                const data = await res.json()
                setLiveQuizResults(data)
            }
        } catch (error) {
            console.error('Error loading live quiz results:', error)
        }
    }

    if (loading) {
        return <DashboardSkeleton />
    }

    const completedSessions = sessions.filter(s => s.status === 'completed')
    const sessionsWithPoints = completedSessions.filter(s => s.total_points && s.total_points > 0)
    const avgScore = sessionsWithPoints.length > 0
        ? Math.round(sessionsWithPoints.reduce((acc, s) => {
            const percentage = (s.score || 0) / s.total_points! * 100
            return acc + percentage
        }, 0) / sessionsWithPoints.length)
        : 0

    return (
        <div className="min-h-screen p-4">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">
                            {t('welcome')}, {profile?.full_name?.split(' ')[0] || t('student')}!
                        </h1>
                        <p className="text-muted-foreground">{t('dashboardDescription')}</p>
                    </div>
                    <Link href="/join">
                        <NeuButton className="bg-primary text-primary-foreground gap-2">
                            <Play className="w-4 h-4" />
                            {t('joinNewExam')}
                        </NeuButton>
                    </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <NeuCard className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <FileQuestion className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('totalExams')}</p>
                                <p className="text-2xl font-bold">{sessions.length}</p>
                            </div>
                        </div>
                    </NeuCard>

                    <NeuCard className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                                <Trophy className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('averageScore')}</p>
                                <p className="text-2xl font-bold">{avgScore}%</p>
                            </div>
                        </div>
                    </NeuCard>

                    <NeuCard className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{t('latestActivity')}</p>
                                <p className="text-sm font-medium truncate">
                                    {sessions[0] ? new Date(sessions[0].created_at!).toLocaleDateString() : t('noActivity')}
                                </p>
                            </div>
                        </div>
                    </NeuCard>
                </div>

                <h2 className="text-xl font-bold mb-4">{t('examResults')}</h2>

                {sessions.length === 0 ? (
                    <NeuCard className="p-12 text-center">
                        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <RotateCcw className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">{t('noExamData')}</h3>
                        <p className="text-muted-foreground mb-6">
                            {t('noExamsDescription')}
                        </p>
                        <Link href="/join">
                            <NeuButton>{t('findAnExam')}</NeuButton>
                        </Link>
                    </NeuCard>
                ) : (
                    <div className="grid gap-4">
                        {sessions.map((session) => {
                            const exam = (session as any).exam
                            const percentage = session.total_points
                                ? Math.round(((session.score || 0) / session.total_points) * 100)
                                : 0
                            const isPassed = percentage >= (exam?.passing_score || 0)

                            return (
                                <NeuCard key={session.id} className="p-6 transition-all hover:shadow-lg">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-bold">{exam?.title || t('untitledExam')}</h3>
                                                {session.status === 'completed' ? (
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${isPassed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                        }`}>
                                                        {isPassed ? t('passed') : t('failed')}
                                                    </span>
                                                ) : (
                                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-bold uppercase">
                                                        {t(session.status)}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-4 h-4" />
                                                    {new Date(session.created_at!).toLocaleDateString()}
                                                </div>
                                                {session.status === 'completed' && (
                                                    <div className="flex items-center gap-1">
                                                        <Trophy className="w-4 h-4" />
                                                        {percentage}% {t('score')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {session.status === 'in_progress' ? (
                                                <Link href={`/exam/take?session=${session.id}`}>
                                                    <NeuButton className="bg-primary text-primary-foreground gap-2">
                                                        {t('continueExam')} <ArrowRight className="w-4 h-4" />
                                                    </NeuButton>
                                                </Link>
                                            ) : (
                                                <Link href={`/dashboard/exams/${session.exam_id}/results/student/${session.id}`}>
                                                    <NeuButton variant="outline" className="gap-2">
                                                        {t('view')} <ArrowRight className="w-4 h-4" />
                                                    </NeuButton>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </NeuCard>
                            )
                        })}
                    </div>
                )}

                {/* Live Quiz Results Section */}
                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-500" />
                            {t('liveQuizResults') || 'Live Quiz Results'}
                        </h2>
                        {liveQuizResults.length > 0 && (
                            <Link href="/my-results">
                                <NeuButton variant="ghost" size="sm" className="gap-1">
                                    {t('viewAll') || 'View All'} <ArrowRight className="w-4 h-4" />
                                </NeuButton>
                            </Link>
                        )}
                    </div>

                    {liveQuizResults.length === 0 ? (
                        <NeuCard className="p-8 text-center">
                            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{t('noLiveQuizResults') || 'No live quiz results yet'}</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                {t('noLiveQuizResultsDesc') || 'Join a live quiz to see your results here'}
                            </p>
                            <Link href="/join-quiz">
                                <NeuButton size="sm">{t('joinLiveQuiz') || 'Join Live Quiz'}</NeuButton>
                            </Link>
                        </NeuCard>
                    ) : (
                        <div className="grid gap-4">
                            {liveQuizResults.slice(0, 3).map((result) => {
                                const percentage = result.quiz.total_questions > 0
                                    ? Math.round((result.total_correct / result.quiz.total_questions) * 100)
                                    : 0
                                
                                return (
                                    <NeuCard key={result.id} className="p-4 transition-all hover:shadow-lg">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Zap className="w-4 h-4 text-yellow-500" />
                                                    <h3 className="font-semibold">{result.quiz.title}</h3>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(result.joined_at).toLocaleDateString()}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Trophy className="w-3 h-3" />
                                                        {result.total_correct}/{result.quiz.total_questions} {t('correct') || 'correct'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className="text-center">
                                                    <p className="text-2xl font-bold text-primary">{result.total_score}</p>
                                                    <p className="text-xs text-muted-foreground">{t('points') || 'points'}</p>
                                                </div>
                                                <div className={`text-center px-3 py-1 rounded-full ${percentage >= 50 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                    <p className="text-lg font-bold">{percentage}%</p>
                                                </div>
                                            </div>
                                        </div>
                                    </NeuCard>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}