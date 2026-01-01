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

export default function SignupPage() {
  const router = useRouter()
  const { signUp, loading } = useAuth()
  
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
      toast.error('Full name is required')
      return false
    }
    
    if (!formData.email.trim()) {
      toast.error('Email is required')
      return false
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      toast.error('Please enter a valid email address')
      return false
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
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
        // Provide specific error messages
        if (error.includes('already registered') || error.includes('duplicate')) {
          toast.error('This email is already registered. Please log in instead.')
        } else if (error.includes('weak') || error.includes('password')) {
          toast.error('Password is too weak. Please use a stronger password.')
        } else {
          toast.error(error)
        }
      } else {
        toast.success('Account created successfully! Please check your email to verify your account.')
        setVerificationSent(true)
        setVerificationEmail(formData.email)
        // Don't redirect - show verification pending message
      }
    } catch (err) {
      toast.error('An error occurred during signup')
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
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  // Show verification pending message
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
            <h2 className="text-2xl font-bold mb-2">Verify Your Email</h2>
            <p className="text-slate-600 mb-4">
              We've sent a verification link to <strong>{verificationEmail}</strong>
            </p>
            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-slate-700 mb-2">
                <strong>Next steps:</strong>
              </p>
              <ol className="text-sm text-slate-600 space-y-2 list-decimal list-inside">
                <li>Check your email inbox (and spam folder)</li>
                <li>Click the verification link in the email</li>
                <li>Return here to sign in</li>
              </ol>
            </div>
            <NeuButton
              onClick={() => router.push('/auth/login')}
              className="w-full mb-4"
            >
              Go to Login
            </NeuButton>
            <p className="text-xs text-slate-500">
              Didn't receive an email? Check your spam folder or try signing up again.
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
          <h1 className="text-2xl font-bold  mb-2">Create Account</h1>
          <p className="">Join Quizya to create and manage exams</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium  mb-2">
              Full Name
            </label>
            <NeuInput
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Email Address
            </label>
            <NeuInput
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Account Type
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleInputChange}
              className="flex h-12 w-full rounded-lg bg-input px-4 py-3 text-base border border-border text-foreground transition-all duration-150 ease-out hover:border-muted-foreground/50 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium  mb-2">
              Password
            </label>
            <div className="relative">
              <NeuInput
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a password"
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
              Confirm Password
            </label>
            <div className="relative">
              <NeuInput
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Confirm your password"
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
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </NeuButton>
        </form>

        <div className="mt-6 space-y-4">
          <div className="text-center ">
            <span className="text-sm">Already have an account? </span>
            <Link 
              href="/auth/login" 
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Sign in
            </Link>
          </div>

          <div className="text-center">
            <Link 
              href="/join" 
              className="text-sm text-green-600 hover:text-green-500 font-medium"
            >
              Join an exam as guest
            </Link>
          </div>
        </div>
      </NeuCard>
    </div>
  )
}