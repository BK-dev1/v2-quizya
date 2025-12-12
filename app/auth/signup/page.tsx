"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardDescription, NeuCardContent } from "@/components/ui/neu-card"
import { NeuInput } from "@/components/ui/neu-input"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuToast } from "@/components/ui/neu-toast"
import { Mail, Eye, EyeOff, ArrowRight } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [showVerification, setShowVerification] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [toast, setToast] = React.useState<{ message: string; variant: "success" | "error" } | null>(null)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!email) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email"
    }

    if (!password) {
      newErrors.password = "Password is required"
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters"
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    setShowVerification(true)
  }

  const handleResendVerification = async () => {
    setToast({ message: "Verification email sent!", variant: "success" })
    setTimeout(() => setToast(null), 3000)
  }

  if (showVerification) {
    return (
      <NeuCard className="w-full max-w-md">
        <NeuCardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-success" />
          </div>
          <NeuCardTitle className="text-2xl">Check Your Email</NeuCardTitle>
          <NeuCardDescription className="text-base">
            We&apos;ve sent a verification link to <strong>{email}</strong>
          </NeuCardDescription>
        </NeuCardHeader>
        <NeuCardContent className="space-y-6">
          <div className="p-4 rounded-xl bg-muted/50 space-y-2 text-sm text-muted-foreground">
            <p>Click the link in your email to verify your account and continue setting up your profile.</p>
            <p>The link will expire in 24 hours.</p>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">Didn&apos;t receive the email?</p>
            <NeuButton variant="secondary" onClick={handleResendVerification}>
              Resend Verification Email
            </NeuButton>
          </div>

          <div className="text-center">
            <Link href="/auth/login" className="text-sm text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </NeuCardContent>

        {toast && (
          <div className="fixed bottom-4 right-4 z-50">
            <NeuToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
          </div>
        )}
      </NeuCard>
    )
  }

  return (
    <NeuCard className="w-full max-w-md">
      <NeuCardHeader className="text-center">
        <NeuCardTitle className="text-2xl">Create Your Account</NeuCardTitle>
        <NeuCardDescription>Start creating exams in minutes</NeuCardDescription>
      </NeuCardHeader>
      <NeuCardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <NeuInput
              label="Email Address"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />
          </div>

          <div className="relative">
            <NeuInput
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-muted-foreground hover:text-foreground"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <div className="relative">
            <NeuInput
              label="Confirm Password"
              type={showPassword ? "text" : "password"}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          </div>

          <NeuButton type="submit" className="w-full gap-2" disabled={isLoading}>
            {isLoading ? (
              <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </NeuButton>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Log in
          </Link>
        </div>
      </NeuCardContent>
    </NeuCard>
  )
}
