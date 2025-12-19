"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card"
import { NeuInput } from "@/components/ui/neu-input"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuModal } from "@/components/ui/neu-modal"
import { RoomCodeWidget } from "@/components/ui/room-code-widget"
import { SortableQuestion } from "@/components/ui/sortable-question"
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Clock,
  Shuffle,
  Globe,
  Eye,
  Save,
  CheckCircle,
  ShieldAlert,
  Settings,
  List,
  FileText
} from "lucide-react"

type QuestionType = "mcq" | "truefalse" | "shortanswer" | "essay"

interface Question {
  id: string
  type: QuestionType
  text: string
  options?: string[]
  correctAnswer?: number | number[] | boolean | string
  keywords?: string[]
  timeLimit?: number
  hasTimeLimit: boolean
}

type Step = 'details' | 'questions' | 'settings' | 'review'

export default function NewExamPage() {
  const router = useRouter()
  // Steps State
  const [currentStep, setCurrentStep] = React.useState<Step>('details')

  // Exam Data State
  const [examTitle, setExamTitle] = React.useState("")
  const [examDescription, setExamDescription] = React.useState("")
  const [duration, setDuration] = React.useState(60)
  const [passingScore, setPassingScore] = React.useState(70)
  const [shuffleQuestions, setShuffleQuestions] = React.useState(false)
  const [shuffleChoices, setShuffleChoices] = React.useState(false)
  const [isPublic, setIsPublic] = React.useState(false)
  const [proctoringEnabled, setProctoringEnabled] = React.useState(false) // New State
  const [roomCode, setRoomCode] = React.useState("")

  // New States
  const [showPublicWarning, setShowPublicWarning] = React.useState(false)
  const [showPreview, setShowPreview] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const [expandedQuestion, setExpandedQuestion] = React.useState<string | null>(null)
  const [validationErrors, setValidationErrors] = React.useState<string[]>([])

  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

  const [questions, setQuestions] = React.useState<Question[]>([
    {
      id: "1",
      type: "mcq",
      text: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      hasTimeLimit: false,
    },
  ])

  // Generate room code on mount
  React.useEffect(() => {
    const generateRoomCode = () => {
      const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
      let code = ''
      for (let i = 0; i < 6; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length))
      }
      setRoomCode(code)
    }
    generateRoomCode()
  }, [])

  const addQuestion = (type: QuestionType) => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type,
      text: "",
      hasTimeLimit: false,
      ...(type === "mcq" && { options: ["", "", "", ""], correctAnswer: 0 }),
      ...(type === "truefalse" && { correctAnswer: true }),
      ...(type === "shortanswer" && { keywords: [] }),
    }
    setQuestions([...questions, newQuestion])
    setExpandedQuestion(newQuestion.id)
  }

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id))
  }

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)))
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index)
    }
  }

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      const newQuestions = [...questions]
      const [draggedItem] = newQuestions.splice(draggedIndex, 1)
      newQuestions.splice(dragOverIndex, 0, draggedItem)
      setQuestions(newQuestions)
    }
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handlePublicToggle = () => {
    if (!isPublic) {
      setShowPublicWarning(true)
    } else {
      setIsPublic(false)
    }
  }

  const confirmPublic = () => {
    setIsPublic(true)
    setShowPublicWarning(false)
  }

  const validateCurrentStep = () => {
    const errors: string[] = []

    if (currentStep === 'details') {
      if (!examTitle.trim()) errors.push('Exam title is required')
    }

    if (currentStep === 'questions') {
      if (questions.length === 0) errors.push('At least one question is required')
      // Check empty questions
      questions.forEach((q, idx) => {
        if (!q.text.trim()) {
          errors.push(`Question ${idx + 1}: Text is required`)
        }
      })
    }

    setValidationErrors(errors)
    return errors.length === 0
  }

  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep === 'details') setCurrentStep('questions')
      else if (currentStep === 'questions') setCurrentStep('settings')
      else if (currentStep === 'settings') setCurrentStep('review')
    }
  }

  const prevStep = () => {
    if (currentStep === 'questions') setCurrentStep('details')
    else if (currentStep === 'settings') setCurrentStep('questions')
    else if (currentStep === 'review') setCurrentStep('settings')
  }

  const handleSave = async () => {
    setIsSaving(true)
    setValidationErrors([])

    try {
      const response = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: examTitle,
          description: examDescription,
          duration_minutes: duration,
          passing_score: passingScore,
          is_public: isPublic,
          proctoring_enabled: proctoringEnabled,
          shuffle_questions: shuffleQuestions,
          room_code: roomCode,
          total_questions: questions.length,
          show_results_immediately: true,
          questions: questions.map((q, idx) => ({
            order_index: idx,
            question_text: q.text,
            question_type: q.type,
            options: q.options,
            correct_answer: q.correctAnswer,
            time_limit: q.timeLimit,
            points: 1
          }))
        })
      })

      if (response.ok) {
        const data = await response.json()
        setLastSaved(new Date())
        router.push(`/dashboard/exams/${data.id}`)
      } else {
        const error = await response.json()
        setValidationErrors([error.error || 'Failed to save exam'])
      }
    } catch (error) {
      console.error('Error saving exam:', error)
      setValidationErrors(['Error saving exam'])
    } finally {
      setIsSaving(false)
    }
  }

  const estimatedDuration = questions.reduce((acc, q) => {
    if (q.hasTimeLimit && q.timeLimit) return acc + q.timeLimit
    if (q.type === "essay") return acc + 10
    if (q.type === "shortanswer") return acc + 3
    return acc + 2
  }, 0)

  // Steps UI Indicators
  const steps = [
    { id: 'details', label: 'Details', icon: FileText },
    { id: 'questions', label: 'Questions', icon: List },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'review', label: 'Review', icon: CheckCircle },
  ]

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/exams">
            <NeuButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </NeuButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create New Exam</h1>
            <p className="text-sm text-muted-foreground">Step {steps.findIndex(s => s.id === currentStep) + 1} of 4: {steps.find(s => s.id === currentStep)?.label}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <NeuButton variant="secondary" onClick={() => setShowPreview(true)} className="gap-2">
            <Eye className="w-4 h-4" /> Preview
          </NeuButton>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex justify-between items-center relative mb-8 px-4">
        {/* Progress Bar Background */}
        <div className="absolute left-0 top-1/2 w-full h-1 bg-gray-200 -z-10 rounded-full" />

        {/* Active Progress Bar */}
        <div
          className="absolute left-0 top-1/2 h-1 bg-primary -z-10 rounded-full transition-all duration-300"
          style={{ width: `${(steps.findIndex(s => s.id === currentStep) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isActive = step.id === currentStep
          const isCompleted = steps.findIndex(s => s.id === currentStep) > idx

          return (
            <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
              <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all
                        ${isActive || isCompleted ? 'border-primary bg-primary text-primary-foreground' : 'border-gray-200 text-gray-400 bg-white'}
                    `}>
                <step.icon className="w-5 h-5" />
              </div>
              <span className={`text-xs font-medium ${isActive || isCompleted ? 'text-primary' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="p-4 rounded-lg border border-red-300 bg-red-50">
          <p className="font-medium text-red-900 mb-2">Please fix the following issues:</p>
          <ul className="space-y-1 text-sm text-red-800">
            {validationErrors.map((error, idx) => (
              <li key={idx} className="flex gap-2">
                <span>•</span>
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content Area */}
      <div className="min-h-[400px]">
        {/* Step 1: Details */}
        {currentStep === 'details' && (
          <NeuCard className="max-w-2xl mx-auto">
            <NeuCardHeader>
              <NeuCardTitle>Exam Details</NeuCardTitle>
            </NeuCardHeader>
            <NeuCardContent className="space-y-4">
              <NeuInput
                label="Exam Title"
                placeholder="e.g., Introduction to Computer Science"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                required
              />
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  placeholder="Describe the exam content, rules, etc."
                  value={examDescription}
                  onChange={(e) => setExamDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-input border border-border placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none text-sm"
                />
              </div>
            </NeuCardContent>
          </NeuCard>
        )}

        {/* Step 2: Questions */}
        {currentStep === 'questions' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Add Buttons */}
            <div className="lg:col-span-1 space-y-4">
              <NeuCard>
                <NeuCardHeader>
                  <NeuCardTitle className="text-lg">Tools</NeuCardTitle>
                </NeuCardHeader>
                <NeuCardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-4">Add questions to your exam.</p>
                  <NeuButton variant="secondary" className="w-full justify-start gap-2" onClick={() => addQuestion("mcq")}>
                    <Plus className="w-4 h-4" /> Multiple Choice
                  </NeuButton>
                  <NeuButton variant="secondary" className="w-full justify-start gap-2" onClick={() => addQuestion("truefalse")}>
                    <Plus className="w-4 h-4" /> True / False
                  </NeuButton>
                  <NeuButton variant="secondary" className="w-full justify-start gap-2" onClick={() => addQuestion("shortanswer")}>
                    <Plus className="w-4 h-4" /> Short Answer
                  </NeuButton>
                  <NeuButton variant="secondary" className="w-full justify-start gap-2" onClick={() => addQuestion("essay")}>
                    <Plus className="w-4 h-4" /> Essay
                  </NeuButton>
                </NeuCardContent>
              </NeuCard>
              <NeuCard>
                <NeuCardContent className="pt-6 text-center">
                  <p className="text-2xl font-bold">{questions.length}</p>
                  <p className="text-sm text-muted-foreground">Total Questions</p>
                  <p className="text-xs text-muted-foreground mt-2">Est. Duration: {estimatedDuration} min</p>
                </NeuCardContent>
              </NeuCard>
            </div>

            {/* Right: List */}
            <div className="lg:col-span-2 space-y-4">
              {questions.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl border-gray-200">
                  <p className="text-muted-foreground">No questions added yet.</p>
                  <p className="text-sm text-muted-foreground">Use the tools on the left to add questions.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <SortableQuestion
                      key={question.id}
                      question={question}
                      index={index}
                      isExpanded={expandedQuestion === question.id}
                      onToggleExpand={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                      onUpdate={(updates) => updateQuestion(question.id, updates)}
                      onRemove={() => removeQuestion(question.id)}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDragEnd={handleDragEnd}
                      isDragging={draggedIndex === index}
                      dragOverIndex={dragOverIndex}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Settings */}
        {currentStep === 'settings' && (
          <NeuCard className="max-w-2xl mx-auto">
            <NeuCardHeader>
              <NeuCardTitle>Configuration</NeuCardTitle>
            </NeuCardHeader>
            <NeuCardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Duration (min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full h-12 px-4 rounded-xl bg-input border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Passing Score (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                    className="w-full h-12 px-4 rounded-xl bg-input border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <hr className="border-border" />

              {/* Proctoring Toggle */}
              <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-amber-50/50">
                <div>
                  <span className="text-sm font-bold flex items-center gap-2 text-amber-900">
                    <ShieldAlert className="w-4 h-4" /> Enable Proctoring
                  </span>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[300px]">
                    Flags suspicious behavior like tab switching and fullscreen exits.
                  </p>
                </div>
                <button
                  onClick={() => setProctoringEnabled(!proctoringEnabled)}
                  className={`w-12 h-6 rounded-full transition-colors ${proctoringEnabled ? "bg-amber-600" : "bg-muted"}`}
                  role="switch"
                  aria-checked={proctoringEnabled}
                >
                  <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${proctoringEnabled ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>

              <div className="space-y-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Shuffle className="w-4 h-4" /> Shuffle Questions
                  </span>
                  <button
                    onClick={() => setShuffleQuestions(!shuffleQuestions)}
                    className={`w-12 h-6 rounded-full transition-colors ${shuffleQuestions ? "bg-primary" : "bg-muted"}`}
                    role="switch"
                    aria-checked={shuffleQuestions}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${shuffleQuestions ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Shuffle className="w-4 h-4" /> Shuffle Choices
                  </span>
                  <button
                    onClick={() => setShuffleChoices(!shuffleChoices)}
                    className={`w-12 h-6 rounded-full transition-colors ${shuffleChoices ? "bg-primary" : "bg-muted"}`}
                    role="switch"
                    aria-checked={shuffleChoices}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${shuffleChoices ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" /> Make Public
                  </span>
                  <button
                    onClick={handlePublicToggle}
                    className={`w-12 h-6 rounded-full transition-colors ${isPublic ? "bg-primary" : "bg-muted"}`}
                    role="switch"
                    aria-checked={isPublic}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublic ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </label>
              </div>

              {/* Room Code Readonly */}
              <NeuCard className="bg-muted/30">
                <NeuCardContent className="pt-6">
                  <RoomCodeWidget roomCode={roomCode} qrCodeUrl="" showQR={false} onToggleQR={() => { }} />
                  <p className="text-center text-xs text-muted-foreground mt-2">Auto-generated Room Code</p>
                </NeuCardContent>
              </NeuCard>

            </NeuCardContent>
          </NeuCard>
        )}

        {/* Step 4: Review */}
        {currentStep === 'review' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <NeuCard>
              <NeuCardHeader>
                <NeuCardTitle>Review & Save</NeuCardTitle>
              </NeuCardHeader>
              <NeuCardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Title</p>
                    <p className="font-semibold">{examTitle}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Questions</p>
                    <p className="font-semibold">{questions.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-semibold">{duration} min</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Passing Score</p>
                    <p className="font-semibold">{passingScore}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Proctoring</p>
                    <p className={`font-semibold ${proctoringEnabled ? 'text-amber-600' : ''}`}>
                      {proctoringEnabled ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Visibility</p>
                    <p className="font-semibold">{isPublic ? 'Public' : 'Private'}</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-border">
                  <p className="text-muted-foreground text-sm mb-2">Description</p>
                  <p className="text-sm italic">{examDescription || 'No description provided.'}</p>
                </div>
              </NeuCardContent>
            </NeuCard>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-sm text-blue-800">
              <CheckCircle className="w-5 h-5 shrink-0" />
              <p>
                Ready to launch? Once saved, you can share the room code with students immediately.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-border p-4 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            {currentStep !== 'details' && (
              <NeuButton variant="secondary" onClick={prevStep} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </NeuButton>
            )}
          </div>
          <div>
            {currentStep !== 'review' ? (
              <NeuButton onClick={nextStep} className="gap-2 bg-primary text-primary-foreground">
                Next Step <ArrowRight className="w-4 h-4" />
              </NeuButton>
            ) : (
              <NeuButton onClick={handleSave} disabled={isSaving} className="gap-2 bg-green-600 hover:bg-green-700 text-white w-40">
                {isSaving ? <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
                Create Exam
              </NeuButton>
            )}
          </div>
        </div>
      </div>

      {/* Public Warning Modal */}
      <NeuModal open={showPublicWarning} onClose={() => setShowPublicWarning(false)} title="Make Exam Public?">
        {/* ... (Existing modal content) ... */}
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Public exams can be discovered and taken by anyone with the room code. Are you sure you want to make this
            exam public?
          </p>
          <div className="flex justify-end gap-3">
            <NeuButton variant="secondary" onClick={() => setShowPublicWarning(false)}>
              Cancel
            </NeuButton>
            <NeuButton onClick={confirmPublic}>Yes, Make Public</NeuButton>
          </div>
        </div>
      </NeuModal>

      {/* Preview Modal */}
      <NeuModal open={showPreview} onClose={() => setShowPreview(false)} title="Exam Preview">
        {/* ... (Existing preview content) ... */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          <div className="p-4 rounded-xl bg-muted/50">
            <h3 className="font-semibold">{examTitle || "Untitled Exam"}</h3>
            <p className="text-sm text-muted-foreground mt-1">{examDescription || "No description"}</p>
            <div className="flex gap-4 mt-3 text-sm text-muted-foreground">
              <span>{duration} min</span>
              <span>{questions.length} questions</span>
            </div>
          </div>

          {questions.map((q, i) => (
            <div key={q.id} className="p-4 rounded-xl border border-border">
              <p className="font-medium">
                {i + 1}. {q.text || "Untitled Question"}
              </p>
              {q.type === "mcq" && q.options && (
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-border" />
                      <span className="text-sm">{opt || `Option ${oi + 1}`}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* ... (rest of question types) ... */}
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <NeuButton onClick={() => setShowPreview(false)}>Close Preview</NeuButton>
        </div>
      </NeuModal>
    </div>
  )
}
