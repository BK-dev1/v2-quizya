"use client"
import { cn } from "@/lib/utils"
import { Check, Flag } from "lucide-react"

export interface QuestionStatus {
  id: number
  answered: boolean
  markedForReview: boolean
  current: boolean
}

export interface NeuProgressGridProps {
  questions: QuestionStatus[]
  onQuestionClick?: (id: number) => void
  className?: string
}

export function NeuProgressGrid({ questions, onQuestionClick, className }: NeuProgressGridProps) {
  const answered = questions.filter((q) => q.answered).length
  const percentage = Math.round((answered / questions.length) * 100)

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium">Progress</span>
        <span className="text-sm text-muted-foreground">
          {answered}/{questions.length} answered ({percentage}%)
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {questions.map((q) => (
          <button
            key={q.id}
            onClick={() => onQuestionClick?.(q.id)}
            className={cn(
              "relative w-9 h-9 rounded-lg text-sm font-medium transition-all duration-150",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              q.current && "ring-2 ring-primary",
              q.answered
                ? "bg-primary text-primary-foreground shadow-sm hover:shadow-md"
                : "bg-card text-foreground border border-border shadow-sm hover:shadow-md",
              q.markedForReview && "ring-2 ring-warning",
            )}
            aria-label={`Question ${q.id}${q.answered ? ", answered" : ", not answered"}${q.markedForReview ? ", marked for review" : ""}`}
          >
            {q.id}
            {q.answered && <Check className="absolute -top-1 -right-1 w-4 h-4 text-success" aria-hidden="true" />}
            {q.markedForReview && (
              <Flag className="absolute -bottom-1 -right-1 w-3 h-3 text-warning" aria-hidden="true" />
            )}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-primary" />
          <span>Answered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-card border border-border" />
          <span>Unanswered</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-card border border-border ring-2 ring-warning" />
          <span>Marked for Review</span>
        </div>
      </div>
    </div>
  )
}
