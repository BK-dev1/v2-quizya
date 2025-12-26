"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Lock, Shield, CheckCircle } from "lucide-react"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { CredentialInput } from "@/components/ui/credential-input"
import { PasswordStrength } from "@/components/ui/password-strength"
import { ToastProvider, useToast } from "@/components/ui/toast-container"
import { createClient } from "@/lib/supabase/client"

function ChangePasswordContent() {
  const { showToast } = useToast()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [touched, setTouched] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  })

  const validateField = (field: string, value: string) => {
    switch (field) {
      case "currentPassword":
        if (!value) return "Current password is required"
        return ""
      case "newPassword":
        if (!value) return "New password is required"
        if (value.length < 8) return "Password must be at least 8 characters"
        if (value === formData.currentPassword) return "New password must be different"
        return ""
      case "confirmPassword":
        if (!value) return "Please confirm your password"
        if (value !== formData.newPassword) return "Passwords do not match"
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
    // Re-validate confirmPassword when newPassword changes
    if (field === "newPassword" && touched.confirmPassword) {
      setErrors((prev) => ({
        ...prev,
        confirmPassword: formData.confirmPassword !== value ? "Passwords do not match" : "",
      }))
    }
  }

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    setErrors((prev) => ({ ...prev, [field]: validateField(field, formData[field as keyof typeof formData]) }))
  }

  const isValid = () => {
    return (
      formData.currentPassword &&
      formData.newPassword &&
      formData.confirmPassword &&
      formData.newPassword.length >= 8 &&
      formData.newPassword === formData.confirmPassword &&
      formData.newPassword !== formData.currentPassword
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all fields
    const newErrors = {
      currentPassword: validateField("currentPassword", formData.currentPassword),
      newPassword: validateField("newPassword", formData.newPassword),
      confirmPassword: validateField("confirmPassword", formData.confirmPassword),
    }
    setErrors(newErrors)
    setTouched({ currentPassword: true, newPassword: true, confirmPassword: true })

    if (Object.values(newErrors).some((e) => e)) {
      showToast("Please fix the errors before submitting", "error")
      return
    }

    setLoading(true)

    try {
      // 1. Verify current password by attempting to sign in
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error("User session not found")

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: formData.currentPassword,
      })

      if (signInError) {
        throw new Error("Invalid current password. Please try again.")
      }

      // 2. Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: formData.newPassword,
      })

      if (updateError) throw updateError

      setSuccess(true)
      showToast("Password changed successfully!", "success")
    } catch (error: any) {
      console.error('Error updating password:', error)
      showToast(error.message || "Failed to update password", "error")
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-4">
        <NeuCard className="max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">Password Updated</h2>
          <p className="text-muted-foreground mb-6">
            Your password has been changed successfully. A confirmation email has been sent to your registered email
            address.
          </p>
          <Link href="/dashboard/settings">
            <NeuButton className="w-full">Back to Settings</NeuButton>
          </Link>
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
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Change Password</h1>
          <p className="text-muted-foreground mt-1">Update your account password for security</p>
        </div>

        {/* Form Card */}
        <NeuCard className="p-6 md:p-8">
          {/* Security Notice */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10 mb-8">
            <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Re-authentication Required</p>
              <p className="text-muted-foreground mt-1">
                Enter your current password to verify your identity before setting a new one.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Password */}
            <CredentialInput
              label="Current Password"
              placeholder="Enter your current password"
              value={formData.currentPassword}
              onChange={(e) => handleChange("currentPassword", e.target.value)}
              onBlur={() => handleBlur("currentPassword")}
              error={touched.currentPassword ? errors.currentPassword : ""}
              success={touched.currentPassword && !errors.currentPassword && formData.currentPassword.length > 0}
              icon={<Lock className="w-5 h-5" />}
              showPasswordToggle
            />

            {/* Divider */}
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-background text-sm text-muted-foreground">New Password</span>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-3">
              <CredentialInput
                label="New Password"
                placeholder="Enter your new password"
                value={formData.newPassword}
                onChange={(e) => handleChange("newPassword", e.target.value)}
                onBlur={() => handleBlur("newPassword")}
                error={touched.newPassword ? errors.newPassword : ""}
                success={touched.newPassword && !errors.newPassword && formData.newPassword.length >= 8}
                icon={<Lock className="w-5 h-5" />}
                showPasswordToggle
              />
              <PasswordStrength password={formData.newPassword} />
            </div>

            {/* Confirm Password */}
            <CredentialInput
              label="Confirm New Password"
              placeholder="Re-enter your new password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              onBlur={() => handleBlur("confirmPassword")}
              error={touched.confirmPassword ? errors.confirmPassword : ""}
              success={touched.confirmPassword && !errors.confirmPassword && formData.confirmPassword.length > 0}
              icon={<Lock className="w-5 h-5" />}
              showPasswordToggle
            />

            {/* Submit Button */}
            <div className="pt-4">
              <NeuButton type="submit" className="w-full h-14" disabled={loading || !isValid()}>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Updating Password...
                  </span>
                ) : (
                  "Update Password"
                )}
              </NeuButton>
            </div>
          </form>
        </NeuCard>

        {/* Help Text */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          Forgot your current password?{" "}
          <Link href="/auth/login" className="text-primary hover:underline">
            Reset it here
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function ChangePasswordPage() {
  return (
    <ToastProvider>
      <ChangePasswordContent />
    </ToastProvider>
  )
}
