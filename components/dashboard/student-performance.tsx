'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { 
  ArrowLeft,
  CheckCircle,
  XCircle,
  Loader2,
  Clock,
  User,
  Mail,
  Trophy
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface SessionData {
  session: {
    id: string
    student_id: string | null
    guest_name: string | null
    guest_email: string | null
    is_guest: boolean
    score: number
    total_points: number
    status: string
    submitted_at: string | null
    percentage: number
    passed: boolean
    exam: any
  }
  answers: any[]
  questions: any[]
}

export default function StudentPerformancePage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string
  const sessionId = params.sessionId as string

  const [data, setData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessionDetails()
  }, [sessionId])

  const loadSessionDetails = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}/sessions/${sessionId}`)
      if (!res.ok) {
        toast.error('Failed to load student details')
        router.push(`/dashboard/exams/${examId}/results`)
        return
      }

      const sessionData = await res.json()
      setData(sessionData)
    } catch (error) {
      console.error('Error loading session details:', error)
      toast.error('Failed to load student details')
    } finally {
      setLoading(false)
    }
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
        <h2 className="text-2xl font-bold mb-4">Student data not found</h2>
        <Link href={`/dashboard/exams/${examId}/results`}>
          <NeuButton>Back to Results</NeuButton>
        </Link>
      </div>
    )
  }

  const { session, answers } = data
  const studentName = session.is_guest
    ? session.guest_name
    : 'Unknown Student'
  const studentEmail = session.is_guest
    ? session.guest_email
    : 'Unknown Email'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/exams/${examId}/results`}>
          <NeuButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </NeuButton>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Student Performance</h1>
          <p className="text-muted-foreground">{studentName}</p>
        </div>
      </div>

      {/* Score Card */}
      <NeuCard className="bg-linear-to-br from-blue-50 to-indigo-50">
        <NeuCardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Overall Score</p>
              <p className="text-5xl font-bold">{session.percentage}%</p>
              <p className="text-muted-foreground mt-2">
                {session.score} / {session.total_points} points
              </p>
            </div>
            <div className="text-right">
              {session.passed ? (
                <div className="flex flex-col items-center gap-2">
                  <Trophy className="h-12 w-12 text-green-600" />
                  <p className="text-lg font-bold text-green-600">PASSED</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <XCircle className="h-12 w-12 text-red-600" />
                  <p className="text-lg font-bold text-red-600">FAILED</p>
                </div>
              )}
            </div>
          </div>
        </NeuCardContent>
      </NeuCard>

      {/* Student Information */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle>Student Information</NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{studentName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{studentEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Submitted</p>
                <p className="font-medium">
                  {session.submitted_at
                    ? new Date(session.submitted_at).toLocaleString()
                    : 'Not submitted'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium capitalize">{session.status}</p>
            </div>
          </div>
        </NeuCardContent>
      </NeuCard>

      {/* Answer Breakdown */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle>Answer Review</NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          {answers.length === 0 ? (
            <p className="text-muted-foreground">No answers submitted</p>
          ) : (
            <div className="space-y-4">
              {answers.map((answer, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    answer.is_correct
                      ? 'border-green-600 bg-green-50'
                      : 'border-red-600 bg-red-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">Q{index + 1}</span>
                      {answer.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {answer.points_earned || 0} / {answer.points || 0} pts
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <p className="font-medium text-sm">{answer.question_text}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Student's answer:</p>
                      <p className="text-sm font-medium">{answer.answer || '(Not answered)'}</p>
                    </div>
                    {!answer.is_correct && (
                      <div>
                        <p className="text-sm text-muted-foreground">Correct answer:</p>
                        <p className="text-sm font-medium text-green-700">
                          {answer.correct_answer}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </NeuCardContent>
      </NeuCard>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/dashboard/exams/${examId}/results`} className="flex-1">
          <NeuButton className="w-full">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Results
          </NeuButton>
        </Link>
      </div>
    </div>
  )
}
