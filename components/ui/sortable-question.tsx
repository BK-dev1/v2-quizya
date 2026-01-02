"use client"

import type * as React from "react"
import { GripVertical, ChevronDown, ChevronUp, Trash2, Check } from "lucide-react"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"

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

interface SortableQuestionProps {
  question: Question
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  onUpdate: (updates: Partial<Question>) => void
  onRemove: () => void
  onDragStart: (e: React.DragEvent, index: number) => void
  onDragOver: (e: React.DragEvent, index: number) => void
  onDragEnd: () => void
  isDragging: boolean
  dragOverIndex: number | null
}

export function SortableQuestion({
  question,
  index,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  dragOverIndex,
}: SortableQuestionProps) {
  const isDropTarget = dragOverIndex === index

  return (
    <NeuCard
      className={`overflow-hidden transition-all duration-200 ${
        isDragging ? "opacity-50 scale-[0.98]" : ""
      } ${isDropTarget ? "ring-2 ring-primary ring-offset-2" : ""}`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDragEnd={onDragEnd}
    >
      {/* Question Header */}
      <div className="flex items-center gap-3 p-4">
        <div
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/50 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical className="w-5 h-5 text-muted-foreground" />
        </div>
        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-semibold text-sm">
          {index + 1}
        </span>
        <button
          onClick={onToggleExpand}
          className="flex-1 text-left hover:bg-muted/30 rounded-lg p-2 -m-2 transition-colors"
        >
          <p className="font-medium line-clamp-1">{question.text || "Untitled Question"}</p>
          <p className="text-xs text-muted-foreground">{questionTypeLabels[question.type]}</p>
        </button>
        <button onClick={onToggleExpand} className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Question Editor (Expanded) */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Question Text</label>
            <textarea
              placeholder="Enter your question..."
              value={question.text}
              onChange={(e) => onUpdate({ text: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 rounded-xl bg-input border border-border placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* MCQ Options */}
          {question.type === "mcq" && question.options && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Answer Options (Select one or more correct answers)</label>
              {question.options.map((option, optIndex) => {
                const correctAnswerArray = Array.isArray(question.correctAnswer) 
                  ? question.correctAnswer 
                  : typeof question.correctAnswer === 'number' 
                    ? [question.correctAnswer] 
                    : []
                const isCorrect = correctAnswerArray.includes(optIndex)
                
                return (
                  <div key={optIndex} className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        let newCorrectAnswers: number[]
                        if (isCorrect) {
                          newCorrectAnswers = correctAnswerArray.filter(idx => idx !== optIndex)
                        } else {
                          // Add to correct answers
                          newCorrectAnswers = [...correctAnswerArray, optIndex]
                        }
                        onUpdate({ correctAnswer: newCorrectAnswers })
                      }}
                      className={`w-8 h-8 rounded border-2 flex items-center justify-center transition-colors ${
                        isCorrect
                          ? "border-success bg-success text-success-foreground"
                          : "border-border hover:border-primary"
                      }`}
                      aria-label={`${isCorrect ? "Unmark" : "Mark"} option ${optIndex + 1} as correct answer (multiple answers allowed)`}
                    >
                      {isCorrect && <Check className="w-4 h-4" />}
                    </button>
                    <input
                      type="text"
                      placeholder={`Option ${optIndex + 1}`}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...question.options!]
                        newOptions[optIndex] = e.target.value
                        onUpdate({ options: newOptions })
                      }}
                      className="flex-1 h-10 px-4 rounded-xl bg-input border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
                    />
                  </div>
                )
              })}
              <p className="text-xs text-muted-foreground">Click the checkbox to mark correct answer(s). You can select multiple correct answers.</p>
            </div>
          )}

          {/* True/False */}
          {question.type === "truefalse" && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Correct Answer</label>
              <div className="flex gap-3">
                <NeuButton
                  variant={question.correctAnswer === true ? "primary" : "secondary"}
                  onClick={() => onUpdate({ correctAnswer: true })}
                  className="flex-1"
                >
                  True
                </NeuButton>
                <NeuButton
                  variant={question.correctAnswer === false ? "primary" : "secondary"}
                  onClick={() => onUpdate({ correctAnswer: false })}
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
                  onUpdate({
                    keywords: e.target.value.split(",").map((k) => k.trim()),
                  })
                }
                className="w-full h-10 px-4 rounded-xl bg-input border border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring text-sm"
              />
              <p className="text-xs text-muted-foreground">Answers containing these keywords will be marked correct</p>
            </div>
          )}

          {/* Per-question time limit */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={question.hasTimeLimit}
                onChange={(e) => onUpdate({ hasTimeLimit: e.target.checked })}
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
                  onChange={(e) => onUpdate({ timeLimit: Number(e.target.value) })}
                  className="w-20 h-8 px-3 rounded-lg bg-input border border-border text-sm text-center"
                />
                <span className="text-sm text-muted-foreground">min</span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <NeuButton
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </NeuButton>
          </div>
        </div>
      )}
    </NeuCard>
  )
}
