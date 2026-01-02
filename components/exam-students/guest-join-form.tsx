'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGuestExamAccess } from '@/lib/hooks/use-guest-exam-access'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuInput } from '@/components/ui/neu-input'
import { NeuButton } from '@/components/ui/neu-button'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function GuestJoinForm() {
  const [roomCode, setRoomCode] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  
  const { joinExamAsGuest, validateGuestInfo, loading, error } = useGuestExamAccess()
  const router = useRouter()
  const { t } = useTranslation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validationError = validateGuestInfo(guestName, guestEmail)
    if (validationError) {
      toast.error(validationError)
      return
    }

    if (!roomCode.trim()) {
      toast.error(t('roomCodeRequired'))
      return
    }

    try {
      const result = await joinExamAsGuest(roomCode.toUpperCase(), guestName, guestEmail)
      
      if (result) {
        toast.success(t('successfullyJoined'))
        sessionStorage.setItem('guestExamSession', JSON.stringify({
          sessionId: result.session.id,
          examId: result.exam.id,
          guestName,
          guestEmail,
          isGuest: true
        }))
        
        router.push(`/exam/take?session=${result.session.id}`)
      }
    } catch (err) {
      toast.error(error || t('failedToJoin'))
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center ">
      <NeuCard className="w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold  mb-2">{t('joinExam')}</h1>
          <p className="">{t('enterDetails')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium  mb-2">
              {t('roomCode')}
            </label>
            <NeuInput
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder={t('enterRoomCode')}
              className="uppercase"
              maxLength={10}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              {t('yourName')}
            </label>
            <NeuInput
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder={t('enterFullName')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              {t('yourEmail')}
            </label>
            <NeuInput
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder={t('enterEmail')}
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
          >
            {loading ? t('joining') : t('joinExam')}
          </NeuButton>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm ">
            {t('haveAccount')}{' '}
            <a 
              href="/auth/login" 
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              {t('signInInstead')}
            </a>
          </p>
        </div>
      </NeuCard>
    </div>
  )
}