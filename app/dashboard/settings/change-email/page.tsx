"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Shield } from "lucide-react"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { CredentialInput } from "@/components/ui/credential-input"
import { ToastProvider, useToast } from "@/components/ui/toast-container"

function ChangeEmailContent() {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const currentEmail = "sarah.johnson@university.edu"

  const [formData, setFormData] = useState({
    newEmail: "",
    confirmEmail: "",
  })

  const [errors, setErrors] = useState({
    newEmail: "",
    confirmEmail: "",
  })

  const [touched, setTouched] = useState({
    newEmail: false,
    confirmEmail: false,
  })

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return regex.test(email)
  }

  const validateField = (field: string, value: string) => {
    switch (field) {
      case "newEmail":
        if (!value) return "Email is required"
        if (!validateEmail(value)) return "Please enter a valid email"
        if (value === currentEmail) return "New email must be different from current"
        return ""
      case "confirmEmail":
        if (!value) return "Please confirm your email"
        if (value !== formData.newEmail) return "Emails do not match"
        return ""
      default:
        return ""
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (touched[field as keyof typeof touched]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }))
    }
    // Re-validate confirmEmail when newEmail changes
    if (field === "newEmail" && touched.confirmEmail) {
      setErrors((prev) => ({
        ...prev,
        confirmEmail: formData.confirmEmail !== value ? "Emails do not match" : "",
      }))
    }
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors((prev) => ({ ...prev, [field]: validateField(field, formData[field as keyof typeof formData]) }))
  }

  const isValid = () => {
    return (
      formData.newEmail &&
      formData.confirmEmail &&
      !errors.newEmail &&
      !errors.confirmEmail &&
      formData.newEmail === formData.confirmEmail
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const newErrors = {
      newEmail: validateField("newEmail", formData.newEmail),
      confirmEmail: validateField("confirmEmail", formData.confirmEmail),
    }
    setErrors(newErrors)
    setTouched({ newEmail: true, confirmEmail: true })

    if (Object.values(newErrors).some((e) => e)) {
      showToast("Please fix the errors before submitting", "error")
      return
    }

    setLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setLoading(false)
    setEmailSent(true)
    showToast("Verification email sent! Check your inbox.", "success")
  }

  if (emailSent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <NeuCard className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Check Your Inbox</h2>
          <p className="text-muted-foreground mb-6">
            We&apos;ve sent a verification link to{" "}
            <span className="font-medium text-foreground">{formData.newEmail}</span>. Click the link to confirm your new
            email address.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            The link will expire in 24 hours. An alert has also been sent to your current email.
          </p>
          <div className="flex flex-col gap-3">
            <NeuButton variant="secondary" onClick={() => setEmailSent(false)}>
              Change Email Address
            </NeuButton>
            <Link href="/dashboard/settings">
              <NeuButton variant="ghost" className="w-full">
                Back to Settings
              </NeuButton>
            </Link>
          </div>
        </NeuCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Settings</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Change Email Address</h1>
          <p className="text-muted-foreground mt-1">Update the email associated with your account</p>
        </div>

        {/* Form Card */}
        <NeuCard className="p-6 md:p-8">
          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 mb-8">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Security Verification Required</p>
              <p className="text-muted-foreground mt-1">
                A verification email will be sent to your new address. Your current email will receive an alert about
                this change.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Email (Read-only) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-foreground">Current Email</label>
              <div className="h-14 w-full rounded-xl bg-muted/50 px-4 py-4 text-muted-foreground flex items-center">
                {currentEmail}
              </div>
            </div>

            {/* New Email */}
            <CredentialInput
              label="New Email Address"
              type="email"
              placeholder="Enter your new email"
              value={formData.newEmail}
              onChange={(e) => handleChange("newEmail", e.target.value)}
              onBlur={() => handleBlur("newEmail")}
              error={touched.newEmail ? errors.newEmail : ""}
              success={touched.newEmail && !errors.newEmail && formData.newEmail.length > 0}
              icon={<Mail className="w-5 h-5" />}
            />

            {/* Confirm Email */}
            <CredentialInput
              label="Confirm New Email"
              type="email"
              placeholder="Re-enter your new email"
              value={formData.confirmEmail}
              onChange={(e) => handleChange("confirmEmail", e.target.value)}
              onBlur={() => handleBlur("confirmEmail")}
              error={touched.confirmEmail ? errors.confirmEmail : ""}
              success={touched.confirmEmail && !errors.confirmEmail && formData.confirmEmail.length > 0}
              icon={<Mail className="w-5 h-5" />}
            />

            {/* Submit Button */}
            <div className="pt-4">
              <NeuButton type="submit" className="w-full h-14" disabled={loading || !isValid()}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending Verification...
                  </span>
                ) : (
                  "Send Verification Email"
                )}
              </NeuButton>
            </div>
          </form>
        </NeuCard>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help?{" "}
          <Link href="/support" className="text-primary hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ChangeEmailPage() {
  return (
    <ToastProvider>
      <ChangeEmailContent />
    </ToastProvider>
  )
}
