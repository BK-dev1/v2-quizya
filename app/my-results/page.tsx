'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NeuCard, NeuCardContent, NeuCardHeader, NeuCardTitle } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { 
  Trophy, 
  Clock, 
  CheckCircle, 
  Loader2, 
  ArrowLeft,
  Calendar,
  Target
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/lib/hooks/use-auth'
import Link from 'next/link'

interface QuizResult {
  id: string
  participant_name: string
  total_score: number
  total_correct: number
  joined_at: string
  quiz: {
    id: string
    title: string
    description?: string
    status: string
    ended_at?: string
    created_at: string
    show_results_to_students: boolean
    total_questions: number
  }
}

export default function MyResultsPage() {
  const router = useRouter()
  const { t } = useTranslation()
  const { user, loading: authLoading } = useAuth()
  const [results, setResults] = useState<QuizResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/my-results')
      return
    }
    if (user) {
      fetchResults()
    }
  }, [user, authLoading, router])

  const fetchResults = async () => {
    try {
      // Add timestamp to bypass any caching
      const res = await fetch(`/api/live-quiz/my-results?t=${Date.now()}`, {
        cache: 'no-store'
      })
      if (res.ok) {
        const data = await res.json()
        setResults(data)
      }
    } catch (error) {
      console.error('Error fetching results:', error)
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary/30 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard">
            <NeuButton variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToDashboard') || 'Back to Dashboard'}
            </NeuButton>
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <h1 className="text-3xl font-bold">{t('myQuizResults') || 'My Quiz Results'}</h1>
        </div>

        {results.length === 0 ? (
          <NeuCard>
            <NeuCardContent className="py-12 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">
                {t('noQuizResults') || 'No quiz results yet'}
              </h2>
              <p className="text-muted-foreground mb-6">
                {t('noQuizResultsDesc') || 'Join a live quiz to see your results here'}
              </p>
              <Link href="/join-quiz">
                <NeuButton>
                  {t('joinQuiz') || 'Join a Quiz'}
                </NeuButton>
              </Link>
            </NeuCardContent>
          </NeuCard>
        ) : (
          <div className="space-y-4">
            {results.map((result) => {
              const percentage = result.quiz.total_questions > 0
                ? Math.round((result.total_correct / result.quiz.total_questions) * 100)
                : 0
              const isCompleted = result.quiz.status === 'ended'
              
              return (
                <NeuCard key={result.id} className="overflow-hidden">
                  <NeuCardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Quiz Info */}
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1">{result.quiz.title}</h3>
                        {result.quiz.description && (
                          <p className="text-sm text-muted-foreground mb-2">{result.quiz.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(result.joined_at).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {new Date(result.joined_at).toLocaleTimeString()}
                          </span>
                          {isCompleted && (
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="w-4 h-4" />
                              {t('completed') || 'Completed'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Score */}
                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">{t('score') || 'Score'}</p>
                          <p className="text-2xl font-bold text-primary">{result.total_score}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">{t('correct') || 'Correct'}</p>
                          <p className="text-lg font-semibold">
                            {result.total_correct} / {result.quiz.total_questions}
                          </p>
                        </div>
                        <div className="text-center">
                          <div className="relative w-16 h-16">
                            <svg className="w-full h-full transform -rotate-90">
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="none"
                                className="text-gray-200"
                              />
                              <circle
                                cx="32"
                                cy="32"
                                r="28"
                                stroke="currentColor"
                                strokeWidth="6"
                                fill="none"
                                strokeLinecap="round"
                                className={percentage >= 50 ? 'text-green-500' : 'text-red-500'}
                                strokeDasharray={`${percentage * 1.76} 176`}
                              />
                            </svg>
                            <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">
                              {percentage}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </NeuCardContent>
                </NeuCard>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
