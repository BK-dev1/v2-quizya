"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  NeuCard,
  NeuCardHeader,
  NeuCardTitle,
  NeuCardDescription,
  NeuCardContent,
  NeuCardFooter,
} from "@/components/ui/neu-card"
import { NeuInput } from "@/components/ui/neu-input"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuToast } from "@/components/ui/neu-toast"
import { ArrowRight, Camera, Clock, FileQuestion, User } from "lucide-react"

export default function JoinExamPage() {
  const router = useRouter()
  const [roomCode, setRoomCode] = React.useState("")
  const [studentName, setStudentName] = React.useState("")
  const [studentEmail, setStudentEmail] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [showExamPreview, setShowExamPreview] = React.useState(false)
  const [errors, setErrors] = React.useState<Record<string, string>>({})
  const [toast, setToast] = React.useState<{ message: string; variant: "success" | "error" } | null>(null)
  const [showCamera, setShowCamera] = React.useState(false)

  // Mock exam data
  const examData = {
    title: "Introduction to Computer Science - Midterm",
    duration: "60 minutes",
    questions: 25,
    instructor: "Dr. Sarah Johnson",
  }

  const validateRoomCode = () => {
    const newErrors: Record<string, string> = {}

    if (!roomCode.trim()) {
      newErrors.roomCode = "Room code is required"
    } else if (roomCode.length < 6) {
      newErrors.roomCode = "Invalid room code"
    }

    if (!studentName.trim()) {
      newErrors.studentName = "Your name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLookup = async () => {
    if (!validateRoomCode()) return

    setIsLoading(true)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Mock: Check if room code is valid
    if (roomCode.toUpperCase() === "INVALID") {
      setErrors({ roomCode: "Room code not found. Please check and try again." })
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    setShowExamPreview(true)
  }

  const handleJoinExam = () => {
    router.push("/exam/take")
  }

  const handleScanQR = () => {
    setShowCamera(true)
  }

  if (showCamera) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="p-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">Q</span>
            </div>
            <span className="font-bold text-xl">Quizya</span>
          </Link>
          <NeuButton variant="ghost" onClick={() => setShowCamera(false)}>
            Cancel
          </NeuButton>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <NeuCard className="w-full max-w-md text-center">
            <NeuCardHeader>
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-primary" />
              </div>
              <NeuCardTitle>Scan QR Code</NeuCardTitle>
              <NeuCardDescription>Point your camera at the exam QR code</NeuCardDescription>
            </NeuCardHeader>
            <NeuCardContent>
              <div className="aspect-square max-w-xs mx-auto rounded-2xl bg-muted neu-inset flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Camera access required</p>
                  <p className="text-xs mt-1">Allow camera permission to scan</p>
                </div>
              </div>
            </NeuCardContent>
            <NeuCardFooter className="justify-center">
              <NeuButton variant="secondary" onClick={() => setShowCamera(false)}>
                Enter Code Manually
              </NeuButton>
            </NeuCardFooter>
          </NeuCard>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">Q</span>
          </div>
          <span className="font-bold text-xl">Quizya</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        {!showExamPreview ? (
          <NeuCard className="w-full max-w-md">
            <NeuCardHeader className="text-center">
              <NeuCardTitle className="text-2xl">Join an Exam</NeuCardTitle>
              <NeuCardDescription>Enter the room code provided by your instructor</NeuCardDescription>
            </NeuCardHeader>
            <NeuCardContent className="space-y-5">
              <NeuInput
                label="Room Code"
                placeholder="Enter 6-digit code"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                error={errors.roomCode}
                className="text-center font-mono text-xl tracking-widest"
              />

              <NeuInput
                label="Your Name"
                placeholder="Enter your full name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                error={errors.studentName}
              />

              <NeuInput
                label="Email (optional)"
                type="email"
                placeholder="your@email.com"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
              />

              <NeuButton onClick={handleLookup} className="w-full gap-2" disabled={isLoading}>
                {isLoading ? (
                  <span className="animate-spin w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full" />
                ) : (
                  <>
                    Find Exam
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </NeuButton>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <NeuButton variant="secondary" onClick={handleScanQR} className="w-full gap-2">
                <Camera className="w-4 h-4" />
                Scan QR Code
              </NeuButton>
            </NeuCardContent>

            <div className="px-6 pb-6 text-center">
              <p className="text-sm text-muted-foreground">
                Want to create exams?{" "}
                <Link href="/auth/signup" className="text-primary font-medium hover:underline">
                  Sign up as a teacher
                </Link>
              </p>
            </div>
          </NeuCard>
        ) : (
          <NeuCard className="w-full max-w-md">
            <NeuCardHeader>
              <NeuCardTitle className="text-xl">{examData.title}</NeuCardTitle>
              <NeuCardDescription>Review the exam details before joining</NeuCardDescription>
            </NeuCardHeader>
            <NeuCardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-muted/50 neu-flat">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-xs font-medium">Duration</span>
                  </div>
                  <p className="font-semibold">{examData.duration}</p>
                </div>
                <div className="p-4 rounded-xl bg-muted/50 neu-flat">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileQuestion className="w-4 h-4" />
                    <span className="text-xs font-medium">Questions</span>
                  </div>
                  <p className="font-semibold">{examData.questions}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-muted/50 neu-flat">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <User className="w-4 h-4" />
                  <span className="text-xs font-medium">Instructor</span>
                </div>
                <p className="font-semibold">{examData.instructor}</p>
              </div>

              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20">
                <p className="text-sm text-warning-foreground">
                  <strong>Important:</strong> Once you start, the exam timer will begin. Make sure you have a stable
                  internet connection and won&apos;t be interrupted.
                </p>
              </div>
            </NeuCardContent>
            <NeuCardFooter className="flex-col gap-3">
              <NeuButton onClick={handleJoinExam} className="w-full gap-2">
                Start Exam
                <ArrowRight className="w-4 h-4" />
              </NeuButton>
              <NeuButton variant="ghost" onClick={() => setShowExamPreview(false)} className="w-full">
                Go Back
              </NeuButton>
            </NeuCardFooter>
          </NeuCard>
        )}
      </main>

      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <NeuToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
