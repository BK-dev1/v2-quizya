"use client"

import { useState } from "react"
import Link from "next/link"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { ArrowLeft, Check, X, Clock, Award, ChevronDown, ChevronUp, RotateCcw, Home, Share2 } from "lucide-react"

interface QuestionResult {
  id: number
  type: "mcq" | "true-false" | "short-answer" | "essay"
  question: string
  userAnswer: string
  correctAnswer: string
  isCorrect: boolean
  points: number
  maxPoints: number
  feedback?: string
}

const mockResults: QuestionResult[] = [
  {
    id: 1,
    type: "mcq",
    question: "What is the primary purpose of the useState hook in React?",
    userAnswer: "To manage component state",
    correctAnswer: "To manage component state",
    isCorrect: true,
    points: 2,
    maxPoints: 2,
  },
  {
    id: 2,
    type: "mcq",
    question: "Which of the following is NOT a valid JavaScript data type?",
    userAnswer: "float",
    correctAnswer: "float",
    isCorrect: true,
    points: 2,
    maxPoints: 2,
  },
  {
    id: 3,
    type: "true-false",
    question: "JavaScript is a statically typed programming language.",
    userAnswer: "True",
    correctAnswer: "False",
    isCorrect: false,
    points: 0,
    maxPoints: 1,
    feedback: "JavaScript is dynamically typed, meaning variable types are determined at runtime.",
  },
  {
    id: 4,
    type: "short-answer",
    question: "What method is used to add an element to the end of an array in JavaScript?",
    userAnswer: "push()",
    correctAnswer: "push()",
    isCorrect: true,
    points: 3,
    maxPoints: 3,
  },
  {
    id: 5,
    type: "mcq",
    question: "What does CSS stand for?",
    userAnswer: "Computer Style Sheets",
    correctAnswer: "Cascading Style Sheets",
    isCorrect: false,
    points: 0,
    maxPoints: 2,
    feedback: "CSS stands for Cascading Style Sheets, which describes how HTML elements should be displayed.",
  },
  {
    id: 6,
    type: "essay",
    question: "Explain the concept of closures in JavaScript and provide an example of when they might be useful.",
    userAnswer:
      "Closures are functions that have access to variables from their outer scope even after the outer function has returned. They are useful for data privacy and creating factory functions.",
    correctAnswer:
      "A closure is a function that retains access to its lexical scope even when executed outside that scope.",
    isCorrect: true,
    points: 8,
    maxPoints: 10,
    feedback: "Good explanation! You could have included a code example for full marks.",
  },
]

