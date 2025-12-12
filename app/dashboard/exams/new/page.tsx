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
import { ArrowLeft, Plus, Clock, Shuffle, Globe, Eye, Save } from "lucide-react"

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

  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = React.useState<number | null>(null)

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
                  className="w-full px-4 py-3 rounded-xl bg-input border border-border placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none text-sm"
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
                  className="w-full h-12 px-4 rounded-xl bg-input border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              <RoomCodeWidget roomCode={roomCode} qrCodeUrl="/qr-code.png" showQR={false} onToggleQR={() => {}} />
            </NeuCardContent>
          </NeuCard>
        </div>

        {/* Center: Question Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Questions ({questions.length})</h2>
            <p className="text-sm text-muted-foreground">Est. {estimatedDuration} min</p>
          </div>

          {questions.length > 1 && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">Drag questions to reorder them</p>
          )}

          {questions.length === 0 ? (
            <NeuCard className="p-8 text-center">
              <p className="text-muted-foreground">No questions yet. Add your first question from the panel.</p>
            </NeuCard>
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

      {/* Public Warning Modal */}
      <NeuModal isOpen={showPublicWarning} onClose={() => setShowPublicWarning(false)} title="Make Exam Public?">
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
      <NeuModal isOpen={showPreview} onClose={() => setShowPreview(false)} title="Exam Preview">
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
              {q.type === "truefalse" && (
                <div className="mt-3 flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-border" />
                    <span className="text-sm">True</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full border border-border" />
                    <span className="text-sm">False</span>
                  </div>
                </div>
              )}
              {(q.type === "shortanswer" || q.type === "essay") && (
                <div className="mt-3 h-20 rounded-lg border border-dashed border-border flex items-center justify-center text-sm text-muted-foreground">
                  {q.type === "essay" ? "Essay response area" : "Short answer field"}
                </div>
              )}
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
