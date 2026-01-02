'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { Loader2, CheckCircle, XCircle, Home, Award } from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useWindowSize } from 'react-use'
import Confetti from 'react-confetti'
import { useTranslation } from 'react-i18next'

interface ResultData {
  score: number
  totalPoints: number
  percentage: number
  passed: boolean
  totalQuestions: number
  correctAnswers: number
  answers: any[]
}

export default function ExamResults() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')
  const [loading, setLoading] = useState(true)
  const [result, setResult] = useState<ResultData | null>(null)
  const { width, height } = useWindowSize()
  const { t } = useTranslation()

  useEffect(() => {
    if (!sessionId) {
      router.push('/')
      return
    }
    fetchResults()
  }, [sessionId])

  const fetchResults = async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`)
      if (!res.ok) throw new Error('Failed to fetch results')

      const session = await res.json()

      const totalQuestions = session.exam.total_questions || 0
      const score = Number(session.score) || 0
      const totalPoints = session.total_points || 0
      const percentage = totalPoints > 0 ? (score / totalPoints) * 100 : 0
      const passed = percentage >= (session.exam.passing_score || 0)

      const correctCount = Array.isArray(session.answers)
        ? session.answers.filter((a: any) => a.is_correct).length
        : 0

      setResult({
        score,
        totalPoints,
        percentage,
        passed,
        totalQuestions,
        correctAnswers: correctCount,
        answers: session.answers
      })
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p>{t('loadingResults')}</p>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-secondary/30">
        <div className="text-center">
          <p className="text-destructive mb-4">{t('couldNotLoadResults')}</p>
          <NeuButton onClick={() => router.push('/')}>{t('goHome')}</NeuButton>
        </div>
      </div>
    )
  }

  const data = [
    { name: t('correct'), value: result.correctAnswers, color: '#22c55e' },
    { name: t('incorrect'), value: result.totalQuestions - result.correctAnswers, color: '#ef4444' },
  ]

  return (
    <div className="min-h-screen bg-secondary/30 py-12 px-4">
      {result.passed && <Confetti width={width} height={height} recycle={false} numberOfPieces={200} />}

      <div className="max-w-4xl mx-auto space-y-8">
        <NeuCard className="p-8 md:p-12 text-center relative overflow-hidden">
          <div className="mb-8 relative z-10">
            <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center shadow-lg ${result.passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
              {result.passed ? <Award className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
            </div>
            <h1 className="text-4xl font-bold mb-2">
              {result.passed ? t('congratulations') : t('keepPracticing')}
            </h1>
            <p className="text-lg text-muted-foreground">
              {result.passed ? t('youHavePassed') : t('youHaveFailed')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center mb-8">
            <div className="h-64 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-4xl font-bold">{Math.round(result.percentage)}%</span>
                <span className="text-sm text-muted-foreground">{t('score')}</span>
              </div>
            </div>

            <div className="flex flex-col gap-4 text-left">
              <div className="p-4 rounded-xl bg-green-50/50 border border-green-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('correctAnswers')}</p>
                  <p className="text-xl font-bold">{result.correctAnswers} / {result.totalQuestions}</p>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('pointsEarned')}</p>
                  <p className="text-xl font-bold">{result.score} / {result.totalPoints}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <NeuButton
              onClick={() => router.push('/')}
              className="gap-2"
            >
              <Home className="w-4 h-4" />
              {t('backToHome')}
            </NeuButton>
          </div>
        </NeuCard>
      </div>
    </div>
  )
}