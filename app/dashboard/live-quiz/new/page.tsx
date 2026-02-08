"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card"
import { NeuInput } from "@/components/ui/neu-input"
import { NeuButton } from "@/components/ui/neu-button"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Clock,
  Check,
  GripVertical,
  Save,
  Loader2,
  AlertCircle
} from "lucide-react"
import { toast } from 'sonner'
import { useTranslation } from "react-i18next"

// Simple ID generator
const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)

interface QuizOption {
  id: string
  text: string
}

interface QuizQuestion {
  id: string
  question_text: string
  options: QuizOption[]
  correct_options: string[] // IDs of correct options
  time_limit_seconds: number
  points: number
}

export default function NewLiveQuizPage() {
  const router = useRouter()
  const { t } = useTranslation()
  
  const [title, setTitle] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [questions, setQuestions] = React.useState<QuizQuestion[]>([])
  const [isSaving, setIsSaving] = React.useState(false)
  const [errors, setErrors] = React.useState<string[]>([])

  // Add a new question
  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: generateId(),
      question_text: "",
      options: [
        { id: generateId(), text: "" },
        { id: generateId(), text: "" }
      ],
      correct_options: [],
      time_limit_seconds: 30,
      points: 1
    }
    setQuestions([...questions, newQuestion])
  }

  // Remove a question
  const removeQuestion = (questionId: string) => {
    setQuestions(questions.filter(q => q.id !== questionId))
  }

  // Update question text
  const updateQuestionText = (questionId: string, text: string) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, question_text: text } : q
    ))
  }

  // Update time limit
  const updateTimeLimit = (questionId: string, seconds: number) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, time_limit_seconds: seconds } : q
    ))
  }

  // Update points
  const updatePoints = (questionId: string, points: number) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, points } : q
    ))
  }

  // Add option to a question
  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: [...q.options, { id: generateId(), text: "" }]
        }
      }
      return q
    }))
  }

  // Remove option from a question
  const removeOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: q.options.filter(o => o.id !== optionId),
          correct_options: q.correct_options.filter(id => id !== optionId)
        }
      }
      return q
    }))
  }

  // Update option text
  const updateOptionText = (questionId: string, optionId: string, text: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        return {
          ...q,
          options: q.options.map(o => 
            o.id === optionId ? { ...o, text } : o
          )
        }
      }
      return q
    }))
  }

  // Toggle correct option
  const toggleCorrectOption = (questionId: string, optionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId) {
        const isCurrentlyCorrect = q.correct_options.includes(optionId)
        return {
          ...q,
          correct_options: isCurrentlyCorrect
            ? q.correct_options.filter(id => id !== optionId)
            : [...q.correct_options, optionId]
        }
      }
      return q
    }))
  }

  // Validate the quiz
  const validate = (): boolean => {
    const newErrors: string[] = []

    if (!title.trim()) {
      newErrors.push(t('quizTitleRequired') || "Quiz title is required")
    }

    if (questions.length === 0) {
      newErrors.push(t('atLeastOneQuestion') || "At least one question is required")
    }

    questions.forEach((q, index) => {
      if (!q.question_text.trim()) {
        newErrors.push(`Question ${index + 1}: ${t('questionTextRequired') || "Question text is required"}`)
      }
      if (q.options.length < 2) {
        newErrors.push(`Question ${index + 1}: ${t('atLeastTwoOptions') || "At least two options are required"}`)
      }
      if (q.options.some(o => !o.text.trim())) {
        newErrors.push(`Question ${index + 1}: ${t('allOptionsRequired') || "All options must have text"}`)
      }
      if (q.correct_options.length === 0) {
        newErrors.push(`Question ${index + 1}: ${t('selectCorrectAnswer') || "At least one correct answer must be selected"}`)
      }
    })

    setErrors(newErrors)
    return newErrors.length === 0
  }

  // Save the quiz
  const handleSave = async () => {
    if (!validate()) {
      toast.error(t('pleaseFixErrors') || "Please fix the errors before saving")
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch('/api/live-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          questions: questions.map(q => ({
            question_text: q.question_text,
            options: q.options,
            correct_options: q.correct_options,
            time_limit_seconds: q.time_limit_seconds,
            points: q.points
          }))
        })
      })

      if (response.ok) {
        const quiz = await response.json()
        toast.success(t('quizCreated') || "Quiz created successfully!")
        router.push(`/dashboard/live-quiz/${quiz.id}`)
      } else {
        const error = await response.json()
        toast.error(error.error || t('failedToCreateQuiz') || "Failed to create quiz")
      }
    } catch (error) {
      console.error('Error creating quiz:', error)
      toast.error(t('failedToCreateQuiz') || "Failed to create quiz")
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/exams">
            <NeuButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </NeuButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{t('createLiveQuiz') || 'Create Live Quiz'}</h1>
            <p className="text-sm text-muted-foreground">
              {t('liveQuizDescription') || 'Create an interactive quiz for real-time participation'}
            </p>
          </div>
        </div>
        <NeuButton onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {t('save') || 'Save Quiz'}
        </NeuButton>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <NeuCard className="border-red-300 bg-red-50">
          <NeuCardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-900">{t('pleaseFixErrors') || 'Please fix the following errors'}:</p>
                <ul className="mt-2 space-y-1 text-sm text-red-800">
                  {errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </NeuCardContent>
        </NeuCard>
      )}

      {/* Quiz Details */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle>{t('quizDetails') || 'Quiz Details'}</NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('quizTitle') || 'Quiz Title'} *
            </label>
            <NeuInput
              placeholder={t('enterQuizTitle') || "Enter quiz title"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('description') || 'Description'}
            </label>
            <textarea
              placeholder={t('enterQuizDescription') || "Enter quiz description (optional)"}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-input border border-border placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none text-sm"
            />
          </div>
        </NeuCardContent>
      </NeuCard>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t('questions') || 'Questions'} ({questions.length})</h2>
          <NeuButton onClick={addQuestion} variant="secondary">
            <Plus className="w-4 h-4 mr-2" />
            {t('addQuestion') || 'Add Question'}
          </NeuButton>
        </div>

        {questions.length === 0 ? (
          <NeuCard className="text-center py-12">
            <p className="text-muted-foreground">{t('noQuestionsYet') || 'No questions added yet'}</p>
            <NeuButton onClick={addQuestion} variant="secondary" className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              {t('addFirstQuestion') || 'Add Your First Question'}
            </NeuButton>
          </NeuCard>
        ) : (
          <div className="space-y-4">
            {questions.map((question, qIndex) => (
              <NeuCard key={question.id} className="relative">
                <NeuCardContent className="pt-6">
                  {/* Question Header */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="w-5 h-5 cursor-grab" />
                      <span className="font-semibold text-lg">Q{qIndex + 1}</span>
                    </div>
                    <div className="flex-1">
                      <textarea
                        placeholder={t('enterQuestionText') || "Enter your question"}
                        value={question.question_text}
                        onChange={(e) => updateQuestionText(question.id, e.target.value)}
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl bg-input border border-border placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none text-sm"
                      />
                    </div>
                    <NeuButton
                      variant="ghost"
                      size="sm"
                      onClick={() => removeQuestion(question.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </NeuButton>
                  </div>

                  {/* Settings Row */}
                  <div className="flex items-center gap-4 mb-4 pl-10">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <label className="text-sm text-muted-foreground">{t('timeLimit') || 'Time'}:</label>
                      <input
                        type="number"
                        min="5"
                        max="300"
                        value={question.time_limit_seconds}
                        onChange={(e) => updateTimeLimit(question.id, parseInt(e.target.value) || 30)}
                        className="w-16 px-2 py-1 rounded border text-center text-sm"
                      />
                      <span className="text-sm text-muted-foreground">{t('seconds') || 'sec'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-muted-foreground">{t('points') || 'Points'}:</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={question.points}
                        onChange={(e) => updatePoints(question.id, parseInt(e.target.value) || 1)}
                        className="w-16 px-2 py-1 rounded border text-center text-sm"
                      />
                    </div>
                  </div>

                  {/* Options */}
                  <div className="space-y-2 pl-10">
                    <p className="text-sm font-medium mb-2">
                      {t('optionsSelectCorrect') || 'Options (click to mark as correct)'}:
                    </p>
                    {question.options.map((option, oIndex) => {
                      const isCorrect = question.correct_options.includes(option.id)
                      return (
                        <div key={option.id} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleCorrectOption(question.id, option.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                              isCorrect
                                ? 'bg-green-500 border-green-500 text-white'
                                : 'border-gray-300 hover:border-green-400'
                            }`}
                          >
                            {isCorrect && <Check className="w-4 h-4" />}
                          </button>
                          <input
                            type="text"
                            placeholder={`${t('option') || 'Option'} ${oIndex + 1}`}
                            value={option.text}
                            onChange={(e) => updateOptionText(question.id, option.id, e.target.value)}
                            className={`flex-1 px-4 py-2 rounded-lg border text-sm ${
                              isCorrect 
                                ? 'border-green-300 bg-green-50 text-green-900 dark:bg-green-900/30 dark:text-green-100 dark:border-green-700' 
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          />
                          {question.options.length > 2 && (
                            <NeuButton
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOption(question.id, option.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </NeuButton>
                          )}
                        </div>
                      )
                    })}
                    <NeuButton
                      variant="ghost"
                      size="sm"
                      onClick={() => addOption(question.id)}
                      className="mt-2"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t('addOption') || 'Add Option'}
                    </NeuButton>
                  </div>

                  {/* Correct answer hint */}
                  {question.correct_options.length > 0 && (
                    <div className="mt-4 pl-10">
                      <p className="text-sm text-green-600">
                        ✓ {question.correct_options.length} {t('correctAnswersSelected') || 'correct answer(s) selected'}
                      </p>
                    </div>
                  )}
                </NeuCardContent>
              </NeuCard>
            ))}
          </div>
        )}

        {/* Add Question Button at bottom */}
        {questions.length > 0 && (
          <div className="flex justify-center">
            <NeuButton onClick={addQuestion} variant="secondary" size="lg">
              <Plus className="w-5 h-5 mr-2" />
              {t('addAnotherQuestion') || 'Add Another Question'}
            </NeuButton>
          </div>
        )}
      </div>
    </div>
  )
}
