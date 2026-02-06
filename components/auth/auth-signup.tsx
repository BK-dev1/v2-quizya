'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/hooks/use-auth'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuInput } from '@/components/ui/neu-input'
import { NeuButton } from '@/components/ui/neu-button'
import { Eye, EyeOff, Loader2, Check } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export default function SignupPage() {
  const router = useRouter()
  const { signUp, signInWithGoogle, loading } = useAuth()
  const { t } = useTranslation()

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'teacher' | 'student'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [verificationEmail, setVerificationEmail] = useState('')

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error(t('fullNameRequired'))
      return false
    }

    if (!formData.email.trim()) {
      toast.error(t('emailRequired'))
      return false
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error(t('validEmail'))
      return false
    }

    if (formData.password.length < 6) {
      toast.error(t('passwordLength'))
      return false
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(t('passwordsDontMatch'))
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const { error } = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.role
      )

      if (error) {
        if (error.includes('already registered') || error.includes('duplicate')) {
          toast.error(t('emailAlreadyRegistered'))
        } else if (error.includes('weak') || error.includes('password')) {
          toast.error(t('weakPassword'))
        } else {
          toast.error(error)
        }
      } else {
        toast.success(t('accountCreated'))
        setVerificationSent(true)
        setVerificationEmail(formData.email)
      }
    } catch (err) {
      toast.error(t('errorOccurredSignup'))
      console.error('Signup error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      const params = new URLSearchParams(window.location.search)
      const next = params.get('next') || '/dashboard'
      const { error } = await signInWithGoogle(next)
      if (error) {
        toast.error(error)
      }
    } catch (err) {
      toast.error(t('errorOccurredSignup'))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('loading')}</p>
        </div>
      </div>
    )
  }

  if (verificationSent) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <NeuCard className="w-full max-w-lg p-8">
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">{t('verifyEmail')}</h2>
            <p className="text-muted-foreground mb-4">
              {t('verificationSent')} <strong>{verificationEmail}</strong>
            </p>
            <div className="bg-muted rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-foreground mb-2">
                <strong>{t('nextSteps')}</strong>
              </p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>{t('checkEmailInbox')}</li>
                <li>{t('clickVerificationLink')}</li>
                <li>{t('returnToSignIn')}</li>
              </ol>
            </div>
            <NeuButton
              onClick={() => router.push('/auth/login')}
              className="w-full mb-4"
            >
              {t('goToLogin')}
            </NeuButton>
            <p className="text-xs text-muted-foreground">
              {t('didntReceiveEmail')}
            </p>
          </div>
        </NeuCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center ">
      <NeuCard className="w-full max-w-lg p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold  mb-2">{t('createAccount')}</h1>
          <p className="">{t('joinQuizya')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium  mb-2">
              {t('fullName')}
            </label>
            <NeuInput
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder={t('enterFullName')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              {t('emailAddress')}
            </label>
            <NeuInput
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('enterEmail')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              {t('accountType')}
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="w-full p-3 bg-input border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              required
            >
              <option value="teacher">{t('teacher')}</option>
              <option value="student">{t('student')}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              {t('password')}
            </label>
            <div className="relative">
              <NeuInput
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('enterPassword')}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              {t('confirmPassword')}
            </label>
            <div className="relative">
              <NeuInput
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder={t('confirmYourPassword')}
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <NeuButton
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('creatingAccount')}
              </>
            ) : (
              t('createAccountButton')
            )}
          </NeuButton>
        </form>

        <div className="mt-6 space-y-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">{t('or')}</span>
            </div>
          </div>

          <NeuButton
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            variant="secondary"
            className="w-full gap-2"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {t('signUpWithGoogle')}
              </>
            )}
          </NeuButton>

          <div className="text-center ">
            <span className="text-sm">{t('alreadyHaveAccount')} </span>
            <Link
              href="/auth/login"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              {t('signIn')}
            </Link>
          </div>

          <div className="text-center">
            <Link
              href="/join"
              className="text-sm text-green-600 hover:text-green-500 font-medium"
            >
              {t('joinExamAsGuest')}
            </Link>
          </div>
        </div>
      </NeuCard>
    </div>
  )
}