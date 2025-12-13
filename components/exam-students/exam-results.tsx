'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { getGuestSessionData, isGuestSession, clearGuestSessionData } from '@/lib/utils/guest-session'
import { ExamSession, Exam } from '@/lib/types'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { CheckCircle, XCircle, Clock, User, Mail, Trophy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ResultsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const [session, setSession] = useState<ExamSession | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)

  const sessionId = searchParams.get('session')
  const guestData = getGuestSessionData()
  const isGuest = isGuestSession()

  useEffect(() => {
    if (!sessionId) {
      toast.error('No exam session found')
      router.push('/')
      return
    }

    loadResults()
  }, [sessionId])

  const loadResults = async () => {
    try {
      // Get exam session with exam details
      const res = await fetch(`/api/sessions/${sessionId}`)
      if (!res.ok) {
        toast.error('Results not found')
        router.push('/')
        return
      }

      const sessionData = await res.json()

      // Verify access
      if (!isGuest && (!user || sessionData.student_id !== user.id)) {
        toast.error('Access denied')
        router.push('/')
        return
      }

      if (isGuest && (!guestData || sessionData.guest_email !== guestData.guestEmail)) {
        toast.error('Access denied')
        router.push('/')
        return
      }

      setSession(sessionData)
      setExam(sessionData.exam)

    } catch (error) {
      console.error('Error loading results:', error)
      toast.error('Failed to load results')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = () => {
    if (isGuest) {
      clearGuestSessionData()
      router.push('/')
    } else {
      router.push('/dashboard')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading results...</p>
        </div>
      </div>
    )
  }

  if (!session || !exam) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load results</p>
        </div>
      </div>
    )
  }

  const percentage = session.total_points > 0 ? Math.round((session.score || 0) / session.total_points * 100) : 0
  const passed = percentage >= exam.passing_score
  const answers = session.answers as any[] || []

  return (
    <div className="min-h-screen ">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
            passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
          }`}>
            {passed ? <Trophy className="h-10 w-10" /> : <XCircle className="h-10 w-10" />}
          </div>
          
          <h1 className="text-3xl font-bold  mb-2">
            {passed ? 'Congratulations!' : 'Exam Completed'}
          </h1>
          
          <p className="text-xl ">
            {passed ? 'You have passed the exam!' : 'Better luck next time!'}
          </p>
        </div>

        {/* Results Summary */}
        <NeuCard className="mb-8 p-6">
          <h2 className="text-xl font-semibold  mb-4">Exam Results</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exam Info */}
            <div>
              <h3 className="font-medium  mb-3">Exam Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="">Exam:</span>
                  <span className="font-medium">{exam.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="">Name:</span>
                  <span>{isGuest ? guestData?.guestName : user?.email}</span>
                </div>
                {isGuest && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-slate-400" />
                    <span className="">Email:</span>
                    <span>{guestData?.guestEmail}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-slate-400" />
                  <span className="">Completed:</span>
                  <span>{new Date(session.submitted_at!).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Score Info */}
            <div>
              <h3 className="font-medium  mb-3">Score Breakdown</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="">Your Score:</span>
                  <span className="font-bold text-2xl">{session.score || 0} / {session.total_points}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="">Percentage:</span>
                  <span className={`font-bold text-xl ${passed ? 'text-green-600' : 'text-red-600'}`}>
                    {percentage}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="">Passing Score:</span>
                  <span className="font-medium">{exam.passing_score}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="">Result:</span>
                  <span className={`font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                    {passed ? 'PASSED' : 'FAILED'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </NeuCard>

        {/* Answer Review (if enabled) */}
        {exam.show_results_immediately && answers.length > 0 && (
          <NeuCard className="mb-8 p-6">
            <h2 className="text-xl font-semibold  mb-4">Answer Review</h2>
            
            <div className="space-y-4">
              {answers.map((answer, index) => (
                <div key={index} className="border-l-4 border-slate-200 pl-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="font-medium ">Question {index + 1}</span>
                    <div className="flex items-center gap-1">
                      {answer.is_correct ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                      <span className="text-sm ">
                        {answer.points_earned} / {answer.points_earned + (answer.is_correct ? 0 : 1)} pts
                      </span>
                    </div>
                  </div>
                  <div className="text-sm ">
                    <span className="font-medium">Your answer:</span> {answer.answer}
                  </div>
                  {!answer.is_correct && (
                    <div className="text-sm text-green-600 mt-1">
                      <span className="font-medium">Correct answer:</span> [Hidden for security]
                    </div>
                  )}
                </div>
              ))}
            </div>
          </NeuCard>
        )}

        {/* Actions */}
        <div className="text-center">
          <NeuButton onClick={handleFinish} size="lg">
            {isGuest ? 'Back to Home' : 'Back to Dashboard'}
          </NeuButton>
        </div>
      </div>
    </div>
  )
}