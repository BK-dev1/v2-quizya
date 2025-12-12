"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardDescription, NeuCardContent } from "@/components/ui/neu-card"
import { NeuInput } from "@/components/ui/neu-input"
import { NeuButton } from "@/components/ui/neu-button"
import { ArrowRight, ArrowLeft, User, Building, FileText, CheckCircle } from "lucide-react"

const steps = [
  { id: 1, title: "Personal Info", icon: User },
  { id: 2, title: "Institution", icon: Building },
  { id: 3, title: "Bio", icon: FileText },
]

export default function ProfileSetupPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = React.useState(1)
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    firstName: "",
    lastName: "",
    school: "",
    major: "",
    department: "",
    bio: "",
  })
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const updateFormData = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }))
    }
  }

  const validateStep = () => {
    const newErrors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = "First name is required"
      if (!formData.lastName.trim()) newErrors.lastName = "Last name is required"
    }

    if (currentStep === 2) {
      if (!formData.school.trim()) newErrors.school = "School/Institution is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep()) return

    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const handleComplete = async () => {
    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    router.push("/dashboard")
  }

  return (
    <div className="w-full max-w-lg">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    step.id < currentStep
                      ? "bg-success text-success-foreground neu-button"
                      : step.id === currentStep
                        ? "bg-primary text-primary-foreground neu-button"
                        : "bg-background text-muted-foreground neu-flat"
                  }`}
                >
                  {step.id < currentStep ? <CheckCircle className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    step.id === currentStep ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-4 rounded-full transition-all ${
                    step.id < currentStep ? "bg-success" : "bg-muted"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle className="text-2xl">
            {currentStep === 1 && "Tell Us About Yourself"}
            {currentStep === 2 && "Your Institution"}
            {currentStep === 3 && "Add a Bio"}
          </NeuCardTitle>
          <NeuCardDescription>
            {currentStep === 1 && "Let's start with your name"}
            {currentStep === 2 && "Where do you teach or study?"}
            {currentStep === 3 && "Share a bit about yourself (optional)"}
          </NeuCardDescription>
        </NeuCardHeader>
        <NeuCardContent className="space-y-6">
          {currentStep === 1 && (
            <div className="space-y-4">
              <NeuInput
                label="First Name"
                placeholder="John"
                value={formData.firstName}
                onChange={(e) => updateFormData("firstName", e.target.value)}
                error={errors.firstName}
                autoComplete="given-name"
              />
              <NeuInput
                label="Last Name"
                placeholder="Doe"
                value={formData.lastName}
                onChange={(e) => updateFormData("lastName", e.target.value)}
                error={errors.lastName}
                autoComplete="family-name"
              />
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <NeuInput
                label="School / Institution"
                placeholder="Harvard University"
                value={formData.school}
                onChange={(e) => updateFormData("school", e.target.value)}
                error={errors.school}
                autoComplete="organization"
              />
              <NeuInput
                label="Department (optional)"
                placeholder="Computer Science"
                value={formData.department}
                onChange={(e) => updateFormData("department", e.target.value)}
              />
              <NeuInput
                label="Major / Subject (optional)"
                placeholder="Software Engineering"
                value={formData.major}
                onChange={(e) => updateFormData("major", e.target.value)}
              />
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="bio" className="block text-sm font-medium text-foreground">
                  Bio
                </label>
                <textarea
                  id="bio"
                  placeholder="Tell us a bit about yourself and your teaching experience..."
                  value={formData.bio}
                  onChange={(e) => updateFormData("bio", e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-background neu-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                />
                <p className="text-xs text-muted-foreground">{formData.bio.length}/500 characters</p>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4">
            <NeuButton variant="ghost" onClick={handleBack} disabled={currentStep === 1} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back
            </NeuButton>

            {currentStep < 3 ? (
              <NeuButton onClick={handleNext} className="gap-2">
                Next
                <ArrowRight className="w-4 h-4" />
              </NeuButton>
            ) : (
              <NeuButton onClick={handleComplete} disabled={isLoading} className="gap-2">
                {isLoading ? (
                  <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                ) : (
                  <>
                    Complete Setup
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </NeuButton>
            )}
          </div>
        </NeuCardContent>
      </NeuCard>
    </div>
  )
}
