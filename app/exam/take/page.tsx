"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuTimer } from "@/components/ui/neu-timer"
import { NeuProgressGrid, type QuestionStatus } from "@/components/ui/neu-progress"
import { NeuModal } from "@/components/ui/neu-modal"
import { ProctoringBadge } from "@/components/ui/proctoring-badge"
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Send,
  Maximize,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react"

interface Question {
  id: number
  type: "mcq" | "truefalse" | "shortanswer" | "essay"
  text: string
  options?: string[]
  timeLimit?: number
}

const examQuestions: Question[] = [
  {
    id: 1,
    type: "mcq",
    text: "What is the time complexity of binary search in a sorted array?",
    options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
  },
  {
    id: 2,
    type: "mcq",
    text: "Which data structure uses LIFO (Last In First Out) principle?",
    options: ["Queue", "Stack", "Array", "Linked List"],
  },
  {
    id: 3,
    type: "truefalse",
    text: "A binary tree can have at most two children for each node.",
  },
  {
    id: 4,
    type: "shortanswer",
    text: "What does HTML stand for?",
  },
  {
    id: 5,
    type: "mcq",
    text: "Which sorting algorithm has the best average-case time complexity?",
    options: ["Bubble Sort", "Quick Sort", "Selection Sort", "Insertion Sort"],
  },
  {
    id: 6,
    type: "truefalse",
    text: "TCP is a connectionless protocol.",
  },
  {
    id: 7,
    type: "essay",
    text: "Explain the difference between process and thread in operating systems. Include examples of when you would use each.",
  },
  {
    id: 8,
    type: "mcq",
    text: "What is the purpose of the 'this' keyword in JavaScript?",
    options: [
      "To declare a variable",
      "To reference the current object",
      "To create a new function",
      "To import modules",
    ],
  },
  {
    id: 9,
    type: "shortanswer",
    text: "Name one advantage of using a hash table over an array.",
  },
  {
    id: 10,
    type: "mcq",
    text: "Which of the following is NOT a valid HTTP method?",
    options: ["GET", "POST", "FETCH", "DELETE"],
  },
]

