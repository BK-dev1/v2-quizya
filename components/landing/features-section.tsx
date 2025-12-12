"use client"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardDescription, NeuCardContent } from "@/components/ui/neu-card"
import { FileEdit, Shield, BarChart3, Clock, QrCode, Shuffle, Users, Lock } from "lucide-react"

const features = [
  {
    icon: FileEdit,
    title: "Exam Builder",
    description: "Create MCQ, True/False, Short Answer, and Essay questions with an intuitive drag-and-drop interface.",
  },
  {
    icon: Shield,
    title: "Advanced Proctoring",
    description: "Fullscreen enforcement, copy protection, and tab-switching detection to ensure exam integrity.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Track student performance, question difficulty, and time spent with comprehensive dashboards.",
  },
  {
    icon: Clock,
    title: "Flexible Timing",
    description: "Set global exam timers or per-question time limits to match your assessment needs.",
  },
  {
    icon: QrCode,
    title: "Easy Access",
    description: "Students join instantly with room codes or QR codes. No account required to take an exam.",
  },
  {
    icon: Shuffle,
    title: "Randomization",
    description: "Shuffle questions and answer choices to prevent cheating and ensure fair assessments.",
  },
  {
    icon: Users,
    title: "Live Monitoring",
    description: "Watch student progress in real-time with infraction alerts and instant notifications.",
  },
  {
    icon: Lock,
    title: "Secure & Private",
    description: "Your data is encrypted and secure. We never share student information with third parties.",
  },
]

export function FeaturesSection() {
  return (
    <section className="py-20 px-4" aria-labelledby="features-heading">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold">
            Everything You Need for Online Exams
          </h2>
          <p className="max-w-2xl mx-auto text-muted-foreground text-lg">
            From exam creation to results analysis, Quizya provides all the tools teachers and students need for
            successful online assessments.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <NeuCard key={feature.title} className="group hover:scale-[1.02] transition-transform duration-200">
              <NeuCardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                </div>
                <NeuCardTitle className="text-lg">{feature.title}</NeuCardTitle>
              </NeuCardHeader>
              <NeuCardContent>
                <NeuCardDescription className="text-sm">{feature.description}</NeuCardDescription>
              </NeuCardContent>
            </NeuCard>
          ))}
        </div>
      </div>
    </section>
  )
}
