"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card"
import { NeuInput } from "@/components/ui/neu-input"
import { NeuButton } from "@/components/ui/neu-button"
import { Loader2, Zap, Users } from "lucide-react"
import { toast } from 'sonner'
import { useTranslation } from "react-i18next"

export default function JoinLiveQuizPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useTranslation()
  
  const [quizCode, setQuizCode] = React.useState(searchParams.get('code') || '')
  const [participantName, setParticipantName] = React.useState('')
  const [participantEmail, setParticipantEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!quizCode.trim()) {
      setError(t('quizCodeRequired') || 'Quiz code is required')
      return
    }

    if (!participantName.trim()) {
      setError(t('nameRequired') || 'Your name is required')
      return
    }

    if (!participantEmail.trim()) {
      setError(t('emailRequired') || 'Email is required')
      return
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(participantEmail.trim())) {
      setError(t('invalidEmail') || 'Please enter a valid email address')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/live-quiz/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quiz_code: quizCode.toUpperCase().trim(),
          participant_name: participantName.trim(),
          participant_email: participantEmail.trim() || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        // Store participant data in session storage (includes session token for single-device enforcement)
        sessionStorage.setItem('liveQuizParticipant', JSON.stringify({
          participantId: data.participant.id,
          quizId: data.quiz.id,
          participantName: data.participant.participant_name,
          quizTitle: data.quiz.title,
          quizCode: data.quiz.quiz_code,
          sessionToken: data.session_token
        }))

        if (data.rejoined) {
          toast.success(t('welcomeBack') || 'Welcome back!')
        } else {
          toast.success(t('successfullyJoined') || 'Successfully joined the quiz!')
        }

        // Redirect to quiz taking page
        router.push(`/live-quiz/${data.quiz.id}?participant=${data.participant.id}`)
      } else {
        setError(data.error || t('failedToJoin') || 'Failed to join quiz')
      }
    } catch (err) {
      console.error('Error joining quiz:', err)
      setError(t('failedToJoin') || 'Failed to join quiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
      <NeuCard className="w-full max-w-md">
        <NeuCardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <NeuCardTitle className="text-2xl">
            {t('joinLiveQuiz') || 'Join Live Quiz'}
          </NeuCardTitle>
          <p className="text-muted-foreground mt-2">
            {t('enterCodeToJoin') || 'Enter the quiz code to join'}
          </p>
        </NeuCardHeader>
        <NeuCardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                {t('quizCode') || 'Quiz Code'} *
              </label>
              <NeuInput
                type="text"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                placeholder="ABCD12"
                className="text-center text-2xl font-mono tracking-widest uppercase"
                maxLength={10}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('yourName') || 'Your Name'} *
              </label>
              <NeuInput
                type="text"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                placeholder={t('enterYourName') || "Enter your name"}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                {t('email') || 'Email'} *
              </label>
              <NeuInput
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                placeholder={t('enterEmail') || "Enter your email"}
                required
              />

            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                {error}
              </div>
            )}

            <NeuButton
              type="submit"
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Users className="w-5 h-5 mr-2" />
              )}
              {loading ? (t('joining') || 'Joining...') : (t('joinQuiz') || 'Join Quiz')}
            </NeuButton>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {t('lookingForExam') || 'Looking for an exam instead?'}{' '}
              <a 
                href="/join" 
                className="text-primary hover:underline font-medium"
              >
                {t('joinExam') || 'Join Exam'}
              </a>
            </p>
          </div>
        </NeuCardContent>
      </NeuCard>
    </div>
  )
}
