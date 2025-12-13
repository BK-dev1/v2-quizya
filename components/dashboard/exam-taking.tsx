'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { getGuestSessionData, isGuestSession } from '@/lib/utils/guest-session'
import { Exam, Question, ExamSession } from '@/lib/types'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuTimer } from '@/components/ui/neu-timer'
import { NeuProgressGrid } from '@/components/ui/neu-progress'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function TakeExamPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  
  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [session, setSession] = useState<ExamSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  const sessionId = searchParams.get('session')
  const guestData = getGuestSessionData()
  const isGuest = isGuestSession()

  useEffect(() => {
    if (!sessionId) {
      toast.error('No exam session found')
      router.push('/join')
      return
    }

    loadExamData()
  }, [sessionId])

  const loadExamData = async () => {
    try {
      // Get exam session
      const res = await fetch(`/api/sessions/${sessionId}`)
      if (!res.ok) {
        toast.error('Exam session not found')
        router.push('/join')
        return
      }

      const sessionData = await res.json()

      // Verify access (either user owns the session or it's a guest session)
      if (!isGuest && (!user || sessionData.student_id !== user.id)) {
        toast.error('Access denied')
        router.push('/join')
        return
      }

      if (isGuest && (!guestData || sessionData.guest_email !== guestData.guestEmail)) {
        toast.error('Access denied')
        router.push('/join')
        return
      }

      setSession(sessionData)
      setExam(sessionData.exam)

      // Get questions for the exam
      const questionsRes = await fetch(`/api/exams/${sessionData.exam.id}/questions`)
      if (!questionsRes.ok) {
        toast.error('Failed to load questions')
        return
      }

      const questionsData = await questionsRes.json()
      setQuestions(questionsData)

      // Load existing answers if any
      if (sessionData.answers) {
        setAnswers(sessionData.answers as Record<string, string>)
      }

      // Calculate time left
      if (sessionData.started_at && sessionData.exam.duration_minutes) {
        const startTime = new Date(sessionData.started_at).getTime()
        const duration = sessionData.exam.duration_minutes * 60 * 1000 // in ms
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, duration - elapsed)
        setTimeLeft(Math.floor(remaining / 1000)) // in seconds
      }

    } catch (error) {
      console.error('Error loading exam data:', error)
      toast.error('Failed to load exam')
      router.push('/join')
    } finally {
      setLoading(false)
    }
  }

  const saveAnswer = async (questionId: string, answer: string) => {
    const newAnswers = { ...answers, [questionId]: answer }
    setAnswers(newAnswers)

    // Auto-save answers
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: newAnswers })
      })
    } catch (error) {
      console.error('Error saving answer:', error)
    }
  }

  const submitExam = async () => {
    if (!session || !exam) return

    setSubmitting(true)
    try {
      // Calculate score
      let score = 0
      const studentAnswers = questions.map(question => {
        const studentAnswer = answers[question.id] || ''
        const isCorrect = studentAnswer === question.correct_answer
        const pointsEarned = isCorrect ? question.points : 0
        score += pointsEarned

        return {
          question_id: question.id,
          answer: studentAnswer,
          is_correct: isCorrect,
          points_earned: pointsEarned
        }
      })

      // Submit the exam
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitted_at: new Date().toISOString(),
          status: 'completed',
          answers: studentAnswers,
          score
        })
      })

      if (!res.ok) {
        toast.error('Failed to submit exam')
        return
      }

      toast.success('Exam submitted successfully!')
      
      // Clear guest session data if applicable
      if (isGuest) {
        sessionStorage.removeItem('guestExamSession')
      }

      router.push(`/results?session=${sessionId}`)

    } catch (error) {
      console.error('Error submitting exam:', error)
      toast.error('Failed to submit exam')
    } finally {
      setSubmitting(false)
    }
  }

  const handleTimeUp = () => {
    toast.info('Time is up! Submitting your exam...')
    submitExam()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading exam...</p>
        </div>
      </div>
    )
  }

  if (!exam || !session || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Failed to load exam</p>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen ">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold ">{exam.title}</h1>
              <p className="">
                {isGuest ? `Taking as: ${guestData?.guestName}` : `Taking as: ${user?.email}`}
              </p>
            </div>
            {timeLeft > 0 && (
              <NeuTimer 
                initialSeconds={timeLeft}
                onTimeUp={handleTimeUp}
              />
            )}
          </div>
          
          <NeuProgressGrid
            totalQuestions={questions.length}
            currentQuestion={currentQuestionIndex + 1}
            answered={Object.keys(answers).length}
          />
        </div>

        {/* Question Card */}
        <NeuCard className="mb-6 p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm ">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm ">
                {currentQuestion.points} point(s)
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <h2 className="text-lg font-medium  mb-4">
            {currentQuestion.question_text}
          </h2>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.question_type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-2">
                {(currentQuestion.options as any).map((option: any, index: number) => (
                  <label key={index} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentQuestion.id}`}
                      value={option.text || option}
                      checked={answers[currentQuestion.id] === (option.text || option)}
                      onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="">{option.text || option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.question_type === 'true_false' && (
              <div className="space-y-2">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value="true"
                    checked={answers[currentQuestion.id] === 'true'}
                    onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="">True</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value="false"
                    checked={answers[currentQuestion.id] === 'false'}
                    onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                    className="text-blue-600"
                  />
                  <span className="">False</span>
                </label>
              </div>
            )}

            {(currentQuestion.question_type === 'short_answer' || currentQuestion.question_type === 'essay') && (
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={currentQuestion.question_type === 'essay' ? 6 : 3}
                placeholder="Type your answer here..."
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
              />
            )}
          </div>
        </NeuCard>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <NeuButton
            variant="outline"
            onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </NeuButton>

          {currentQuestionIndex < questions.length - 1 ? (
            <NeuButton
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
            >
              Next
            </NeuButton>
          ) : (
            <NeuButton
              onClick={submitExam}
              disabled={submitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                'Submit Exam'
              )}
            </NeuButton>
          )}
        </div>
      </div>
    </div>
  )
}