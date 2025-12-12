"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card"
import { NeuInput } from "@/components/ui/neu-input"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuModal } from "@/components/ui/neu-modal"
import { RoomCodeWidget } from "@/components/ui/room-code-widget"
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Shuffle,
  Globe,
  Eye,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
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

const questionTypeLabels: Record<QuestionType, string> = {
  mcq: "Multiple Choice",
  truefalse: "True/False",
  shortanswer: "Short Answer",
  essay: "Essay",
}

export default function NewExamPage() {
  const router = useRouter()
  const [examTitle, setExamTitle] = React.useState("")
  const [examDescription, setExamDescription] = React.useState("")
  const [duration, setDuration] = React.useState(60)
  const [shuffleQuestions, setShuffleQuestions] = React.useState(false)
  const [shuffleChoices, setShuffleChoices] = React.useState(false)
  const [isPublic, setIsPublic] = React.useState(false)
  const [showPublicWarning, setShowPublicWarning] = React.useState(false)
  const [showPreview, setShowPreview] = React.useState(false)
  const [roomCode] = React.useState("XYZ789")
  const [isSaving, setIsSaving] = React.useState(false)
  const [lastSaved, setLastSaved] = React.useState<Date | null>(null)
  const [expandedQuestion, setExpandedQuestion] = React.useState<string | null>(null)

  const [questions, setQuestions] = React.useState<Question[]>([
    {
      id: "1",
      type: "mcq",
      text: "What is the time complexity of binary search?",
      options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
      correctAnswer: 1,
      hasTimeLimit: false,
    },
  ])

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

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
    setLastSaved(new Date())
  }

  const estimatedDuration = questions.reduce((acc, q) => {
    if (q.hasTimeLimit && q.timeLimit) return acc + q.timeLimit
    if (q.type === "essay") return acc + 10
    if (q.type === "shortanswer") return acc + 3
    return acc + 2
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/exams">
            <NeuButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </NeuButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Create New Exam</h1>
            {lastSaved && (
              <p className="text-xs text-muted-foreground">Last saved at {lastSaved.toLocaleTimeString()}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NeuButton variant="secondary" onClick={() => setShowPreview(true)} className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </NeuButton>
          <NeuButton onClick={handleSave} disabled={isSaving} className="gap-2">
            {isSaving ? (
              <span className="animate-spin w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Draft
          </NeuButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Question Bank & Add */}
        <div className="lg:col-span-1 space-y-4">
          <NeuCard>
            <NeuCardHeader>
              <NeuCardTitle className="text-lg">Add Question</NeuCardTitle>
            </NeuCardHeader>
            <NeuCardContent className="space-y-2">
              <NeuButton variant="secondary" className="w-full justify-start gap-2" onClick={() => addQuestion("mcq")}>
                <Plus className="w-4 h-4" />
                Multiple Choice
              </NeuButton>
              <NeuButton
                variant="secondary"
                className="w-full justify-start gap-2"
                onClick={() => addQuestion("truefalse")}
              >
                <Plus className="w-4 h-4" />
                True / False
              </NeuButton>
              <NeuButton
                variant="secondary"
                className="w-full justify-start gap-2"
                onClick={() => addQuestion("shortanswer")}
              >
                <Plus className="w-4 h-4" />
                Short Answer
              </NeuButton>
              <NeuButton
                variant="secondary"
                className="w-full justify-start gap-2"
                onClick={() => addQuestion("essay")}
              >
                <Plus className="w-4 h-4" />
                Essay
              </NeuButton>
            </NeuCardContent>
          </NeuCard>

          {/* Exam Settings */}
          <NeuCard>
            <NeuCardHeader>
              <NeuCardTitle className="text-lg">Exam Settings</NeuCardTitle>
            </NeuCardHeader>
            <NeuCardContent className="space-y-4">
              <NeuInput
                label="Exam Title"
                placeholder="Enter exam title"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
              />

              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <textarea
                  placeholder="Describe your exam..."
                  value={examDescription}
                  onChange={(e) => setExamDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-background neu-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="w-full h-12 px-4 rounded-xl bg-background neu-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Shuffle className="w-4 h-4" />
                    Shuffle Questions
                  </span>
                  <button
                    onClick={() => setShuffleQuestions(!shuffleQuestions)}
                    className={`w-12 h-6 rounded-full transition-colors ${shuffleQuestions ? "bg-primary" : "bg-muted"}`}
                    role="switch"
                    aria-checked={shuffleQuestions}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${shuffleQuestions ? "translate-x-6" : "translate-x-0.5"}`}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Shuffle className="w-4 h-4" />
                    Shuffle Choices
                  </span>
                  <button
                    onClick={() => setShuffleChoices(!shuffleChoices)}
                    className={`w-12 h-6 rounded-full transition-colors ${shuffleChoices ? "bg-primary" : "bg-muted"}`}
                    role="switch"
                    aria-checked={shuffleChoices}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${shuffleChoices ? "translate-x-6" : "translate-x-0.5"}`}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm font-medium flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    Make Public
                  </span>
                  <button
                    onClick={handlePublicToggle}
                    className={`w-12 h-6 rounded-full transition-colors ${isPublic ? "bg-primary" : "bg-muted"}`}
                    role="switch"
                    aria-checked={isPublic}
                  >
                    <span
                      className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${isPublic ? "translate-x-6" : "translate-x-0.5"}`}
                    />
                  </button>
                </label>
              </div>
            </NeuCardContent>
          </NeuCard>

          {/* Room Code */}
          <NeuCard>
            <NeuCardHeader>
              <NeuCardTitle className="text-lg">Share</NeuCardTitle>
            </NeuCardHeader>
            <NeuCardContent>
              <RoomCodeWidget
                roomCode={roomCode}
                qrCodeUrl="/qr-code.png"
                showQR={false}
                onToggleQR={() => {}}
              />
            </NeuCardContent>
          </NeuCard>
        </div>

        {/* Center: Question Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
            <p className="text-sm text-muted-foreground">Est. {estimatedDuration} min</p>
          </div>

          {questions.length === 0 ? (
            <NeuCard className="p-8 text-center">
              <p className="text-muted-foreground">No questions yet. Add your first question from the panel.</p>
            </NeuCard>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <NeuCard key={question.id} className="overflow-hidden">
                  {/* Question Header */}
                  <button
                    onClick={() => setExpandedQuestion(expandedQuestion === question.id ? null : question.id)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
                  >
                    <GripVertical className="w-5 h-5 text-muted-foreground cursor-grab" />
                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
                      {index + 1}
                    </span>
                    <div className="flex-1 text-left">
                      <p className="font-medium line-clamp-1">{question.text || "Untitled Question"}</p>
                      <p className="text-xs text-muted-foreground">{questionTypeLabels[question.type]}</p>
                    </div>
                    {expandedQuestion === question.id ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>

                  {/* Question Editor (Expanded) */}
                  {expandedQuestion === question.id && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Question Text</label>
                        <textarea
                          placeholder="Enter your question..."
                          value={question.text}
                          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                          rows={2}
                          className="w-full px-4 py-3 rounded-xl bg-background neu-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                        />
                      </div>

                      {/* MCQ Options */}
                      {question.type === "mcq" && question.options && (
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Answer Options</label>
                          {question.options.map((option, optIndex) => (
                            <div key={optIndex} className="flex items-center gap-3">
                              <button
                                onClick={() => updateQuestion(question.id, { correctAnswer: optIndex })}
                                className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                                  question.correctAnswer === optIndex
                                    ? "border-success bg-success text-success-foreground"
                                    : "border-border hover:border-primary"
                                }`}
                                aria-label={`Mark option ${optIndex + 1} as correct`}
                              >
                                {question.correctAnswer === optIndex && <Check className="w-4 h-4" />}
                              </button>
                              <input
                                type="text"
                                placeholder={`Option ${optIndex + 1}`}
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...question.options!]
                                  newOptions[optIndex] = e.target.value
                                  updateQuestion(question.id, { options: newOptions })
                                }}
                                className="flex-1 h-10 px-4 rounded-xl bg-background neu-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
                              />
                            </div>
                          ))}
                          <p className="text-xs text-muted-foreground">Click the circle to mark the correct answer</p>
                        </div>
                      )}

                      {/* True/False */}
                      {question.type === "truefalse" && (
                        <div className="space-y-3">
                          <label className="text-sm font-medium">Correct Answer</label>
                          <div className="flex gap-3">
                            <NeuButton
                              variant={question.correctAnswer === true ? "primary" : "secondary"}
                              onClick={() => updateQuestion(question.id, { correctAnswer: true })}
                              className="flex-1"
                            >
                              True
                            </NeuButton>
                            <NeuButton
                              variant={question.correctAnswer === false ? "primary" : "secondary"}
                              onClick={() => updateQuestion(question.id, { correctAnswer: false })}
                              className="flex-1"
                            >
                              False
                            </NeuButton>
                          </div>
                        </div>
                      )}

                      {/* Short Answer Keywords */}
                      {question.type === "shortanswer" && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Keywords for Auto-Grading</label>
                          <input
                            type="text"
                            placeholder="Enter keywords separated by commas"
                            value={question.keywords?.join(", ") || ""}
                            onChange={(e) =>
                              updateQuestion(question.id, {
                                keywords: e.target.value.split(",").map((k) => k.trim()),
                              })
                            }
                            className="w-full h-10 px-4 rounded-xl bg-background neu-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
                          />
                          <p className="text-xs text-muted-foreground">
                            Answers containing these keywords will be marked correct
                          </p>
                        </div>
                      )}

                      {/* Per-question time limit */}
                      <div className="flex items-center justify-between pt-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={question.hasTimeLimit}
                            onChange={(e) => updateQuestion(question.id, { hasTimeLimit: e.target.checked })}
                            className="w-4 h-4 rounded border-border"
                          />
                          <span className="text-sm">Per-question time limit</span>
                        </label>
                        {question.hasTimeLimit && (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={1}
                              value={question.timeLimit || 2}
                              onChange={(e) => updateQuestion(question.id, { timeLimit: Number(e.target.value) })}
                              className="w-20 h-8 px-3 rounded-lg bg-background neu-input text-sm text-center"
                            />
                            <span className="text-sm text-muted-foreground">min</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-2">
                        <NeuButton
                          variant="ghost"
                          size="sm"
                          onClick={() => removeQuestion(question.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remove
                        </NeuButton>
                      </div>
                    </div>
                  )}
                </NeuCard>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Public Warning Modal */}
      <NeuModal
        open={showPublicWarning}
        onClose={() => setShowPublicWarning(false)}
        title="Make Exam Public?"
        description="Public exams can be viewed and imported by other teachers. Are you sure you want to make this exam public?"
        variant="warning"
        footer={
          <>
            <NeuButton variant="ghost" onClick={() => setShowPublicWarning(false)}>
              Cancel
            </NeuButton>
            <NeuButton onClick={confirmPublic}>Yes, Make Public</NeuButton>
          </>
        }
      />

      {/* Preview Modal */}
      <NeuModal
        open={showPreview}
        onClose={() => setShowPreview(false)}
        title="Exam Preview"
        description="This is how students will see your exam"
        className="max-w-2xl"
      >
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {questions.map((q, i) => (
            <div key={q.id} className="p-4 rounded-xl bg-muted/30">
              <p className="font-medium">
                {i + 1}. {q.text || "No question text"}
              </p>
              {q.type === "mcq" && q.options && (
                <div className="mt-3 space-y-2">
                  {q.options.map((opt, j) => (
                    <div key={j} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 border-border" />
                      <span className="text-sm">{opt || `Option ${j + 1}`}</span>
                    </div>
                  ))}
                </div>
              )}
              {q.type === "truefalse" && (
                <div className="mt-3 flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-border" />
                    <span className="text-sm">True</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border-2 border-border" />
                    <span className="text-sm">False</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </NeuModal>
    </div>
  )
}
