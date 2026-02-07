"use client"

import * as React from "react"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import {
  Clock,
  Check,
  X,
  Loader2,
  Trophy,
  CheckCircle,
  AlertCircle,
  Hourglass
} from "lucide-react"
import { toast } from 'sonner'
import { useTranslation } from "react-i18next"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"

interface QuizState {
  quiz: {
    id: string
    title: string
    status: string
    current_question_index: number
    total_questions: number
    show_results_to_students: boolean
    redirect_students_home?: boolean
  }
  current_question: {
    id: string
    question_text: string
    options: { id: string; text: string }[]
    time_limit_seconds: number
    points: number
    order_index: number
    state: string
    started_at: string | null
    correct_options?: string[]
  } | null
  participant_response: {
    selected_options: string[]
    is_correct: boolean
    correct_options?: string[]
  } | null
  question_stats: {
    total_responses: number
    option_percentages: Record<string, number>
  } | null
  participant: {
    id: string
    participant_name: string
    total_score: number
    total_correct: number
    user_id?: string | null
  } | null
  server_time?: number
  time_remaining_seconds?: number | null
}

export default function LiveQuizTakePage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t } = useTranslation()
  
  const quizId = params.id as string
  const participantId = searchParams.get('participant')

  const [state, setState] = React.useState<QuizState | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [selectedOptions, setSelectedOptions] = React.useState<string[]>([])
  const [sessionToken, setSessionToken] = React.useState<string | null>(null)
  const [sessionTokenLoaded, setSessionTokenLoaded] = React.useState(false)
  const [sessionInvalid, setSessionInvalid] = React.useState(false)

  // Get session token from URL first (most reliable), then fallback to sessionStorage
  React.useEffect(() => {
    // First check URL params (from redirect after join)
    const tokenFromUrl = searchParams.get('token')
    if (tokenFromUrl) {
      setSessionToken(tokenFromUrl)
      // Also update sessionStorage for consistency
      try {
        const stored = sessionStorage.getItem('liveQuizParticipant')
        if (stored) {
          const parsed = JSON.parse(stored)
          parsed.sessionToken = tokenFromUrl
          sessionStorage.setItem('liveQuizParticipant', JSON.stringify(parsed))
        }
      } catch (e) {
        console.error('Error updating session token in storage:', e)
      }
      setSessionTokenLoaded(true)
      return
    }

    // Fallback to sessionStorage
    try {
      const stored = sessionStorage.getItem('liveQuizParticipant')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.sessionToken && parsed.quizId === quizId) {
          setSessionToken(parsed.sessionToken)
        }
      }
    } catch (e) {
      console.error('Error reading session token:', e)
    }
    // Mark as loaded regardless of whether we found a token
    setSessionTokenLoaded(true)
  }, [quizId, searchParams])
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null)
  const [hasSubmitted, setHasSubmitted] = React.useState(false)
  const lastQuestionIdRef = React.useRef<string | null>(null)

  // Timer interval ref
  const timerRef = React.useRef<NodeJS.Timeout | null>(null)
  const pollRef = React.useRef<NodeJS.Timeout | null>(null)

  // Fetch current quiz state
  const fetchState = React.useCallback(async () => {
    // Don't fetch until session token has been loaded from sessionStorage
    if (!quizId || !participantId || sessionInvalid || !sessionTokenLoaded) return

    try {
      const headers: Record<string, string> = {}
      if (sessionToken) {
        headers['X-Session-Token'] = sessionToken
      }

      const response = await fetch(
        `/api/live-quiz/${quizId}/current?participant_id=${participantId}`,
        { headers }
      )
      
      // Handle session invalidation (someone logged in from another device)
      if (response.status === 403) {
        const errorData = await response.json()
        if (errorData.error === 'SESSION_INVALID') {
          setSessionInvalid(true)
          toast.error(t('sessionInvalid') || 'Your session was invalidated. Someone may have joined from another device.')
          return
        }
      }

      if (!response.ok) {
        toast.error("Failed to load quiz")
        router.push('/join-quiz')
        return
      }

      const data = await response.json()
      setState(data)

      // If quiz ended with redirect flag, go home immediately
      if (data.quiz.status === 'ended' && data.quiz.redirect_students_home) {
        toast.success(t('quizEnded') || 'Quiz ended!')
        router.push('/join-quiz')
        return
      }

      // Check if we have a new question
      if (data.current_question && data.current_question.state === 'active') {
        // Reset state for new question
        if (data.participant_response) {
          setHasSubmitted(true)
          setSelectedOptions(data.participant_response.selected_options || [])
        } else {
          // Only reset if it's a different question
          if (lastQuestionIdRef.current !== data.current_question.id) {
            setHasSubmitted(false)
            setSelectedOptions([])
            lastQuestionIdRef.current = data.current_question.id
          }
        }

        // Use server-provided time remaining (synchronized)
        if (data.time_remaining_seconds !== null && data.time_remaining_seconds !== undefined) {
          setTimeLeft(Math.ceil(data.time_remaining_seconds))
        }
      } else if (data.current_question?.state === 'closed' || data.current_question?.state === 'showing_answer') {
        setTimeLeft(0)
      }
    } catch (error) {
      console.error('Error fetching quiz state:', error)
    } finally {
      setLoading(false)
    }
  }, [quizId, participantId, router, state?.current_question?.id, sessionToken, sessionTokenLoaded, sessionInvalid, t])

  // Adaptive polling based on quiz state
  React.useEffect(() => {
    fetchState()
    
    // Determine polling interval based on state
    const getPollingInterval = () => {
      if (!state) return 2000 // Initial load
      
      // STOP polling if quiz ended and results are shown - no more updates needed
      if (state.quiz.status === 'ended' && state.quiz.show_results_to_students) {
        return 0 // No polling - final state reached
      }
      
      // Quiz ended but waiting for results - poll slowly
      if (state.quiz.status === 'ended') {
        return 3000
      }
      
      // Check for state changes more frequently during active questions
      if (state.quiz.status === 'active' && state.current_question?.state === 'active') {
        // If already submitted, poll less frequently
        return hasSubmitted ? 3000 : 2000
      }
      
      // When waiting for results or next question
      if (state.quiz.status === 'paused' || state.current_question?.state === 'closed') {
        return 3000
      }
      
      // Default: 2 seconds
      return 2000
    }
    
    const interval = getPollingInterval()
    
    if (interval > 0) {
      pollRef.current = setInterval(fetchState, interval)
    }

    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchState, state?.quiz.status, state?.current_question?.state, state?.quiz.show_results_to_students, hasSubmitted])

  // Timer countdown
  React.useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)

    if (state?.current_question?.state === 'active' && timeLeft !== null && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 0) {
            if (timerRef.current) clearInterval(timerRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [state?.current_question?.id, state?.current_question?.state])

  // Toggle option selection
  const toggleOption = (optionId: string) => {
    if (hasSubmitted || !state?.current_question || state.current_question.state !== 'active' || timeLeft === 0) {
      return
    }

    setSelectedOptions(prev => 
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    )
  }

  // Submit answer
  const submitAnswer = async () => {
    if (!state?.current_question || selectedOptions.length === 0 || hasSubmitted || sessionInvalid) return

    setSubmitting(true)
    try {
      // Calculate response time using server's started_at timestamp
      const responseTime = state.current_question.started_at 
        ? Date.now() - new Date(state.current_question.started_at).getTime()
        : null

      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (sessionToken) {
        headers['X-Session-Token'] = sessionToken
      }

      const response = await fetch(`/api/live-quiz/${quizId}/answer`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          participant_id: participantId,
          question_id: state.current_question.id,
          selected_options: selectedOptions,
          response_time_ms: responseTime
        })
      })

      const data = await response.json()

      // Handle session invalidation
      if (response.status === 403 && data.error === 'SESSION_INVALID') {
        setSessionInvalid(true)
        toast.error(t('sessionInvalid') || 'Your session was invalidated. Someone may have joined from another device.')
        return
      }

      if (response.ok) {
        setHasSubmitted(true)
        toast.success(t('answerSubmitted') || 'Answer submitted!')
        fetchState() // Refresh to get latest state
      } else {
        toast.error(data.error || t('failedToSubmit') || 'Failed to submit answer')
      }
    } catch (error) {
      console.error('Error submitting answer:', error)
      toast.error(t('failedToSubmit') || 'Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">{t('loading') || 'Loading quiz...'}</p>
        </div>
      </div>
    )
  }

  // Session was invalidated (someone joined from another device)
  if (sessionInvalid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NeuCard className="max-w-md text-center p-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-orange-500" />
          <h2 className="text-xl font-bold mb-2">{t('sessionInvalidTitle') || 'Session Invalid'}</h2>
          <p className="text-muted-foreground mb-4">
            {t('sessionInvalidDesc') || 'Your session was ended because someone joined from another device with the same credentials. Only one device can be active at a time.'}
          </p>
          <NeuButton onClick={() => router.push('/join-quiz')}>
            {t('rejoinQuiz') || 'Rejoin Quiz'}
          </NeuButton>
        </NeuCard>
      </div>
    )
  }

  if (!state || !state.participant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <NeuCard className="max-w-md text-center p-8">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <h2 className="text-xl font-bold mb-2">{t('sessionNotFound') || 'Session Not Found'}</h2>
          <p className="text-muted-foreground mb-4">
            {t('pleaseRejoin') || 'Please rejoin the quiz'}
          </p>
          <NeuButton onClick={() => router.push('/join-quiz')}>
            {t('joinQuiz') || 'Join Quiz'}
          </NeuButton>
        </NeuCard>
      </div>
    )
  }

  const { quiz, current_question, participant_response, question_stats, participant } = state

  // Waiting for quiz to start
  if (quiz.status === 'waiting') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <NeuCard className="max-w-md text-center">
          <NeuCardContent className="pt-8 pb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
              <Hourglass className="w-10 h-10 text-primary animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{quiz.title}</h2>
            <p className="text-muted-foreground mb-6">
              {t('waitingForHost') || 'Waiting for the host to start the quiz...'}
            </p>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-muted-foreground">{t('joinedAs') || 'Joined as'}</p>
              <p className="text-lg font-semibold">{participant.participant_name}</p>
            </div>
          </NeuCardContent>
        </NeuCard>
      </div>
    )
  }

  // Quiz ended - show score and auto-redirect
  if (quiz.status === 'ended') {
    // Auto-redirect after showing score
    const isRegistered = !!participant.user_id
    const [redirectCountdown, setRedirectCountdown] = React.useState(5)
    
    React.useEffect(() => {
      const timer = setInterval(() => {
        setRedirectCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            // Redirect based on registration status
            if (isRegistered) {
              router.push('/my-results')
            } else {
              router.push('/join-quiz')
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }, [isRegistered, router])
    
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <NeuCard className="max-w-md">
          <NeuCardContent className="pt-8 pb-8 text-center">
            <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-bold mb-2">{t('quizEnded') || 'Quiz Ended!'}</h2>
            
            {/* Always show score immediately */}
            <div className="space-y-4 mt-6">
              <div className="bg-primary/10 rounded-lg p-6">
                <p className="text-sm text-muted-foreground">{t('yourScore') || 'Your Score'}</p>
                <p className="text-4xl font-bold text-primary">{participant.total_score}</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {participant.total_correct} / {quiz.total_questions} {t('correct') || 'correct'}
                </p>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {isRegistered 
                  ? (t('redirectingToResults') || 'Redirecting to your results...')
                  : (t('redirectingToJoin') || 'Redirecting...')
                } ({redirectCountdown}s)
              </p>
              
              <NeuButton 
                onClick={() => router.push(isRegistered ? '/my-results' : '/join-quiz')} 
                variant="secondary" 
                className="w-full"
              >
                {isRegistered 
                  ? (t('viewAllResults') || 'View All Results')
                  : (t('joinAnotherQuiz') || 'Join Another Quiz')
                }
              </NeuButton>
            </div>
          </NeuCardContent>
        </NeuCard>
      </div>
    )
  }

  // Active question
  if (current_question) {
    const isShowingAnswer = current_question.state === 'showing_answer'
    const isClosed = current_question.state === 'closed'
    const isActive = current_question.state === 'active'
    const showResult = isShowingAnswer || isClosed
    const canSubmit = isActive && !hasSubmitted && selectedOptions.length > 0 && (timeLeft === null || timeLeft > 0)

    return (
      <div className="min-h-screen p-4 flex flex-col">
        {/* Header */}
        <div className="max-w-2xl mx-auto w-full mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold">{quiz.title}</h1>
              <p className="text-sm text-muted-foreground">
                {t('question') || 'Question'} {current_question.order_index + 1} / {quiz.total_questions}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-muted-foreground">{t('score') || 'Score'}</p>
                <p className="text-xl font-bold text-primary">{participant.total_score}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="max-w-2xl mx-auto w-full mb-4">
          <div className={cn(
            "h-3 rounded-full overflow-hidden bg-gray-200",
            timeLeft !== null && timeLeft <= 5 && "animate-pulse"
          )}>
            <motion.div
              className={cn(
                "h-full transition-all",
                timeLeft !== null && timeLeft <= 5 ? "bg-red-500" :
                timeLeft !== null && timeLeft <= 10 ? "bg-yellow-500" : "bg-primary"
              )}
              initial={{ width: "100%" }}
              animate={{ 
                width: timeLeft !== null 
                  ? `${(timeLeft / current_question.time_limit_seconds) * 100}%`
                  : "0%"
              }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="flex justify-between mt-1 text-sm">
            <span className="text-muted-foreground">{current_question.points} {t('points') || 'pts'}</span>
            <span className={cn(
              "font-mono font-bold",
              timeLeft !== null && timeLeft <= 5 && "text-red-500"
            )}>
              <Clock className="w-4 h-4 inline mr-1" />
              {timeLeft !== null ? timeLeft : '--'}s
            </span>
          </div>
        </div>

        {/* Question */}
        <div className="flex-1 max-w-2xl mx-auto w-full">
          <NeuCard className="h-full">
            <NeuCardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-6">{current_question.question_text}</h2>

              {/* Options */}
              <div className="space-y-3">
                <AnimatePresence mode="wait">
                  {current_question.options.map((option, index) => {
                    const isSelected = selectedOptions.includes(option.id)
                    const isCorrect = current_question.correct_options?.includes(option.id)
                    // Only show results when teacher explicitly clicks "Show Results"
                    const showResultFeedback = isShowingAnswer
                    
                    let optionStyle = "border-gray-200 hover:border-primary"
                    
                    if (isSelected && !showResultFeedback) {
                      optionStyle = "border-primary bg-primary/10"
                    }
                    
                    if (showResultFeedback) {
                      if (isCorrect) {
                        optionStyle = "border-green-500 bg-green-50 dark:bg-green-900/20"
                      } else if (isSelected && !isCorrect) {
                        optionStyle = "border-red-500 bg-red-50 dark:bg-red-900/20"
                      } else {
                        optionStyle = "border-gray-200 opacity-60"
                      }
                    }

                    return (
                      <motion.button
                        key={option.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onClick={() => toggleOption(option.id)}
                        disabled={hasSubmitted || !isActive || timeLeft === 0}
                        className={cn(
                          "w-full p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3",
                          optionStyle,
                          (hasSubmitted || !isActive || timeLeft === 0) && "cursor-not-allowed"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0",
                          isSelected ? "bg-primary border-primary text-white" :
                          showResultFeedback && isCorrect ? "bg-green-500 border-green-500 text-white" :
                          "border-gray-300 dark:border-gray-600"
                        )}>
                          {showResultFeedback && isCorrect && <Check className="w-4 h-4" />}
                          {showResultFeedback && isSelected && !isCorrect && <X className="w-4 h-4" />}
                          {!showResultFeedback && isSelected && <Check className="w-4 h-4" />}
                        </div>
                        <span className="flex-1">{option.text}</span>
                        
                        {showResultFeedback && question_stats && (
                          <span className="text-sm font-medium text-muted-foreground">
                            {question_stats.option_percentages[option.id] || 0}%
                          </span>
                        )}
                      </motion.button>
                    )
                  })}
                </AnimatePresence>
              </div>

              {/* Submit Button */}
              {!hasSubmitted && isActive && (
                <div className="mt-6">
                  <NeuButton
                    onClick={submitAnswer}
                    disabled={!canSubmit || submitting}
                    className="w-full"
                    size="lg"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Check className="w-5 h-5 mr-2" />
                    )}
                    {t('submitAnswer') || 'Submit Answer'}
                  </NeuButton>
                </div>
              )}

              {/* Submitted confirmation - show when question is closed but results not shown */}
              {hasSubmitted && (isActive || isClosed) && !isShowingAnswer && (
                <div className="mt-6 text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p className="text-green-700 dark:text-green-400 font-medium">
                    {t('answerSubmitted') || 'Answer submitted!'}
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-500">
                    {isClosed 
                      ? (t('waitingForTeacher') || 'Waiting for teacher...')
                      : (t('waitingForResults') || 'Waiting for results...')
                    }
                  </p>
                </div>
              )}

              {/* Time expired - show when not submitted and time ran out */}
              {!hasSubmitted && timeLeft === 0 && !isShowingAnswer && (
                <div className="mt-6 text-center p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-yellow-500" />
                  <p className="text-yellow-700 dark:text-yellow-400 font-medium">
                    {t('timeExpired') || 'Time expired!'}
                  </p>
                  {isClosed && (
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">
                      {t('waitingForTeacher') || 'Waiting for teacher...'}
                    </p>
                  )}
                </div>
              )}

              {/* Result feedback - ONLY show when teacher clicks "Show Results" */}
              {isShowingAnswer && participant_response && (
                <div className={cn(
                  "mt-6 text-center p-4 rounded-lg",
                  participant_response.is_correct 
                    ? "bg-green-50 dark:bg-green-900/20" 
                    : "bg-red-50 dark:bg-red-900/20"
                )}>
                  {participant_response.is_correct ? (
                    <>
                      <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                      <p className="text-green-700 dark:text-green-400 font-bold text-xl">
                        {t('correct') || 'Correct!'}
                      </p>
                    </>
                  ) : (
                    <>
                      <X className="w-12 h-12 mx-auto mb-2 text-red-500" />
                      <p className="text-red-700 dark:text-red-400 font-bold text-xl">
                        {t('incorrect') || 'Incorrect'}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Show waiting message if question closed but no response */}
              {isShowingAnswer && !participant_response && (
                <div className="mt-6 text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <AlertCircle className="w-12 h-12 mx-auto mb-2 text-gray-400" />
                  <p className="text-gray-600 dark:text-gray-400 font-medium">
                    {t('noAnswerSubmitted') || 'No answer submitted'}
                  </p>
                </div>
              )}
            </NeuCardContent>
          </NeuCard>
        </div>
      </div>
    )
  }

  // Waiting between questions
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <NeuCard className="max-w-md text-center">
        <NeuCardContent className="pt-8 pb-8">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <h2 className="text-xl font-bold mb-2">{t('waitingForQuestion') || 'Waiting for next question...'}</h2>
          <p className="text-muted-foreground">
            {t('hostWillShowNext') || 'The host will show the next question soon'}
          </p>
          <div className="mt-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">{t('yourScore') || 'Your Score'}</p>
            <p className="text-2xl font-bold text-primary">{participant.total_score}</p>
          </div>
        </NeuCardContent>
      </NeuCard>
    </div>
  )
}
