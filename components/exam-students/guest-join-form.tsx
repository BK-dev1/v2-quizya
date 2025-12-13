'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useGuestExamAccess } from '@/lib/hooks/use-guest-exam-access'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuInput } from '@/components/ui/neu-input'
import { NeuButton } from '@/components/ui/neu-button'
import { toast } from 'sonner'

export function GuestJoinForm() {
  const [roomCode, setRoomCode] = useState('')
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  
  const { joinExamAsGuest, validateGuestInfo, loading, error } = useGuestExamAccess()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate inputs
    const validationError = validateGuestInfo(guestName, guestEmail)
    if (validationError) {
      toast.error(validationError)
      return
    }

    if (!roomCode.trim()) {
      toast.error('Room code is required')
      return
    }

    try {
      const result = await joinExamAsGuest(roomCode.toUpperCase(), guestName, guestEmail)
      
      if (result) {
        toast.success('Successfully joined exam!')
        // Store guest info in sessionStorage for exam taking
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
      toast.error(error || 'Failed to join exam')
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center ">
      <NeuCard className="w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold  mb-2">Join Exam</h1>
          <p className="">Enter your details to join the exam</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium  mb-2">
              Room Code
            </label>
            <NeuInput
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder="Enter room code"
              className="uppercase"
              maxLength={10}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Your Name
            </label>
            <NeuInput
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Your Email
            </label>
            <NeuInput
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="Enter your email"
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
            {loading ? 'Joining...' : 'Join Exam'}
          </NeuButton>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm ">
            Have an account?{' '}
            <a 
              href="/auth/login" 
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign in instead
            </a>
          </p>
        </div>
      </NeuCard>
    </div>
  )
}