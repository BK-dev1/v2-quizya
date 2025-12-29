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
  const { signUp, loading } = useAuth()
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
            <p className="text-slate-600 mb-4">
              {t('verificationSent')} <strong>{verificationEmail}</strong>
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-slate-700 mb-2">
                <strong>{t('nextSteps')}</strong>
              </p>
              <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
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
            <p className="text-xs text-slate-500">
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
              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent "
              required
            >
              <option value="student">{t('student')}</option>
              <option value="teacher">{t('teacher')}</option>
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:"
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
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:"
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