export default function ResultsPage() {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set())

  const totalPoints = mockResults.reduce((sum, q) => sum + q.points, 0)
  const maxPoints = mockResults.reduce((sum, q) => sum + q.maxPoints, 0)
  const percentage = Math.round((totalPoints / maxPoints) * 100)
  const correctCount = mockResults.filter((q) => q.isCorrect).length

  const toggleQuestion = (id: number) => {
    const newExpanded = new Set(expandedQuestions)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedQuestions(newExpanded)
  }

  const getGrade = (percent: number) => {
    if (percent >= 90) return { grade: "A", color: "text-green-600" }
    if (percent >= 80) return { grade: "B", color: "text-blue-600" }
    if (percent >= 70) return { grade: "C", color: "text-amber-600" }
    if (percent >= 60) return { grade: "D", color: "text-orange-600" }
    return { grade: "F", color: "text-red-600" }
  }

  const { grade, color } = getGrade(percentage)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Exit</span>
            </Link>
            <h1 className="text-lg font-semibold text-foreground">Exam Results</h1>
            <button className="p-2 rounded-xl neu-button hover:scale-105 transition-transform">
              <Share2 className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Score Summary Card */}
        <NeuCard className="p-6 md:p-8 mb-8">
          <div className="text-center mb-8">
            <h2 className="text-xl text-muted-foreground mb-2">Introduction to JavaScript</h2>
            <p className="text-sm text-muted-foreground">Completed on December 12, 2025</p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            {/* Circular Score */}
            <div className="relative">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle cx="80" cy="80" r="70" fill="none" className="stroke-muted/30" strokeWidth="12" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  className={`${percentage >= 70 ? "stroke-primary" : "stroke-destructive"}`}
                  strokeWidth="12"
                  strokeLinecap="round"
                  strokeDasharray={`${(percentage / 100) * 440} 440`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-4xl font-bold ${color}`}>{percentage}%</span>
                <span className={`text-2xl font-semibold ${color}`}>Grade {grade}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              <div className="text-center p-4 rounded-xl neu-flat">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Award className="w-5 h-5 text-primary" />
                  <span className="text-2xl font-bold text-foreground">{totalPoints}</span>
                </div>
                <p className="text-sm text-muted-foreground">of {maxPoints} points</p>
              </div>
              <div className="text-center p-4 rounded-xl neu-flat">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="text-2xl font-bold text-foreground">{correctCount}</span>
                </div>
                <p className="text-sm text-muted-foreground">of {mockResults.length} correct</p>
              </div>
              <div className="text-center p-4 rounded-xl neu-flat">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <span className="text-2xl font-bold text-foreground">32:45</span>
                </div>
                <p className="text-sm text-muted-foreground">time taken</p>
              </div>
              <div className="text-center p-4 rounded-xl neu-flat">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <X className="w-5 h-5 text-red-600" />
                  <span className="text-2xl font-bold text-foreground">{mockResults.length - correctCount}</span>
                </div>
                <p className="text-sm text-muted-foreground">incorrect</p>
              </div>
            </div>
          </div>
        </NeuCard>

        {/* Question Review */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Question Review</h3>
          <div className="space-y-4">
            {mockResults.map((result, index) => (
              <NeuCard key={result.id} className="overflow-hidden">
                <button
                  onClick={() => toggleQuestion(result.id)}
                  className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors"
                >
                  {/* Status Icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      result.isCorrect ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}
                  >
                    {result.isCorrect ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
                  </div>

                  {/* Question Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-muted-foreground">Q{index + 1}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground capitalize">
                        {result.type.replace("-", " ")}
                      </span>
                    </div>
                    <p className="text-foreground truncate">{result.question}</p>
                  </div>

                  {/* Points */}
                  <div className="text-right shrink-0">
                    <span className={`font-semibold ${result.isCorrect ? "text-green-600" : "text-red-600"}`}>
                      {result.points}/{result.maxPoints}
                    </span>
                    <p className="text-xs text-muted-foreground">points</p>
                  </div>

                  {/* Expand Icon */}
                  {expandedQuestions.has(result.id) ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
                  )}
                </button>

                {/* Expanded Content */}
                {expandedQuestions.has(result.id) && (
                  <div className="px-4 pb-4 border-t border-border/50">
                    <div className="pt-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Your Answer</p>
                        <p
                          className={`p-3 rounded-lg ${
                            result.isCorrect ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                          }`}
                        >
                          {result.userAnswer}
                        </p>
                      </div>

                      {!result.isCorrect && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Correct Answer</p>
                          <p className="p-3 rounded-lg bg-green-50 text-green-800">{result.correctAnswer}</p>
                        </div>
                      )}

                      {result.feedback && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Feedback</p>
                          <p className="p-3 rounded-lg bg-blue-50 text-blue-800">{result.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </NeuCard>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/public-exams">
            <NeuButton variant="secondary" className="w-full sm:w-auto">
              <RotateCcw className="w-4 h-4 mr-2" />
              Take Another Exam
            </NeuButton>
          </Link>
          <Link href="/">
            <NeuButton className="w-full sm:w-auto">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </NeuButton>
          </Link>
        </div>
      </main>
    </div>
  )
}
