'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { getGuestSessionData, isGuestSession } from '@/lib/utils/guest-session'
import { Exam, Question, ExamSession } from '@/lib/types'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuTimer } from '@/components/ui/neu-timer'
import { NeuModal } from '@/components/ui/neu-modal'
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
  Clock,
  AlertTriangle,
  EyeOff,
  LayoutGrid,
  Flag,
  WifiOff
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { useNetworkStatus } from '@/lib/hooks/use-network-status'
import { useTranslation } from 'react-i18next' // ADD THIS IMPORT

export default function TakeExamPage() {
  const isOnline = useNetworkStatus()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const supabase = createClient()
  const { t } = useTranslation() // ADD THIS HOOK

  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [session, setSession] = useState<ExamSession | null>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string | number[]>>({})
  const [markedQuestions, setMarkedQuestions] = useState<Set<string>>(new Set())
  const [showQuestionMap, setShowQuestionMap] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [totalTime, setTotalTime] = useState(0)

  const [questionTimeLeft, setQuestionTimeLeft] = useState<number | null>(null)
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Proctoring States
  const [infractions, setInfractions] = useState<number>(0)
  const [warningCount, setWarningCount] = useState(0)

  // Refs for stable access in event listeners
  const sessionRef = useRef<ExamSession | null>(null)
  const examRef = useRef<Exam | null>(null)
  const lastInfractionTimeRef = useRef<number>(0) // Track last infraction to prevent duplicates
  const lastToastTimeRef = useRef<number>(0) // Track last toast to prevent duplicate visuals

  useEffect(() => {
    sessionRef.current = session
  }, [session])

  useEffect(() => {
    examRef.current = exam
  }, [exam])

  const sessionId = searchParams.get('session')
  const guestData = getGuestSessionData()
  const isGuest = isGuestSession()

  // STABLE HELPERS AT TOP
  const loadExamData = useCallback(async () => {
    if (!sessionId) return
    try {
      setLoading(true)
      const res = await fetch(`/api/sessions/${sessionId}`)
      if (!res.ok) {
        toast.error(t('examSessionNotFound')) // TRANSLATED
        router.push('/join')
        return
      }

      const sessionData = await res.json()

      if (!isGuest && (!user || sessionData.student_id !== user.id)) {
        toast.error(t('accessDenied')) // TRANSLATED
        router.push('/join')
        return
      }

      if (isGuest && (!guestData || sessionData.guest_email !== guestData.guestEmail)) {
        toast.error(t('accessDenied')) // TRANSLATED
        router.push('/join')
        return
      }

      // Strict Flow: If completed, redirect immediately to results
      if (sessionData.status === 'completed') {
        router.replace(`/results?session=${sessionId}`)
        return
      }

      setSession(sessionData)
      setExam(sessionData.exam)

      // Update refs for stable access in other effects
      sessionRef.current = sessionData
      examRef.current = sessionData.exam

      // Load previous infractions if any
      if (sessionData.proctoring_data && sessionData.proctoring_data.infractions) {
        setInfractions(sessionData.proctoring_data.infractions.length)
      }

      const questionsRes = await fetch(`/api/exams/${sessionData.exam.id}/questions`)
      if (!questionsRes.ok) {
        toast.error(t('failedToLoadQuestions')) // TRANSLATED
        return
      }

      const questionsData = await questionsRes.json()
      setQuestions(questionsData)

      if (sessionData.answers) {
        if (Array.isArray(sessionData.answers)) {
          const answerMap: Record<string, string> = {}
          sessionData.answers.forEach((ans: any) => {
            answerMap[ans.question_id] = ans.answer
          })
          setAnswers(answerMap)
        } else {
          setAnswers(sessionData.answers as Record<string, string>)
        }
      }


      if (sessionData.started_at && sessionData.exam.duration_minutes) {
        const startTime = new Date(sessionData.started_at).getTime()
        const durationSeconds = sessionData.exam.duration_minutes * 60
        setTotalTime(durationSeconds)

        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, (durationSeconds * 1000) - elapsed)
        setTimeLeft(Math.floor(remaining / 1000))
      }

      // Auto-start session if exam is active but session hasn't started
      if (sessionData.exam.status === 'active' && sessionData.status === 'not_started') {
        // Update session status to in_progress
        try {
          const startedAt = new Date().toISOString()
          const response = await fetch(`/api/sessions/${sessionId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'in_progress',
              started_at: startedAt
            })
          })

          if (response.ok) {
            // Update local state immediately
            const updatedSession = {
              ...sessionData,
              status: 'in_progress' as const,
              started_at: startedAt
            }
            setSession(updatedSession)
            sessionRef.current = updatedSession

            // Initialize the timer
            if (sessionData.exam.duration_minutes) {
              const durationSeconds = sessionData.exam.duration_minutes * 60
              setTotalTime(durationSeconds)
              setTimeLeft(durationSeconds)
            }
          } else {
            console.error('Failed to auto-start session')
          }
        } catch (e) {
          console.error('Error auto-starting session:', e)
        }
      }

    } catch (error) {
      console.error('Error loading exam data:', error)
      toast.error(t('failedToLoadExam')) // TRANSLATED
      router.push('/join')
    } finally {
      setLoading(false)
    }
  }, [sessionId, isGuest, user, guestData, router, t]) // ADD t TO DEPENDENCIES

  const submitExam = useCallback(async () => {
    if (!session || !exam) return
    if (!isOnline) {
      toast.error(t('youAreOffline')) // TRANSLATED
      return
    }
    setSubmitting(true)
    try {
      const studentAnswers = questions.map(question => {
        const answer = answers[question.id]
        return {
          question_id: question.id,
          answer: answer || '',
          is_correct: false,
          points_earned: 0
        }
      })

      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submitted_at: new Date().toISOString(),
          status: 'completed',
          answers: studentAnswers
        })
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        toast.error(errorData.error || t('failedToSubmitExam')) // TRANSLATED
        return
      }

      toast.success(t('examSubmittedSuccessfully')) // TRANSLATED
      if (isGuest) sessionStorage.removeItem('guestExamSession')
      router.replace(`/results?session=${sessionId}`)
    } catch (error) {
      console.error('Error submitting exam:', error)
      toast.error(t('failedToSubmitExam')) // TRANSLATED
    } finally {
      setSubmitting(false)
    }
  }, [session, exam, isOnline, questions, answers, sessionId, isGuest, router, t]) // ADD t TO DEPENDENCIES

  const handleTimeUp = useCallback(() => {
    toast.info(t('timeIsUpSubmitting')) // TRANSLATED
    submitExam()
  }, [submitExam, t]) // ADD t TO DEPENDENCIES

  const recordInfraction = useCallback(async (type: string) => {
    const now = Date.now()
    if (now - lastInfractionTimeRef.current < 1000) {
      return
    }
    lastInfractionTimeRef.current = now

    setInfractions(prev => prev + 1)
    setWarningCount(prev => prev + 1)

    toast.error(t('proctoringAlert'), { // TRANSLATED
      description: t('activityMonitored'), // TRANSLATED
      duration: 4000,
      id: 'proctoring-alert'
    })

    try {
      const response = await fetch(`/api/sessions/${sessionId}/infractions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })

      if (!response.ok) {
        console.error('Failed to save infraction')
      }
    } catch (e) {
      console.error("Failed to record infraction", e)
    }
  }, [sessionId, t]) // ADD t TO DEPENDENCIES

  const startExamSession = useCallback(async () => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' })
      })

      if (!response.ok) {
        console.error('Failed to start session:', response.statusText)
        return
      }

      // Immediately update local state
      setSession(prev => {
        if (!prev) return prev
        const updated = { ...prev, status: 'in_progress' as const }
        sessionRef.current = updated
        return updated
      })

      // Reload exam data to ensure everything is in sync
      await loadExamData()
    } catch (e) {
      console.error("Failed to start session", e)
    }
  }, [sessionId, loadExamData])

  const saveAnswer = async (questionId: string, answer: string | number[]) => {
    const newAnswers = { ...answers, [questionId]: answer }
    setAnswers(newAnswers)

    if (!isOnline) {
      toast.warning(t('offlineSaveLocal'), { id: 'offline-save' }) // TRANSLATED
      return
    }

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

  const toggleMultipleChoiceAnswer = (questionId: string, optionIndex: number) => {
    const currentAnswer = answers[questionId]
    let newAnswer: number[]
    
    if (Array.isArray(currentAnswer)) {
      // If already an array, toggle the option
      if (currentAnswer.includes(optionIndex)) {
        newAnswer = currentAnswer.filter(v => v !== optionIndex)
      } else {
        newAnswer = [...currentAnswer, optionIndex]
      }
    } else if (typeof currentAnswer === 'number' && currentAnswer === optionIndex) {
      // If it's a single value that matches, remove it
      newAnswer = []
    } else if (typeof currentAnswer === 'number') {
      // If it's a different single value, make it an array with both
      newAnswer = [currentAnswer, optionIndex]
    } else {
      // No answer yet, start with this one
      newAnswer = [optionIndex]
    }
    
    saveAnswer(questionId, newAnswer.length === 0 ? [] : newAnswer)
  }

  const toggleMarkQuestion = (questionId: string) => {
    setMarkedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) {
        next.delete(questionId)
        toast.success(t('questionUnmarked')) // TRANSLATED
      } else {
        next.add(questionId)
        toast.info(t('questionMarkedForReview')) // TRANSLATED
      }
      return next
    })
  }

  // EFFECTS
  useEffect(() => {
    if (!sessionId) {
      toast.error(t('examSessionNotFound')) // TRANSLATED
      router.push('/join')
      return
    }
    loadExamData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, t]) // ADD t TO DEPENDENCIES

  useEffect(() => {
    const handleVisibilityChange = () => {
      const currentExam = examRef.current
      const currentSession = sessionRef.current

      if (!currentExam?.proctoring_enabled || !currentSession || currentSession.status !== 'in_progress') {
        return
      }

      if (document.hidden) {
        recordInfraction('tab_switch')
      }
    }

    const handleBlur = () => {
      const currentExam = examRef.current
      const currentSession = sessionRef.current

      if (!currentExam?.proctoring_enabled || !currentSession || currentSession.status !== 'in_progress') {
        return
      }

      recordInfraction('focus_lost')
    }

    console.log('Setting up proctoring event listeners')
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)

    return () => {
      console.log('Cleaning up proctoring event listeners')
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
    }
  }, [recordInfraction])

  useEffect(() => {
    if (!exam?.id || !session?.id) return;
    const channel = supabase
      .channel(`exam_${exam.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'exams',
        filter: `id=eq.${exam.id}`,
      }, (payload) => {
        const newStatus = payload.new.status
        const currentExamStatus = examRef.current?.status
        if (newStatus === 'active' && currentExamStatus === 'upcoming') {
          toast.success(t('theExamHasStarted')) // TRANSLATED
          setExam(prev => prev ? ({ ...prev, status: 'active' }) : null)
          startExamSession()
        } else if (newStatus === 'ended' && currentExamStatus !== 'ended') {
          toast.info(t('teacherEndedExam')) // TRANSLATED
          submitExam()
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [exam?.id, session?.id, startExamSession, submitExam, t]) // ADD t TO DEPENDENCIES

  useEffect(() => {
    if (!exam || exam.status !== 'active' || timeLeft === 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleTimeUp()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [exam?.status, handleTimeUp])

  useEffect(() => {
    const currentQuestion = questions[currentQuestionIndex]

    if (questionTimerRef.current) {
      clearInterval(questionTimerRef.current)
      questionTimerRef.current = null
    }
    setQuestionTimeLeft(null)

    if (currentQuestion?.time_limit) {
      setQuestionTimeLeft(currentQuestion.time_limit * 60)

      questionTimerRef.current = setInterval(() => {
        setQuestionTimeLeft(prev => {
          if (prev === null) return null
          if (prev <= 1) {
            if (questionTimerRef.current) clearInterval(questionTimerRef.current)
            toast.warning(t('timesUpQuestion')) // TRANSLATED
            if (currentQuestionIndex < questions.length - 1) {
              setCurrentQuestionIndex(idx => idx + 1)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current)
    }
  }, [currentQuestionIndex, questions, t]) // ADD t TO DEPENDENCIES

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground animate-pulse">{t('loadingYourExam')}</p> {/* TRANSLATED */}
        </div>
      </div>
    )
  }

  if (!exam || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <NeuCard className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{t('examLinkIncorrect')}</h1> {/* TRANSLATED */}
            <p className="text-muted-foreground">
              {t('waitTeacherStart')} {/* TRANSLATED */}
            </p>
          </div>
          <NeuButton onClick={() => router.push('/join')}>{t('returnToJoin')}</NeuButton> {/* TRANSLATED */}
        </NeuCard>
      </div>
    )
  }

  // EXAM NOT STARTED (WAITING ROOM)
  if (exam.status === 'upcoming') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30 p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full"
        >
          <NeuCard className="p-8 md:p-12 text-center space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-primary animate-pulse" />

            <div className="space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto transform rotate-12">
                <Clock className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">{exam.title}</h1>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary rounded-full text-sm font-medium text-secondary-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                {t('waitingRoom')} {/* TRANSLATED */}
              </div>
            </div>

            <div className="bg-card border-2 border-border rounded-2xl p-6 space-y-4">
              <p className="text-muted-foreground text-lg">
                {t('waitTeacherStart')} {/* TRANSLATED */}
              </p>
              <div className="flex flex-col gap-2 text-sm text-left">
                <div className="flex justify-between items-center p-2 bg-secondary/50 rounded-lg">
                  <span className="text-muted-foreground">{t('student') || 'Student:'}</span>
                  <span className="font-bold">{isGuest ? guestData?.guestName : user?.email}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-secondary/50 rounded-lg">
                  <span className="text-muted-foreground">{t('status') || 'Status:'}</span>
                  <span className="font-bold text-primary">{t('readyToStart')}</span> {/* TRANSLATED */}
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('dontRefresh')} {/* TRANSLATED */}
            </p>
          </NeuCard>
        </motion.div>
      </div>
    )
  }

  // EXAM ENDED
  if (exam.status === 'ended' && session.status !== 'completed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <NeuCard className="max-w-md w-full p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <EyeOff className="w-10 h-10 text-amber-600" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">{t('examEnded')}</h1> {/* TRANSLATED */}
            <p className="text-muted-foreground">
              {t('contactInstructor')} {/* TRANSLATED */}
            </p>
          </div>
          <NeuButton onClick={() => router.push('/')}>{t('returnHome')}</NeuButton> {/* TRANSLATED */}
        </NeuCard>
      </div>
    )
  }

  // EXAM ALREADY SUBMITTED
  if (session.status === 'completed') {
    router.replace(`/results?session=${sessionId}`)
    return null
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">{t('noQuestionsAvailable')}</p> {/* TRANSLATED */}
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progressPercent = ((currentQuestionIndex + 1) / questions.length) * 100
  const isMarked = markedQuestions.has(currentQuestion.id)

  return (
    <div className="min-h-screen bg-secondary/30 flex flex-col user-select-none">
      {/* Question Map Modal */}
      <NeuModal
        open={showQuestionMap}
        onClose={() => setShowQuestionMap(false)}
        title={t('questionMap')} // TRANSLATED
        description={t('jumpToQuestion')} // TRANSLATED
      >
        <div className="grid grid-cols-5 gap-2 max-h-[60vh] overflow-y-auto p-1">
          {questions.map((q, idx) => {
            const isAnswered = !!answers[q.id]
            const isCurrent = idx === currentQuestionIndex
            const isMarked = markedQuestions.has(q.id)

            return (
              <button
                key={q.id}
                onClick={() => {
                  setCurrentQuestionIndex(idx)
                  setShowQuestionMap(false)
                }}
                className={cn(
                  "h-12 rounded-lg flex flex-col items-center justify-center text-sm font-medium border-2 transition-all relative overflow-hidden",
                  isCurrent
                    ? "border-primary bg-primary/10 text-primary"
                    : isAnswered
                      ? "border-green-500/50 bg-green-50 text-green-700"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary",
                  isMarked && !isCurrent && "border-amber-400 border-dashed bg-amber-50"
                )}
              >
                <span>{idx + 1}</span>
                {isMarked && (
                  <div className="absolute top-1 right-1">
                    <Flag className="w-3 h-3 text-amber-500 fill-amber-500" />
                  </div>
                )}
              </button>
            )
          })}
        </div>
        <div className="mt-4 flex gap-4 text-xs text-muted-foreground justify-center">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-50 border border-green-500/50" /> {t('answered')} {/* TRANSLATED */}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-50 border-2 border-dashed border-amber-400" /> {t('marked')} {/* TRANSLATED */}
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-card border-2 border-border" /> {t('unanswered')} {/* TRANSLATED */}
          </div>
        </div>
      </NeuModal>

      {/* Sticky Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="font-bold text-lg hidden md:block">{exam.title}</h1>
            <div className="h-6 w-[1px] bg-border hidden md:block" />

            <NeuButton
              size="sm"
              variant="ghost"
              onClick={() => setShowQuestionMap(true)}
              className="gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">{t('questionMap')}</span> {/* TRANSLATED */}
              <span className="inline sm:hidden">{currentQuestionIndex + 1} / {questions.length}</span>
            </NeuButton>
          </div>

          <div className="flex items-center gap-4">
            {!isOnline && (
              <div className="flex items-center gap-2 text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 animate-pulse">
                <WifiOff className="w-4 h-4" />
                {t('offline') || 'OFFLINE'}
              </div>
            )}

            {/* Infraction Counter - only show if proctoring is enabled and student has infractions */}
            {exam?.proctoring_enabled && infractions > 0 && (
              <div className="flex items-center gap-2 text-xs font-bold text-orange-700 bg-orange-100 px-3 py-1.5 rounded-full border-2 border-orange-300 animate-pulse">
                <AlertTriangle className="w-4 h-4" />
                <span>{infractions} {infractions === 1 ? t('warning') || 'Warning' : t('warnings') || 'Warnings'}</span>
              </div>
            )}

            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('timeRemaining')}</span> {/* TRANSLATED */}
              <NeuTimer
                totalSeconds={totalTime}
                remainingSeconds={timeLeft}
                className="text-lg font-mono font-bold"
              />
            </div>
          </div>
        </div>
        <div className="w-full h-1 bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
          />
        </div>
      </header>

      {!isOnline && (
        <div className="bg-red-600 text-white text-center py-2 text-sm font-medium animate-in slide-in-from-top duration-300">
          {t('offlineAnswersSaved')} {/* TRANSLATED */}
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <NeuCard className="p-6 md:p-10 min-h-[400px] flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground font-black text-lg shadow-lg">
                      {currentQuestionIndex + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-70">
                        {t('question')} {/* TRANSLATED */}
                      </span>
                      <span className="text-sm font-bold capitalize">
                        {currentQuestion.question_type.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('points')}</span> {/* TRANSLATED */}
                      <span className="text-lg font-black text-primary">{currentQuestion.points}</span>
                    </div>
                    {questionTimeLeft !== null && (
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground">{t('limit')}</span> {/* TRANSLATED */}
                        <div className={cn(
                          "flex items-center gap-1.5 font-mono font-bold px-3 py-1 rounded-lg border-2",
                          questionTimeLeft < 30
                            ? "text-red-600 bg-red-50 border-red-200 animate-pulse"
                            : "text-orange-600 bg-orange-50 border-orange-100"
                        )}>
                          <Clock className="w-3.5 h-3.5" />
                          {Math.floor(questionTimeLeft / 60)}:{String(questionTimeLeft % 60).padStart(2, '0')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="prose prose-lg dark:prose-invert max-w-none">
                  <h2 className="text-2xl md:text-3xl font-black leading-tight text-foreground mb-8">
                    {currentQuestion.question_text}
                  </h2>
                </div>

                <div className="space-y-4 my-8">
                  {/* Multiple Choice & MCQ */}
                  {((currentQuestion.question_type as string) === 'multiple_choice' || (currentQuestion.question_type as string) === 'mcq') && currentQuestion.options && (
                    <div className="grid gap-4">
                      {(currentQuestion.options as any).map((option: any, index: number) => {
                        const val = option.text || option
                        const currentAnswer = answers[currentQuestion.id]
                        const isSelected = Array.isArray(currentAnswer) 
                          ? currentAnswer.includes(index)
                          : typeof currentAnswer === 'number' && currentAnswer === index
                        
                        return (
                          <motion.div
                            key={index}
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <label
                              className={cn(
                                "flex items-center p-6 rounded-2xl border-4 cursor-pointer transition-all duration-200",
                                isSelected
                                  ? "border-primary bg-primary/5 shadow-[8px_8px_0px_0px_rgba(var(--primary-rgb),0.1)]"
                                  : "border-border bg-card hover:border-primary/50 hover:bg-secondary/50"
                              )}
                            >
                              <input
                                type="checkbox"
                                name={`question-${currentQuestion.id}`}
                                value={index}
                                checked={isSelected}
                                onChange={() => toggleMultipleChoiceAnswer(currentQuestion.id, index)}
                                className="sr-only"
                              />
                              <div className={cn(
                                "w-8 h-8 rounded-xl border-4 flex items-center justify-center mr-6 transition-all duration-300",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground transform rotate-12 scale-110"
                                  : "border-muted-foreground/30"
                              )}>
                                {isSelected && <Check className="w-5 h-5 stroke-[4px]" />}
                              </div>
                              <span className="text-xl font-bold tracking-tight">{val}</span>
                            </label>
                          </motion.div>
                        )
                      })}
                      <p className="text-xs text-muted-foreground text-center mt-2">
                        Select one or more answers (multiple selections allowed)
                      </p>
                    </div>
                  )}

                  {/* True / False */}
                  {((currentQuestion.question_type as string) === 'true_false' || (currentQuestion.question_type as string) === 'truefalse') && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {['true', 'false'].map((val) => {
                        const isSelected = answers[currentQuestion.id] === val
                        return (
                          <motion.div key={val} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <label
                              className={cn(
                                "flex flex-col items-center justify-center p-10 rounded-3xl border-4 cursor-pointer transition-all duration-300 h-48",
                                isSelected
                                  ? "border-primary bg-primary/5 shadow-[8px_8px_0px_0px_rgba(var(--primary-rgb),0.1)]"
                                  : "border-border bg-card hover:border-primary/50 hover:bg-secondary/50"
                              )}
                            >
                              <input
                                type="radio"
                                name={`question-${currentQuestion.id}`}
                                value={val}
                                checked={isSelected}
                                onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                                className="sr-only"
                              />
                              <span className={cn(
                                "text-3xl font-black capitalize transition-all duration-300",
                                isSelected ? "text-primary scale-110" : "text-foreground"
                              )}>
                                {val}
                              </span>
                            </label>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}

                  {/* Text Inputs */}
                  {((currentQuestion.question_type as string) === 'short_answer' || (currentQuestion.question_type as string) === 'shortanswer' || (currentQuestion.question_type as string) === 'essay') && (
                    <div className="relative group">
                      <textarea
                        className="w-full p-6 text-xl font-medium border-4 border-border rounded-3xl focus:ring-8 focus:ring-primary/10 focus:border-primary transition-all outline-none bg-card resize-y min-h-[200px] shadow-sm group-hover:shadow-md"
                        rows={currentQuestion.question_type === 'essay' ? 10 : 5}
                        placeholder={t('startTypingAnswer')}  
                        value={typeof answers[currentQuestion.id] === 'string' ? answers[currentQuestion.id] as string : ''}
                        onChange={(e) => saveAnswer(currentQuestion.id, e.target.value)}
                      />
                      <div className="absolute bottom-6 right-6 flex items-center gap-2 px-3 py-1 bg-secondary rounded-full text-[10px] font-black uppercase text-muted-foreground border-2 border-border shadow-sm">
                        <span>{t('words')}: {(() => {
                          const answer = answers[currentQuestion.id]
                          if (typeof answer === 'string') {
                            const trimmed = answer.trim()
                            if (trimmed === '') {
                              return 0
                            }
                            return trimmed.split(/\s+/).length
                          }
                          return 0
                        })()}</span> 
                        <span className="opacity-30">|</span>
                        <span>{t('chars')}: {(() => {
                          const answer = answers[currentQuestion.id]
                          if (typeof answer === 'string') {
                            return answer.length
                          }
                          return 0
                        })()}</span> 
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="mt-12 flex items-center justify-between pt-8 border-t-4 border-dashed border-border">
                <div className="flex gap-4">
                  <NeuButton
                    variant="ghost"
                    onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                    disabled={currentQuestionIndex === 0}
                    className="gap-3 px-6 h-14 rounded-2xl font-bold"
                  >
                    <ArrowLeft className="w-5 h-5 stroke-[3px]" />
                    <span className="hidden sm:inline">{t('previous')}</span> {/* TRANSLATED */}
                  </NeuButton>

                  <NeuButton
                    variant="ghost"
                    onClick={() => toggleMarkQuestion(currentQuestion.id)}
                    className={cn(
                      "gap-3 px-6 h-14 rounded-2xl font-bold border-4",
                      isMarked
                        ? "text-amber-600 bg-amber-50 border-amber-200 hover:bg-amber-100"
                        : "text-muted-foreground border-transparent hover:border-border"
                    )}
                  >
                    <Flag className={cn("w-5 h-5", isMarked ? "fill-amber-600 stroke-[3px]" : "stroke-[2px]")} />
                    <span className="hidden sm:inline">{isMarked ? t('questionMarked') : t('markForReview')}</span> {/* TRANSLATED */}
                  </NeuButton>
                </div>

                {currentQuestionIndex < questions.length - 1 ? (
                  <NeuButton
                    onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                    className="gap-3 px-8 h-14 rounded-2xl font-black text-lg shadow-[8px_8px_0px_0px_rgba(var(--primary-rgb),0.2)] hover:shadow-none translate-y-[-4px] hover:translate-y-0"
                  >
                    {t('nextQuestion')} {/* TRANSLATED */}
                    <ArrowRight className="w-5 h-5 stroke-[3px]" />
                  </NeuButton>
                ) : (
                  <NeuButton
                    onClick={submitExam}
                    disabled={submitting}
                    className="bg-green-600 hover:bg-green-700 text-white gap-3 px-8 h-14 rounded-2xl font-black text-lg shadow-[8px_8px_0px_0px_rgba(22,163,74,0.2)] hover:shadow-none translate-y-[-4px] hover:translate-y-0"
                  >
                    {submitting ? (
                      <Loader2 className="w-6 h-6 animate-spin" />
                    ) : (
                      <>
                        {t('completeSubmit')} {/* TRANSLATED */}
                        <Check className="w-6 h-6 stroke-[4px]" />
                      </>
                    )}
                  </NeuButton>
                )}
              </div>
            </NeuCard>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}