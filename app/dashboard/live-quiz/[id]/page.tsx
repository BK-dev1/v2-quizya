"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import {
  ArrowLeft,
  Play,
  Pause,
  SkipForward,
  Eye,
  EyeOff,
  Users,
  Clock,
  Check,
  X,
  Trophy,
  Loader2,
  QrCode,
  Copy,
  BarChart3,
  Maximize2,
  Minimize2,
  Timer,
  Home
} from "lucide-react"
import { toast } from 'sonner'
import { useTranslation } from "react-i18next"
import { LiveQuiz, LiveQuizQuestion, LiveQuizParticipant } from "@/lib/types"
import { motion, AnimatePresence } from "framer-motion"

// State cache for optimized polling
interface QuizStateCache {
  version: number
  lastFetch: number
  quiz: LiveQuiz | null
  questions: LiveQuizQuestion[]
  participants: LiveQuizParticipant[]
}

export default function LiveQuizControlPage() {
  const params = useParams()
  const router = useRouter()
  const { t } = useTranslation()
  const quizId = params.id as string

  // State with version tracking for optimized polling
  const [stateCache, setStateCache] = React.useState<QuizStateCache>({
    version: 0,
    lastFetch: 0,
    quiz: null,
    questions: [],
    participants: []
  })
  const [loading, setLoading] = React.useState(true)
  const [actionLoading, setActionLoading] = React.useState(false)
  const [questionStats, setQuestionStats] = React.useState<any>(null)
  const [showQR, setShowQR] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null)

  const fullscreenRef = React.useRef<HTMLDivElement>(null)
  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const timerIntervalRef = React.useRef<NodeJS.Timeout | null>(null)
  const lastVersionRef = React.useRef<number>(0)

  const { quiz, questions, participants } = stateCache

  // Optimized fetch with auto-timeout check
  const fetchQuiz = React.useCallback(async (forceRefresh = false) => {
    try {
      const response = await fetch(`/api/live-quiz/${quizId}?check_timeout=true`)
      if (!response.ok) {
        if (response.status === 404) {
          toast.error("Quiz not found")
          router.push('/dashboard/exams')
        }
        return
      }
      
      const data = await response.json()
      
      // Skip update if data hasn't changed
      const newVersion = data.state_version || 0
      if (!forceRefresh && newVersion === lastVersionRef.current && 
          data.participants?.length === participants.length) {
        return
      }
      lastVersionRef.current = newVersion

      setStateCache(prev => ({
        ...prev,
        version: newVersion,
        lastFetch: Date.now(),
        quiz: data,
        questions: data.questions || [],
        participants: data.participants || []
      }))

      // Update timer using server-provided time (synchronized)
      if (data.status === 'active' && data.time_remaining_seconds !== null) {
        setTimeLeft(Math.ceil(data.time_remaining_seconds))
      } else if (data.status !== 'active') {
        setTimeLeft(null)
      }
    } catch (error) {
      console.error('Error fetching quiz:', error)
    } finally {
      setLoading(false)
    }
  }, [quizId, router, participants.length])

  // Fetch question statistics
  const fetchQuestionStats = React.useCallback(async (questionId: string) => {
    try {
      const response = await fetch(`/api/live-quiz/${quizId}/stats?question_id=${questionId}`)
      if (response.ok) {
        const data = await response.json()
        setQuestionStats(data)
      }
    } catch (error) {
      console.error('Error fetching question stats:', error)
    }
  }, [quizId])

  // Initial load and adaptive polling
  React.useEffect(() => {
    fetchQuiz(true)
    
    const startPolling = () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
      
      // Stop polling completely when quiz is ended - no more updates needed
      if (quiz?.status === 'ended') {
        return
      }
      
      // Reduce polling: 2s during active, 3s otherwise
      const interval = quiz?.status === 'active' ? 2000 : 3000
      pollIntervalRef.current = setInterval(() => fetchQuiz(), interval)
    }
    
    startPolling()
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [fetchQuiz, quiz?.status])

  // Countdown timer
  React.useEffect(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)

    if (quiz?.status === 'active' && timeLeft !== null && timeLeft > 0) {
      timerIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 1) {
            fetchQuiz(true) // Refresh when time expires
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [quiz?.status, timeLeft, fetchQuiz])

  // Fetch stats when needed
  React.useEffect(() => {
    const currentQuestion = quiz && quiz.current_question_index >= 0 
      ? questions[quiz.current_question_index] 
      : null
    
    if (currentQuestion && (quiz?.status === 'paused' || quiz?.status === 'showing_results')) {
      fetchQuestionStats(currentQuestion.id)
    }
  }, [quiz?.status, quiz?.current_question_index, questions, fetchQuestionStats])

  // Quiz actions
  const performAction = async (action: string, additionalData = {}) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/live-quiz/${quizId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...additionalData })
      })
      
      if (response.ok) {
        const updatedQuiz = await response.json()
        setStateCache(prev => ({
          ...prev,
          version: updatedQuiz.state_version || prev.version + 1,
          lastFetch: Date.now(),
          quiz: updatedQuiz,
          questions: updatedQuiz.questions || [],
          participants: updatedQuiz.participants || []
        }))
        
        if (action === 'start' || action === 'next_question') {
          const currentQ = updatedQuiz.questions?.[updatedQuiz.current_question_index]
          if (currentQ) setTimeLeft(currentQ.time_limit_seconds)
        }
        
        if (action === 'show_answer' || action === 'close_question') {
          const currentQ = updatedQuiz.questions?.[updatedQuiz.current_question_index]
          if (currentQ) fetchQuestionStats(currentQ.id)
        }
        
        // Show success toast for results visibility changes
        if (action === 'update_settings' && 'show_results_to_students' in additionalData) {
          const visible = (additionalData as any).show_results_to_students
          toast.success(visible ? 'Results published to students' : 'Results hidden from students')
        }
        if (action === 'show_final_results') {
          toast.success('Results published to students')
        }
      } else {
        const error = await response.json()
        toast.error(error.error || "Action failed")
      }
    } catch (error) {
      toast.error("Action failed")
    } finally {
      setActionLoading(false)
    }
  }

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!isFullscreen && fullscreenRef.current) {
      fullscreenRef.current.requestFullscreen?.()
    } else {
      document.exitFullscreen?.()
    }
  }

  React.useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleCopyCode = () => {
    if (quiz?.quiz_code) {
      navigator.clipboard.writeText(quiz.quiz_code)
      toast.success(t('codeCopied') || "Code copied!")
    }
  }

  const currentQuestion = quiz && quiz.current_question_index >= 0 
    ? questions[quiz.current_question_index] 
    : null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading || !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!quiz.status) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Quiz data is loading...</p>
      </div>
    )
  }

  // Fullscreen participants view
  if (isFullscreen) {
    return (
      <div ref={fullscreenRef} className="fixed inset-0 z-50 bg-background p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{quiz.title}</h1>
            <p className="text-xl text-muted-foreground mt-2">
              {t('quizCode') || 'Quiz Code'}: <span className="font-mono font-bold">{quiz.quiz_code}</span>
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold">{participants.length} {t('participants') || 'participants'}</span>
            <NeuButton onClick={toggleFullscreen} size="lg">
              <Minimize2 className="w-6 h-6 mr-2" />
              {t('exitFullscreen') || 'Exit Fullscreen'}
            </NeuButton>
          </div>
        </div>
        
        <div className="relative h-[calc(100%-120px)] border-2 rounded-xl bg-gray-50 dark:bg-gray-900 overflow-hidden">
          <AnimatePresence>
            {participants.map((p) => (
              <motion.div
                key={p.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute px-4 py-2 bg-primary text-primary-foreground rounded-full text-lg font-medium shadow-xl"
                style={{
                  left: `${(p.display_position?.x || Math.random() * 80)}%`,
                  top: `${(p.display_position?.y || Math.random() * 80)}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                {p.participant_name}
                {quiz.status !== 'waiting' && (
                  <span className="ml-3 text-sm opacity-75">{p.total_score} pts</span>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/exams">
            <NeuButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </NeuButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <div className="flex items-center gap-4 mt-1">
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                quiz.status === 'waiting' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                quiz.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                quiz.status === 'paused' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                quiz.status === 'showing_results' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
              }`}>
                {(quiz.status || 'loading').toUpperCase()}
              </span>
              {quiz.status && quiz.status !== 'waiting' && (
                <span className="text-sm text-muted-foreground">
                  Question {quiz.current_question_index + 1} of {questions.length}
                </span>
              )}
            </div>
          </div>
        </div>

        <NeuCard className="px-6 py-3">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-xs text-muted-foreground">{t('quizCode') || 'Quiz Code'}</p>
              <p className="text-2xl font-mono font-bold tracking-wider">{quiz.quiz_code}</p>
            </div>
            <div className="flex gap-2">
              <NeuButton variant="ghost" size="sm" onClick={handleCopyCode}>
                <Copy className="w-4 h-4" />
              </NeuButton>
              <NeuButton variant="ghost" size="sm" onClick={() => setShowQR(!showQR)}>
                <QrCode className="w-4 h-4" />
              </NeuButton>
            </div>
          </div>
        </NeuCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Participants with Fullscreen */}
        <div className="lg:col-span-1" ref={fullscreenRef}>
          <NeuCard className="h-full">
            <NeuCardHeader className="flex flex-row items-center justify-between">
              <NeuCardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t('participants') || 'Participants'} ({participants.length})
              </NeuCardTitle>
              <NeuButton variant="ghost" size="sm" onClick={toggleFullscreen}>
                <Maximize2 className="w-4 h-4" />
              </NeuButton>
            </NeuCardHeader>
            <NeuCardContent>
              {participants.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {t('waitingForParticipants') || 'Waiting for participants...'}
                </p>
              ) : (
                <div className="relative h-64 border rounded-lg bg-gray-50 dark:bg-gray-900 overflow-hidden">
                  <AnimatePresence>
                    {participants.map((p) => (
                      <motion.div
                        key={p.id}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-lg"
                        style={{
                          left: `${(p.display_position?.x || Math.random() * 80)}%`,
                          top: `${(p.display_position?.y || Math.random() * 80)}%`,
                          transform: 'translate(-50%, -50%)'
                        }}
                      >
                        {p.participant_name}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
              
              <div className="mt-4 max-h-48 overflow-y-auto">
                {participants.map((p, index) => (
                  <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm">{index + 1}. {p.participant_name}</span>
                    <span className="text-xs text-muted-foreground">{p.total_score} pts</span>
                  </div>
                ))}
              </div>
            </NeuCardContent>
          </NeuCard>
        </div>

        {/* Controls & Question */}
        <div className="lg:col-span-2 space-y-4">
          {/* Timer (when active) */}
          {quiz.status === 'active' && timeLeft !== null && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
              <NeuCard className={`text-center py-4 ${timeLeft <= 5 ? 'bg-red-50 border-red-200 dark:bg-red-900/20' : ''}`}>
                <div className="flex items-center justify-center gap-4">
                  <Timer className={`w-8 h-8 ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
                  <span className={`text-4xl font-mono font-bold ${timeLeft <= 5 ? 'text-red-600 dark:text-red-400' : 'text-primary'}`}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div className="mt-3 mx-8 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full ${timeLeft <= 5 ? 'bg-red-500' : 'bg-primary'}`}
                    animate={{ width: `${(timeLeft / (currentQuestion?.time_limit_seconds || 30)) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              </NeuCard>
            </motion.div>
          )}

          {/* Controls */}
          <NeuCard>
            <NeuCardContent className="pt-6">
              <div className="flex flex-wrap gap-3 justify-center">
                {quiz.status === 'waiting' && (
                  <NeuButton onClick={() => performAction('start')} disabled={actionLoading || participants.length === 0} size="lg">
                    <Play className="w-5 h-5 mr-2" />
                    {t('startQuiz') || 'Start Quiz'}
                  </NeuButton>
                )}

                {quiz.status === 'active' && (
                  <NeuButton onClick={() => performAction('close_question')} disabled={actionLoading} variant="secondary">
                    <Pause className="w-5 h-5 mr-2" />
                    {t('closeQuestion') || 'Close Question'}
                  </NeuButton>
                )}

                {quiz.status === 'paused' && (
                  <>
                    <NeuButton onClick={() => performAction('show_answer')} disabled={actionLoading} variant="secondary">
                      <Eye className="w-5 h-5 mr-2" />
                      {t('showResults') || 'Show Results'}
                    </NeuButton>
                    <NeuButton onClick={() => performAction('next_question')} disabled={actionLoading}>
                      <SkipForward className="w-5 h-5 mr-2" />
                      {quiz.current_question_index < questions.length - 1 ? (t('nextQuestion') || 'Next Question') : (t('finishQuiz') || 'Finish Quiz')}
                    </NeuButton>
                  </>
                )}

                {quiz.status === 'showing_results' && (
                  <>
                    <NeuButton onClick={() => performAction('next_question')} disabled={actionLoading}>
                      <SkipForward className="w-5 h-5 mr-2" />
                      {quiz.current_question_index < questions.length - 1 ? (t('nextQuestion') || 'Next Question') : (t('finishQuiz') || 'Finish Quiz')}
                    </NeuButton>
                  </>
                )}

                {quiz.status === 'ended' && (
                  <>
                    {quiz.show_results_to_students ? (
                      <NeuButton onClick={() => performAction('update_settings', { show_results_to_students: false })} disabled={actionLoading} variant="secondary">
                        <EyeOff className="w-5 h-5 mr-2" />
                        {t('unpublishResults') || 'Hide Results'}
                      </NeuButton>
                    ) : (
                      <NeuButton onClick={() => performAction('show_final_results')} disabled={actionLoading}>
                        <Eye className="w-5 h-5 mr-2" />
                        {t('publishResults') || 'Publish Results'}
                      </NeuButton>
                    )}
                    <NeuButton onClick={() => router.push('/dashboard')} variant="secondary">
                      <Home className="w-5 h-5 mr-2" />
                      {t('backToDashboard') || 'Back to Dashboard'}
                    </NeuButton>
                  </>
                )}
              </div>
            </NeuCardContent>
          </NeuCard>

          {/* Current Question */}
          {currentQuestion && quiz.status !== 'waiting' && (
            <NeuCard>
              <NeuCardHeader>
                <div className="flex items-center justify-between">
                  <NeuCardTitle>{t('question') || 'Question'} {quiz.current_question_index + 1}</NeuCardTitle>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{currentQuestion.time_limit_seconds}s • {currentQuestion.points} pts</span>
                  </div>
                </div>
              </NeuCardHeader>
              <NeuCardContent>
                <p className="text-lg mb-6">{currentQuestion.question_text}</p>
                
                <div className="space-y-3">
                  {(currentQuestion.options as any[])?.map((option: any) => {
                    const isCorrect = (currentQuestion.correct_options as string[])?.includes(option.id)
                    const percentage = questionStats?.option_percentages?.[option.id] || 0
                    const showStats = quiz.status === 'paused' || quiz.status === 'showing_results' || quiz.status === 'ended'
                    const showCorrect = quiz.status === 'showing_results' || quiz.status === 'ended'
                    
                    return (
                      <div key={option.id} className={`relative p-4 rounded-lg border-2 transition-all ${
                        showCorrect && isCorrect ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {showCorrect && (isCorrect ? <Check className="w-5 h-5 text-green-600" /> : <X className="w-5 h-5 text-gray-400" />)}
                            <span>{option.text}</span>
                          </div>
                          {showStats && <span className="text-sm font-medium">{percentage}%</span>}
                        </div>
                        {showStats && (
                          <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${percentage}%` }} className={`h-full ${showCorrect && isCorrect ? 'bg-green-500' : 'bg-blue-500'}`} />
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {questionStats && (quiz.status === 'paused' || quiz.status === 'showing_results') && (
                  <div className="mt-4 text-center text-sm text-muted-foreground">
                    <BarChart3 className="w-4 h-4 inline mr-1" />
                    {questionStats.total_responses} / {participants.length} {t('responses') || 'responses'}
                    {quiz.status === 'showing_results' && questionStats.total_responses > 0 && (
                      <span className="ml-2">({questionStats.correct_percentage}% {t('correct') || 'correct'})</span>
                    )}
                  </div>
                )}
              </NeuCardContent>
            </NeuCard>
          )}

          {/* Waiting State */}
          {quiz.status === 'waiting' && (
            <NeuCard className="text-center py-12">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t('waitingToStart') || 'Waiting to Start'}</h3>
              <p className="text-muted-foreground mb-4">{t('shareCodeWithStudents') || 'Share the quiz code with your students'}</p>
              <p className="text-4xl font-mono font-bold tracking-widest text-primary">{quiz.quiz_code}</p>
              <p className="text-sm text-muted-foreground mt-4">{participants.length} {t('participantsJoined') || 'participants joined'}</p>
            </NeuCard>
          )}

          {/* Final Results */}
          {quiz.status === 'ended' && (
            <NeuCard>
              <NeuCardHeader>
                <NeuCardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  {t('finalResults') || 'Final Results'}
                  {!quiz.show_results_to_students && (
                    <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 px-2 py-1 rounded ml-2">
                      {t('hiddenFromStudents') || 'Hidden from students'}
                    </span>
                  )}
                </NeuCardTitle>
              </NeuCardHeader>
              <NeuCardContent>
                <div className="space-y-2">
                  {(() => {
                    // Sort participants: by score (desc), then correct (desc)
                    const sorted = [...participants].sort((a, b) => {
                      if (b.total_score !== a.total_score) return b.total_score - a.total_score
                      return b.total_correct - a.total_correct
                    })
                    
                    // Calculate ranks with ties
                    let currentRank = 1
                    return sorted.map((p, index) => {
                      if (index > 0 && p.total_score !== sorted[index - 1].total_score) {
                        currentRank = index + 1
                      }
                      return (
                        <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            currentRank === 1 ? 'bg-yellow-50 border border-yellow-200 dark:bg-yellow-900/20' :
                            currentRank === 2 ? 'bg-gray-50 border border-gray-200 dark:bg-gray-800' :
                            currentRank === 3 ? 'bg-orange-50 border border-orange-200 dark:bg-orange-900/20' :
                            'bg-white border border-gray-100 dark:bg-gray-900'
                          }`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              currentRank === 1 ? 'bg-yellow-500 text-white' :
                              currentRank === 2 ? 'bg-gray-400 text-white' :
                              currentRank === 3 ? 'bg-orange-400 text-white' :
                              'bg-gray-200 text-gray-600 dark:bg-gray-700'
                            }`}>{currentRank}</span>
                            <span className="font-medium">{p.participant_name}</span>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{p.total_score} pts</p>
                            <p className="text-xs text-muted-foreground">{p.total_correct}/{questions.length} correct</p>
                          </div>
                        </motion.div>
                      )
                    })
                  })()}
                </div>
              </NeuCardContent>
            </NeuCard>
          )}
        </div>
      </div>
    </div>
  )
}