export default function ExamTakingPage() {
  const router = useRouter()

  // Exam state
  const [currentQuestion, setCurrentQuestion] = React.useState(0)
  const [answers, setAnswers] = React.useState<Record<number, string | number | boolean>>({})
  const [markedForReview, setMarkedForReview] = React.useState<Set<number>>(new Set())
  const [totalSeconds] = React.useState(3600) // 60 minutes
  const [remainingSeconds, setRemainingSeconds] = React.useState(3600)

  // Proctoring state
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showFullscreenPrompt, setShowFullscreenPrompt] = React.useState(true)
  const [showFullscreenWarning, setShowFullscreenWarning] = React.useState(false)
  const [fullscreenWarningCountdown, setFullscreenWarningCountdown] = React.useState(10)
  const [showFocusLostOverlay, setShowFocusLostOverlay] = React.useState(false)
  const [infractions, setInfractions] = React.useState(0)
  const [proctoringActive] = React.useState(true)

  // Modal state
  const [showTimeWarning, setShowTimeWarning] = React.useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [showSubmitSuccess, setShowSubmitSuccess] = React.useState(false)
  const [showSidebar, setShowSidebar] = React.useState(false)

  // Auto-save state
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)

  // Timer effect
  React.useEffect(() => {
    if (showFullscreenPrompt || showSubmitSuccess) return

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleAutoSubmit()
          return 0
        }
        if (prev === 300) {
          setShowTimeWarning(true)
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showFullscreenPrompt, showSubmitSuccess])

  // Auto-save effect
  React.useEffect(() => {
    const saveInterval = setInterval(() => {
      if (Object.keys(answers).length > 0) {
        setIsSaving(true)
        setTimeout(() => {
          setLastSaved(new Date())
          setIsSaving(false)
        }, 500)
      }
    }, 30000)

    return () => clearInterval(saveInterval)
  }, [answers])

  // Fullscreen warning countdown
  React.useEffect(() => {
    if (!showFullscreenWarning) return

    const countdown = setInterval(() => {
      setFullscreenWarningCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdown)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdown)
  }, [showFullscreenWarning])

  // Prevent copy/paste and right-click
  React.useEffect(() => {
    if (showFullscreenPrompt) return

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
    }

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "v" || e.key === "x")) {
        e.preventDefault()
      }
    }

    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("copy", handleCopy)
    document.addEventListener("paste", handleCopy)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("copy", handleCopy)
      document.removeEventListener("paste", handleCopy)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [showFullscreenPrompt])

  // Focus detection
  React.useEffect(() => {
    if (showFullscreenPrompt) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setShowFocusLostOverlay(true)
        setInfractions((prev) => prev + 1)
      }
    }

    const handleBlur = () => {
      setShowFocusLostOverlay(true)
      setInfractions((prev) => prev + 1)
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("blur", handleBlur)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("blur", handleBlur)
    }
  }, [showFullscreenPrompt])

  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
      setShowFullscreenPrompt(false)
    } catch (err) {
      console.error("Failed to enter fullscreen:", err)
    }
  }

  const handleFullscreenExit = () => {
    setIsFullscreen(false)
    setShowFullscreenWarning(true)
    setFullscreenWarningCountdown(10)
    setInfractions((prev) => prev + 1)
  }

  React.useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && !showFullscreenPrompt) {
        handleFullscreenExit()
      }
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [showFullscreenPrompt])

  const reenterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
      setShowFullscreenWarning(false)
    } catch (err) {
      console.error("Failed to re-enter fullscreen:", err)
    }
  }

  const handleAnswer = (value: string | number | boolean) => {
    setAnswers((prev) => ({ ...prev, [examQuestions[currentQuestion].id]: value }))
  }

  const toggleMarkForReview = () => {
    setMarkedForReview((prev) => {
      const newSet = new Set(prev)
      const questionId = examQuestions[currentQuestion].id
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  const goToQuestion = (index: number) => {
    setCurrentQuestion(index)
    setShowSidebar(false)
  }

  const handleAutoSubmit = () => {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setShowSubmitSuccess(true)
    }, 2000)
  }

  const handleSubmit = () => {
    setShowSubmitConfirm(false)
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      setShowSubmitSuccess(true)
    }, 2000)
  }

  const questionStatuses: QuestionStatus[] = examQuestions.map((q, i) => ({
    id: q.id,
    answered: answers[q.id] !== undefined,
    markedForReview: markedForReview.has(q.id),
    current: i === currentQuestion,
  }))

  const question = examQuestions[currentQuestion]
  const answeredCount = Object.keys(answers).length

  // Fullscreen prompt overlay
  if (showFullscreenPrompt) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <NeuCard className="max-w-md w-full text-center">
          <div className="p-8 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
              <Maximize className="w-10 h-10 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Enter Full-Screen Mode</h1>
              <p className="text-muted-foreground">
                This exam requires full-screen mode to ensure a fair testing environment. Exiting full-screen will be
                logged and reported to your instructor.
              </p>
            </div>
            <div className="space-y-3 text-left p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 text-sm">
                <Eye className="w-4 h-4 text-primary" />
                <span>Full-screen mode required</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <EyeOff className="w-4 h-4 text-primary" />
                <span>Copy/paste disabled during exam</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span>Tab switching will be recorded</span>
              </div>
            </div>
            <NeuButton onClick={enterFullscreen} size="lg" className="w-full gap-2">
              <Maximize className="w-5 h-5" />
              Enter Full-Screen to Start
            </NeuButton>
          </div>
        </NeuCard>
      </div>
    )
  }

  // Submit success screen
  if (showSubmitSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <NeuCard className="max-w-md w-full text-center">
          <div className="p-8 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">Exam Submitted!</h1>
              <p className="text-muted-foreground">Your answers have been recorded. You may now close this window.</p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Questions Answered</span>
                <span className="font-medium">
                  {answeredCount} / {examQuestions.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time Used</span>
                <span className="font-medium">{Math.floor((totalSeconds - remainingSeconds) / 60)} minutes</span>
              </div>
            </div>
            <NeuButton onClick={() => router.push("/")} className="w-full">
              Return to Home
            </NeuButton>
          </div>
        </NeuCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Focus Lost Overlay */}
      {showFocusLostOverlay && (
        <div className="fixed inset-0 z-50 bg-destructive/95 flex items-center justify-center p-4">
          <NeuCard className="max-w-md w-full text-center">
            <div className="p-8 space-y-4">
              <AlertTriangle className="w-16 h-16 mx-auto text-destructive" />
              <h2 className="text-xl font-bold">Focus Lost Detected!</h2>
              <p className="text-muted-foreground">
                You navigated away from the exam. This event has been logged and your instructor will be notified.
              </p>
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                Infraction #{infractions} recorded
              </div>
              <NeuButton onClick={() => setShowFocusLostOverlay(false)} className="w-full">
                Return to Exam
              </NeuButton>
            </div>
          </NeuCard>
        </div>
      )}

      {/* Fullscreen Exit Warning */}
      {showFullscreenWarning && (
        <div className="fixed inset-0 z-50 bg-warning/95 flex items-center justify-center p-4">
          <NeuCard className="max-w-md w-full text-center">
            <div className="p-8 space-y-4">
              <AlertTriangle className="w-16 h-16 mx-auto text-warning" />
              <h2 className="text-xl font-bold">You Left Full-Screen!</h2>
              <p className="text-muted-foreground">
                This event has been logged. Please re-enter full-screen mode to continue your exam.
              </p>
              <div className="text-4xl font-bold text-warning">{fullscreenWarningCountdown}s</div>
              <NeuButton onClick={reenterFullscreen} className="w-full gap-2">
                <Maximize className="w-5 h-5" />
                Re-enter Full-Screen
              </NeuButton>
            </div>
          </NeuCard>
        </div>
      )}

      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-30 bg-background border-b border-border">
        <div className="flex items-center justify-between p-4">
          <NeuTimer
            totalSeconds={totalSeconds}
            remainingSeconds={remainingSeconds}
            variant="linear"
            className="flex-1 mr-4"
          />
          <NeuButton variant="secondary" size="sm" onClick={() => setShowSidebar(true)}>
            {currentQuestion + 1}/{examQuestions.length}
          </NeuButton>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {showSidebar && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setShowSidebar(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 bg-background p-4 neu-card overflow-y-auto">
            <div className="space-y-6">
              <NeuProgressGrid questions={questionStatuses} onQuestionClick={goToQuestion} />
              <ProctoringBadge isActive={proctoringActive} infractions={infractions} variant="full" />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 border-r border-border p-4 space-y-6 overflow-y-auto">
          <NeuTimer totalSeconds={totalSeconds} remainingSeconds={remainingSeconds} showWarning className="mx-auto" />
          <NeuProgressGrid questions={questionStatuses} onQuestionClick={goToQuestion} />
          <ProctoringBadge isActive={proctoringActive} infractions={infractions} variant="full" />

          {/* Auto-save indicator */}
          <div className="text-xs text-muted-foreground text-center">
            {isSaving ? (
              <span className="flex items-center justify-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </span>
            ) : lastSaved ? (
              <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
            ) : (
              <span>Auto-save enabled</span>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Proctoring Notice Banner */}
          <div className="bg-primary/5 border-b border-primary/20 px-4 py-2 text-center text-sm">
            <span className="text-primary font-medium">Copy/paste and right-click are disabled during the exam.</span>
          </div>

          {/* Question Content */}
          <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
            <NeuCard className="max-w-3xl mx-auto">
              <div className="p-6 lg:p-8 space-y-6">
                {/* Question Header */}
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    Question {currentQuestion + 1} of {examQuestions.length}
                  </span>
                  <button
                    onClick={toggleMarkForReview}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      markedForReview.has(question.id)
                        ? "bg-warning/10 text-warning"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    <Flag className="w-4 h-4" />
                    {markedForReview.has(question.id) ? "Marked" : "Mark for Review"}
                  </button>
                </div>

                {/* Question Text */}
                <div>
                  <p className="text-lg font-medium leading-relaxed">{question.text}</p>
                </div>

                {/* Answer Options */}
                <div className="space-y-3">
                  {question.type === "mcq" &&
                    question.options?.map((option, index) => (
                      <button
                        key={index}
                        onClick={() => handleAnswer(index)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl text-left transition-all ${
                          answers[question.id] === index
                            ? "bg-primary text-primary-foreground neu-pressed"
                            : "bg-background neu-flat hover:neu-raised"
                        }`}
                      >
                        <span
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                            answers[question.id] === index
                              ? "bg-primary-foreground/20"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + index)}
                        </span>
                        <span>{option}</span>
                      </button>
                    ))}

                  {question.type === "truefalse" && (
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleAnswer(true)}
                        className={`flex-1 p-6 rounded-xl text-center text-lg font-medium transition-all ${
                          answers[question.id] === true
                            ? "bg-primary text-primary-foreground neu-pressed"
                            : "bg-background neu-flat hover:neu-raised"
                        }`}
                      >
                        True
                      </button>
                      <button
                        onClick={() => handleAnswer(false)}
                        className={`flex-1 p-6 rounded-xl text-center text-lg font-medium transition-all ${
                          answers[question.id] === false
                            ? "bg-primary text-primary-foreground neu-pressed"
                            : "bg-background neu-flat hover:neu-raised"
                        }`}
                      >
                        False
                      </button>
                    </div>
                  )}

                  {question.type === "shortanswer" && (
                    <input
                      type="text"
                      placeholder="Type your answer here..."
                      value={(answers[question.id] as string) || ""}
                      onChange={(e) => handleAnswer(e.target.value)}
                      className="w-full h-14 px-4 rounded-xl bg-background neu-input text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  )}

                  {question.type === "essay" && (
                    <div className="space-y-2">
                      <textarea
                        placeholder="Write your essay response here..."
                        value={(answers[question.id] as string) || ""}
                        onChange={(e) => handleAnswer(e.target.value)}
                        rows={8}
                        className="w-full px-4 py-3 rounded-xl bg-background neu-input text-base leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {((answers[question.id] as string) || "").split(/\s+/).filter(Boolean).length} words
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </NeuCard>
          </div>

          {/* Navigation Footer */}
          <footer className="sticky bottom-0 bg-background border-t border-border p-4">
            <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
              <NeuButton
                variant="secondary"
                onClick={() => setCurrentQuestion((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="gap-2"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Previous</span>
              </NeuButton>

              <NeuButton onClick={() => setShowSubmitConfirm(true)} variant="primary" className="gap-2">
                <Send className="w-5 h-5" />
                Submit Exam
              </NeuButton>

              <NeuButton
                variant="secondary"
                onClick={() => setCurrentQuestion((prev) => Math.min(examQuestions.length - 1, prev + 1))}
                disabled={currentQuestion === examQuestions.length - 1}
                className="gap-2"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-5 h-5" />
              </NeuButton>
            </div>
          </footer>
        </main>
      </div>

      {/* Time Warning Modal */}
      <NeuModal
        open={showTimeWarning}
        onClose={() => setShowTimeWarning(false)}
        title="5 Minutes Remaining!"
        description="You have 5 minutes left to complete your exam. Please review your answers."
        variant="warning"
        footer={<NeuButton onClick={() => setShowTimeWarning(false)}>Continue</NeuButton>}
      >
        <div className="text-center py-4">
          <NeuTimer totalSeconds={totalSeconds} remainingSeconds={remainingSeconds} showWarning />
        </div>
      </NeuModal>

      {/* Submit Confirmation Modal */}
      <NeuModal
        open={showSubmitConfirm}
        onClose={() => setShowSubmitConfirm(false)}
        title="Submit Exam?"
        description="Are you sure you want to submit your exam? You cannot make changes after submission."
        footer={
          <>
            <NeuButton variant="ghost" onClick={() => setShowSubmitConfirm(false)}>
              Cancel
            </NeuButton>
            <NeuButton onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Submit
                </>
              )}
            </NeuButton>
          </>
        }
      >
        <div className="p-4 rounded-xl bg-muted/50 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Questions Answered</span>
            <span className="font-medium">
              {answeredCount} / {examQuestions.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Marked for Review</span>
            <span className="font-medium">{markedForReview.size}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time Remaining</span>
            <span className="font-medium">
              {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, "0")}
            </span>
          </div>
        </div>
        {answeredCount < examQuestions.length && (
          <div className="flex items-start gap-2 mt-4 p-3 rounded-lg bg-warning/10 text-warning text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>You have {examQuestions.length - answeredCount} unanswered questions.</p>
          </div>
        )}
      </NeuModal>
    </div>
  )
}
