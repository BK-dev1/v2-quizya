'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import {
  BarChart3,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Download,
  Loader2,
  ArrowLeft,
  ChevronDown,
  FileEdit
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import EssayGrading from './essay-grading'
import { useTranslation } from 'react-i18next'

interface ExamSession {
  id: string
  student_id: string | null
  guest_name: string | null
  guest_email: string | null
  is_guest: boolean
  score: number
  total_points: number
  status: string
  grading_status: 'pending' | 'graded' | 'not_required'
  submitted_at: string | null
  answers: any[]
  student: {
    id: string
    email: string
    full_name: string
  } | null
}

interface QuestionStat {
  id: string
  question_text: string
  correct_count: number
  total_attempted: number
  correct_percentage: number
  points: number
}

interface ExamResultsData {
  exam: any
  sessions: ExamSession[]
  questions: any[]
  statistics: {
    totalAttempts: number
    completedAttempts: number
    avgScore: number
    passedCount: number
    failedCount: number
    passPercentage: number
  }
  questionStats: QuestionStat[]
}

export default function ExamResultsPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const { t } = useTranslation()

  const [data, setData] = useState<ExamResultsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set())
  const [gradingSessionId, setGradingSessionId] = useState<string | null>(null)

  useEffect(() => {
    loadResults()
  }, [examId])

  const loadResults = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}/results`)
      if (!res.ok) {
        toast.error(t('loadResultsFailed') || 'Failed to load exam results')
        router.push('/dashboard/exams')
        return
      }

      const resultsData = await res.json()
      setData(resultsData)
    } catch (error) {
      console.error('Error loading results:', error)
      toast.error(t('loadResultsFailed') || 'Failed to load exam results')
    } finally {
      setLoading(false)
    }
  }

  const toggleStudentExpand = (studentId: string) => {
    const newExpanded = new Set(expandedStudents)
    if (newExpanded.has(studentId)) {
      newExpanded.delete(studentId)
    } else {
      newExpanded.add(studentId)
    }
    setExpandedStudents(newExpanded)
  }

  const downloadCSV = () => {
    if (!data) return

    let csv = `${t('studentName') || 'Student Name'},${t('email') || 'Email'},${t('score') || 'Score'},${t('totalPoints') || 'Total Points'},${t('percentage') || 'Percentage'},${t('status') || 'Status'}\n`

    const completedSessions = data.sessions.filter(s => s.status === 'completed')
    for (const session of completedSessions) {
      const studentName = session.is_guest
        ? session.guest_name
        : session.student?.full_name || session.student?.email || t('unknown') || 'Unknown'
      const email = session.is_guest ? session.guest_email : session.student?.email || ''
      const percentage = session.total_points > 0
        ? Math.round((session.score / session.total_points) * 100)
        : 0
      const passed = percentage >= data.exam.passing_score
        ? (t('passed') || 'Passed')
        : (t('failed') || 'Failed')

      csv += `"${studentName}","${email}",${session.score},${session.total_points},${percentage}%,"${passed}"\n`
    }

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${data.exam.title}-${t('results') || 'results'}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">{t('resultsNotFound') || 'Results not found'}</h2>
        <Link href="/dashboard/exams">
          <NeuButton>{t('backToExams') || 'Back to Exams'}</NeuButton>
        </Link>
      </div>
    )
  }

  const completedSessions = data.sessions.filter(s => s.status === 'completed')

  // Find sessions with essay questions that need grading
  const sessionsWithEssays = completedSessions.filter(session => {
    if (!session.answers || !data.questions) return false
    return session.answers.some((answer: any) => {
      const question = data.questions.find(q => q.id === answer.question_id)
      return question?.question_type === 'essay'
    })
  })

  const gradingSession = gradingSessionId
    ? completedSessions.find(s => s.id === gradingSessionId)
    : null

  const essayQuestions = gradingSession && data.questions
    ? data.questions.filter(q => q.question_type === 'essay').map(q => {
      const answer = (gradingSession.answers as any[])?.find(a => a.question_id === q.id)
      return {
        question_id: q.id,
        question_text: q.question_text,
        answer: answer?.answer || '',
        points_earned: answer?.points_earned || 0,
        max_points: q.points
      }
    })
    : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/exams/${examId}`}>
          <NeuButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </NeuButton>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{t('examResults') || 'Exam Results'}</h1>
          <p className="text-muted-foreground">{data.exam.title}</p>
        </div>
        <NeuButton
          onClick={downloadCSV}
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          {t('exportCSV') || 'Export CSV'}
        </NeuButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <NeuCard>
          <NeuCardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('totalSubmissions') || 'Total Submissions'}</p>
                <p className="text-3xl font-bold">{data.statistics.completedAttempts}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </NeuCardContent>
        </NeuCard>

        <NeuCard>
          <NeuCardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('averageScore') || 'Average Score'}</p>
                <p className="text-3xl font-bold">{data.statistics.avgScore}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </NeuCardContent>
        </NeuCard>

        <NeuCard>
          <NeuCardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('passed') || 'Passed'}</p>
                <p className="text-3xl font-bold text-green-600">
                  {data.statistics.passedCount}
                  <span className="text-lg text-muted-foreground ml-1">
                    ({data.statistics.passPercentage}%)
                  </span>
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </NeuCardContent>
        </NeuCard>

        <NeuCard>
          <NeuCardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('failed') || 'Failed'}</p>
                <p className="text-3xl font-bold text-red-600">
                  {data.statistics.failedCount}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500 opacity-50" />
            </div>
          </NeuCardContent>
        </NeuCard>
      </div>

      {/* Question Performance */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('questionPerformance') || 'Question Performance'}
          </NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          <div className="space-y-4">
            {data.questionStats.map((question, index) => {
              const correctPercentage = question.correct_percentage
              return (
                <div key={question.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        Q{index + 1}: {question.question_text.substring(0, 50)}...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {question.correct_count}/{question.total_attempted} {t('correct') || 'correct'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600">
                        {correctPercentage}%
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${correctPercentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </NeuCardContent>
      </NeuCard>

      {/* Essay Grading Section */}
      {sessionsWithEssays.length > 0 && (
        <NeuCard>
          <NeuCardHeader>
            <NeuCardTitle className="flex items-center gap-2">
              <FileEdit className="h-5 w-5" />
              {t('essayGrading') || 'Essay Grading'} ({sessionsWithEssays.length} {sessionsWithEssays.length === 1 ? t('submission') || 'submission' : t('submissions') || 'submissions'})
            </NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent>
            {!gradingSessionId ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  {t('selectSubmissionToGrade') || 'Select a submission to grade essay questions'}
                </p>
                {sessionsWithEssays.map(session => {
                  const studentName = session.is_guest
                    ? session.guest_name
                    : session.student?.full_name || session.student?.email || t('unknown') || 'Unknown'
                  const essayCount = data.questions.filter(q => q.question_type === 'essay').length

                  return (
                    <button
                      key={session.id}
                      onClick={() => setGradingSessionId(session.id)}
                      className="w-full p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{studentName}</p>
                          <p className="text-sm text-muted-foreground">
                            {essayCount} {t('essay') || 'essay'} {essayCount === 1 ? t('question') || 'question' : t('questions') || 'questions'} {t('toGrade') || 'to grade'}
                          </p>
                        </div>
                        <ChevronDown className="h-5 w-5 -rotate-90" />
                      </div>
                    </button>
                  )
                })}
              </div>
            ) : (
              <div>
                <NeuButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setGradingSessionId(null)}
                  className="mb-4"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {t('backToList') || 'Back to list'}
                </NeuButton>
                <EssayGrading
                  sessionId={gradingSessionId}
                  studentName={
                    gradingSession?.is_guest
                      ? gradingSession.guest_name || t('guest') || 'Guest'
                      : gradingSession?.student?.full_name || gradingSession?.student?.email || t('unknown') || 'Unknown'
                  }
                  essays={essayQuestions}
                  onGraded={() => {
                    setGradingSessionId(null)
                    loadResults()
                  }}
                />
              </div>
            )}
          </NeuCardContent>
        </NeuCard>
      )}

      {/* Student Submissions */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle>{t('studentSubmissions') || 'Student Submissions'}</NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          {completedSessions.length === 0 ? (
            <p className="text-muted-foreground">{t('noSubmissionsYet') || 'No submissions yet'}</p>
          ) : (
            <div className="space-y-2">
              {completedSessions.map((session) => {
                const studentName = session.is_guest
                  ? session.guest_name
                  : session.student?.full_name || session.student?.email || t('unknown') || 'Unknown'
                const studentEmail = session.is_guest
                  ? session.guest_email
                  : session.student?.email || ''
                const percentage = session.total_points > 0
                  ? Math.round((session.score / session.total_points) * 100)
                  : 0
                const passed = percentage >= data.exam.passing_score
                const isExpanded = expandedStudents.has(session.id)

                return (
                  <div key={session.id} className="border border-slate-200 rounded-lg">
                    <button
                      onClick={() => toggleStudentExpand(session.id)}
                      className="w-full p-4 flex items-center justify-between hover:bg-muted"
                    >
                      <div className="flex items-center gap-4 flex-1 text-left">
                        <div className="flex-1">
                          <p className="font-medium">{studentName}</p>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-muted-foreground">{studentEmail}</p>
                            {session.grading_status === 'pending' && (
                              <span className="px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold uppercase tracking-wider">
                                {t('pendingGrading') || 'Pending Grading'}
                              </span>
                            )}
                            {session.grading_status === 'graded' && (
                              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider">
                                {t('graded') || 'Graded'}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold">{percentage}%</span>
                            {passed ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {session.score} / {session.total_points} {t('points') || 'points'}
                          </p>
                        </div>
                      </div>
                      <ChevronDown
                        className={`h-5 w-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''
                          }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-border p-4 bg-muted space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">{t('submittedAt') || 'Submitted At'}</p>
                            <p className="font-medium">
                              {session.submitted_at
                                ? new Date(session.submitted_at).toLocaleString()
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">{t('status') || 'Status'}</p>
                            <p className="font-medium capitalize">{session.status}</p>
                          </div>
                        </div>

                        <Link href={`/dashboard/exams/${examId}/sessions/${session.id}`}>
                          <NeuButton variant="secondary" className="w-full">
                            {t('viewDetailedPerformance') || 'View Detailed Performance'}
                          </NeuButton>
                        </Link>

                        {/* Answer Details */}
                        {session.answers && (
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <p className="font-medium mb-3">{t('answerDetails') || 'Answer Details'}</p>
                            <div className="space-y-2">
                              {(session.answers as any[]).map((answer, idx) => (
                                <div
                                  key={idx}
                                  className="p-3 bg-card rounded border border-border flex items-start gap-3"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{t('question') || 'Question'} {answer.question_id}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {t('answer') || 'Answer'}: {answer.answer || t('notAnswered') || 'Not answered'}
                                    </p>
                                  </div>
                                  <div className="shrink-0">
                                    {answer.is_correct ? (
                                      <CheckCircle className="h-5 w-5 text-green-600" />
                                    ) : (
                                      <XCircle className="h-5 w-5 text-red-600" />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </NeuCardContent>
      </NeuCard>
    </div>
  )
}