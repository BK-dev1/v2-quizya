'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useExams } from '@/lib/hooks/use-exams'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import {
  Plus,
  FileEdit,
  Users,
  BarChart3,
  Eye,
  Copy,
  Trash2,
  Globe,
  Lock,
  Loader2,
  Zap,
  Play
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import StudentDashboard from '@/components/dashboard/student-dashboard'
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton'
import { useTranslation } from 'react-i18next'

interface LiveQuiz {
  id: string
  title: string
  description?: string
  status: string
  quiz_code: string
  questions: any[]
  participants: any[]
  created_at: string
  ended_at?: string
  show_results_to_students: boolean
}

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { exams, loading: examsLoading, deleteExam, fetchExams, pagination } = useExams()
  const { t } = useTranslation()
  const [stats, setStats] = useState({
    totalExams: 0,
    activeExams: 0,
    totalSessions: 0,
    avgScore: 0
  })
  const [liveQuizzes, setLiveQuizzes] = useState<LiveQuiz[]>([])
  const [liveQuizzesLoading, setLiveQuizzesLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (user && profile?.role === 'teacher') {
      loadStats()
      loadLiveQuizzes()
    }
  }, [user, profile])

  const loadLiveQuizzes = async () => {
    try {
      const res = await fetch('/api/live-quiz')
      if (res.ok) {
        const data = await res.json()
        // Show ALL quizzes - sorted by status (active first, then ended)
        const sortedQuizzes = data.sort((a: LiveQuiz, b: LiveQuiz) => {
          const statusOrder: Record<string, number> = { active: 0, paused: 1, showing_results: 2, waiting: 3, ended: 4 }
          return (statusOrder[a.status] || 5) - (statusOrder[b.status] || 5)
        })
        setLiveQuizzes(sortedQuizzes)
      }
    } catch (error) {
      console.error('Error loading live quizzes:', error)
    } finally {
      setLiveQuizzesLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const res = await fetch(`/api/analytics/dashboard`, {
        next: { revalidate: 60 } // Cache for 60 seconds
      })
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalExams: data.totalExams || 0,
          activeExams: data.activeExams || 0,
          totalSessions: data.totalSessions || 0,
          avgScore: data.avgScore || 0
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleCopyRoomCode = (roomCode: string) => {
    navigator.clipboard.writeText(roomCode)
    toast.success(t('roomCodeCopied') || 'Room code copied to clipboard!')
  }

  const handleDeleteExam = async (examId: string) => {
    if (confirm(t('confirmDeleteExam') || 'Are you sure you want to delete this exam?')) {
      const success = await deleteExam(examId)
      if (success) {
        toast.success(t('examDeleted') || 'Exam deleted successfully')
      } else {
        toast.error(t('deleteExamFailed') || 'Failed to delete exam')
      }
    }
  }

  const handleDeleteLiveQuiz = async (quizId: string, e: React.MouseEvent) => {
    e.preventDefault() // Prevent Link navigation
    e.stopPropagation()
    
    if (confirm(t('confirmDeleteQuiz') || 'Are you sure you want to delete this quiz? This will remove all participant data.')) {
      try {
        const res = await fetch(`/api/live-quiz/${quizId}`, { method: 'DELETE' })
        if (res.ok) {
          toast.success(t('quizDeleted') || 'Quiz deleted successfully')
          setLiveQuizzes(prev => prev.filter(q => q.id !== quizId))
        } else {
          toast.error(t('deleteQuizFailed') || 'Failed to delete quiz')
        }
      } catch (error) {
        console.error('Error deleting quiz:', error)
        toast.error(t('deleteQuizFailed') || 'Failed to delete quiz')
      }
    }
  }

  if (authLoading) {
    return <DashboardSkeleton />
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{t('signInToAccess') || 'Please sign in to access the dashboard'}</p>
          <Link href="/auth/login">
            <NeuButton className="mt-4">{t('signIn') || 'Sign In'}</NeuButton>
          </Link>
        </div>
      </div>
    )
  }

  // Check for student role
  if (profile?.role === 'student') {
    return <StudentDashboard />
  }

  if (profile?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{t('accessDeniedTeacher') || 'Access denied. Teacher account required.'}</p>
        </div>
      </div>
    )
  }

  const statsData = [
    {
      label: t('totalExams') || "Total Exams",
      value: loadingStats ? "..." : stats.totalExams,
      icon: FileEdit,
      color: "text-blue-600"
    },
    {
      label: t('activeExams') || "Active Exams",
      value: loadingStats ? "..." : stats.activeExams,
      icon: Globe,
      color: "text-green-600"
    },
    {
      label: t('totalAttempts') || "Total Attempts",
      value: loadingStats ? "..." : stats.totalSessions,
      icon: Users,
      color: "text-purple-600"
    },
    {
      label: t('avgScore') || "Avg. Score",
      value: loadingStats ? "..." : `${stats.avgScore}%`,
      icon: BarChart3,
      color: "text-orange-600"
    },
  ]

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold  mb-2">
            {t('welcome') || 'Welcome'}, {profile?.full_name || user.email}
          </h1>
          <p className="">{t('dashboardDescription') || 'Manage your exams and track student performance'}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <NeuCard key={index} className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10 mr-4`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium ">{stat.label}</p>
                  <p className="text-2xl font-bold ">{stat.value}</p>
                </div>
              </div>
            </NeuCard>
          ))}
        </div>

        {/* Live Quizzes Section */}
        {(liveQuizzes.length > 0 || !liveQuizzesLoading) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                {t('liveQuizzes') || 'Live Quizzes'}
              </h2>
              <Link href="/dashboard/live-quiz/new">
                <NeuButton size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('createLiveQuiz') || 'Create Live Quiz'}
                </NeuButton>
              </Link>
            </div>
            
            {liveQuizzesLoading ? (
              <div className="flex gap-4">
                {[1, 2].map((i) => (
                  <NeuCard key={i} className="p-4 w-64 flex-shrink-0">
                    <div className="h-4 w-2/3 bg-muted animate-pulse rounded mb-2" />
                    <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                  </NeuCard>
                ))}
              </div>
            ) : liveQuizzes.length === 0 ? (
              <NeuCard className="p-6 text-center">
                <Zap className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">{t('noLiveQuizzes') || 'No live quizzes yet'}</p>
              </NeuCard>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {liveQuizzes.map((quiz) => (
                  <Link key={quiz.id} href={`/dashboard/live-quiz/${quiz.id}`}>
                    <NeuCard className="p-4 min-w-[250px] hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium truncate flex-1">{quiz.title}</h3>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            quiz.status === 'waiting' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            quiz.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                            quiz.status === 'paused' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            quiz.status === 'ended' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {quiz.status}
                          </span>
                          <button
                            onClick={(e) => handleDeleteLiveQuiz(quiz.id, e)}
                            className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900 text-muted-foreground hover:text-red-600 transition-colors"
                            title={t('deleteQuiz') || 'Delete quiz'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground flex items-center gap-3">
                        <span className="font-mono">{quiz.quiz_code}</span>
                        <span><Users className="h-3 w-3 inline mr-1" />{quiz.participants?.length || 0}</span>
                      </div>
                      {quiz.status === 'ended' && (
                        <div className="mt-2 flex items-center gap-1 text-xs">
                          {quiz.show_results_to_students ? (
                            <span className="text-green-600">✓ {t('resultsPublished') || 'Results Published'}</span>
                          ) : (
                            <span className="text-muted-foreground">{t('resultsNotPublished') || 'Results Not Published'}</span>
                          )}
                        </div>
                      )}
                      <NeuButton size="sm" variant="ghost" className="mt-3 w-full text-sm">
                        <Play className="h-3 w-3 mr-1" />
                        {quiz.status === 'waiting' ? (t('continueSetup') || 'Continue') : 
                         quiz.status === 'ended' ? (t('viewResults') || 'View Results') :
                         (t('manage') || 'Manage')}
                      </NeuButton>
                    </NeuCard>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold ">{t('yourExams') || 'Your Exams'}</h2>
          <Link href="/dashboard/exams/new">
            <NeuButton>
              <Plus className="h-4 w-4 mr-2" />
              {t('createExam') || 'Create Exam'}
            </NeuButton>
          </Link>
        </div>

        {/* Exams List */}
        {examsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <NeuCard key={i} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 w-full max-w-2xl">
                    <div className="h-6 w-1/3 bg-muted animate-pulse rounded" />
                    <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              </NeuCard>
            ))}
          </div>
        ) : exams.length === 0 ? (
          <NeuCard className="text-center p-12">
            <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium  mb-2">{t('noExamsYet') || 'No exams yet'}</h3>
            <p className="text-muted-foreground mb-4">{t('createFirstExamPrompt') || 'Create your first exam to get started'}</p>
            <Link href="/dashboard/exams/new">
              <NeuButton>
                <Plus className="h-4 w-4 mr-2" />
                {t('createFirstExam') || 'Create Your First Exam'}
              </NeuButton>
            </Link>
          </NeuCard>
        ) : (
          <div className="grid gap-6">
            {exams.map((exam) => (
              <NeuCard key={exam.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold ">{exam.title}</h3>
                      {exam.is_public ? (
                        <Globe className="h-4 w-4 text-green-600" />
                      ) : (
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${exam.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-muted text-muted-foreground'
                        }`}>
                        {exam.is_active ? (t('active') || 'Active') : (t('inactive') || 'Inactive')}
                      </span>
                    </div>

                    {exam.description && (
                      <p className=" mb-3">{exam.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{exam.total_questions} {t('questions') || 'questions'}</span>
                      <span>{exam.duration_minutes} {t('minutes') || 'minutes'}</span>
                      <span>{t('passing') || 'Passing'}: {exam.passing_score}%</span>
                      {exam.room_code && (
                        <button
                          onClick={() => handleCopyRoomCode(exam.room_code!)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <Copy className="h-3 w-3" />
                          {t('room') || 'Room'}: {exam.room_code}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/exams/${exam.id}`}>
                      <NeuButton variant="secondary" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        {t('view') || 'View'}
                      </NeuButton>
                    </Link>

                    <Link href={`/dashboard/exams/${exam.id}/monitor`}>
                      <NeuButton variant="secondary" size="sm">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        {t('monitor') || 'Monitor'}
                      </NeuButton>
                    </Link>

                    <NeuButton
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteExam(exam.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </NeuButton>
                  </div>
                </div>
              </NeuCard>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {t('showingExams') || 'Showing'} {(currentPage - 1) * pagination.limit + 1} {t('to') || 'to'}{' '}
              {Math.min(currentPage * pagination.limit, pagination.total)} {t('of') || 'of'}{' '}
              {pagination.total} {t('exams') || 'exams'}
            </p>
            <div className="flex gap-2">
              <NeuButton
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(currentPage - 1)
                  fetchExams(currentPage - 1)
                }}
              >
                {t('previous') || 'Previous'}
              </NeuButton>
              <NeuButton
                variant="secondary"
                size="sm"
                disabled={currentPage === pagination.pages}
                onClick={() => {
                  setCurrentPage(currentPage + 1)
                  fetchExams(currentPage + 1)
                }}
              >
                {t('next') || 'Next'}
              </NeuButton>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/question-bank">
            <NeuCard className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <FileEdit className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-medium  mb-1">{t('questionBank') || 'Question Bank'}</h3>
                <p className="text-sm ">{t('manageReusableQuestions') || 'Manage reusable questions'}</p>
              </div>
            </NeuCard>
          </Link>

          <Link href="/dashboard/analytics">
            <NeuCard className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-medium  mb-1">{t('analytics') || 'Analytics'}</h3>
                <p className="text-sm ">{t('viewDetailedReports') || 'View detailed reports'}</p>
              </div>
            </NeuCard>
          </Link>

          <Link href="/dashboard/settings">
            <NeuCard className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-medium  mb-1">{t('settings') || 'Settings'}</h3>
                <p className="text-sm ">{t('accountPreferences') || 'Account preferences'}</p>
              </div>
            </NeuCard>
          </Link>
        </div>
      </div>
    </div>
  )
}