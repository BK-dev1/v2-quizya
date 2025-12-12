"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardDescription, NeuCardContent } from "@/components/ui/neu-card"
import { NeuInput } from "@/components/ui/neu-input"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuModal } from "@/components/ui/neu-modal"
import { NeuToast } from "@/components/ui/neu-toast"
import { Eye, EyeOff, ArrowRight, CheckCircle } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [showForgotPassword, setShowForgotPassword] = React.useState(false)
  const [forgotEmail, setForgotEmail] = React.useState("")
  const [forgotEmailSent, setForgotEmailSent] = React.useState(false)
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
    router.push("/dashboard")
  }

  const handleForgotPassword = async () => {
    if (!forgotEmail || !/\S+@\S+\.\S+/.test(forgotEmail)) {
      return
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setForgotEmailSent(true)
  }

  return (
    <>
      <NeuCard className="w-full max-w-md">
        <NeuCardHeader className="text-center">
          <NeuCardTitle className="text-2xl">Welcome Back</NeuCardTitle>
          <NeuCardDescription>Log in to your Quizya account</NeuCardDescription>
        </NeuCardHeader>
        <NeuCardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <NeuInput
              label="Email Address"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              autoComplete="email"
            />

            <div className="relative">
              <NeuInput
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                autoComplete="current-password"
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

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <NeuButton type="submit" className="w-full gap-2" disabled={isLoading}>
              {isLoading ? (
                <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
              ) : (
                <>
                  Log In
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </NeuButton>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="text-primary font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </NeuCardContent>
      </NeuCard>

      {/* Forgot Password Modal */}
      <NeuModal
        open={showForgotPassword}
        onClose={() => {
          setShowForgotPassword(false)
          setForgotEmailSent(false)
          setForgotEmail("")
        }}
        title={forgotEmailSent ? "Email Sent" : "Reset Password"}
        description={
          forgotEmailSent
            ? `We've sent a password reset link to ${forgotEmail}`
            : "Enter your email and we'll send you a link to reset your password."
        }
        footer={
          forgotEmailSent ? (
            <NeuButton
              onClick={() => {
                setShowForgotPassword(false)
                setForgotEmailSent(false)
                setForgotEmail("")
              }}
            >
              Back to Login
            </NeuButton>
          ) : (
            <>
              <NeuButton variant="ghost" onClick={() => setShowForgotPassword(false)}>
                Cancel
              </NeuButton>
              <NeuButton onClick={handleForgotPassword}>Send Reset Link</NeuButton>
            </>
          )
        }
      >
        {forgotEmailSent ? (
          <div className="flex justify-center py-4">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </div>
        ) : (
          <NeuInput
            label="Email Address"
            type="email"
            placeholder="you@school.edu"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
        )}
      </NeuModal>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <NeuToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </>
  )
}
