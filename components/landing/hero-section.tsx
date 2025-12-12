"use client"
import Link from "next/link"
import { NeuButton } from "@/components/ui/neu-button"
import { GraduationCap, Users } from "lucide-react"

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-4xl mx-auto text-center space-y-8">
        <div className="space-y-4">
          <p className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium neu-flat">
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            The modern exam platform
          </p>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance">
            Create and Take Exams <span className="text-primary">with Confidence</span>
          </h1>

          <p className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground text-pretty">
            Quizya empowers teachers to create engaging assessments and provides students with a secure,
            distraction-free exam experience with advanced proctoring.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/auth/signup">
            <NeuButton size="lg" className="w-full sm:w-auto gap-2">
              <GraduationCap className="w-5 h-5" />
              Teachers - Create an Exam
            </NeuButton>
          </Link>
          <Link href="/join">
            <NeuButton variant="secondary" size="lg" className="w-full sm:w-auto gap-2">
              <Users className="w-5 h-5" />
              Students - Join with Room Code
            </NeuButton>
          </Link>
        </div>

        <div className="pt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-2xl">10K+</span>
            <span>Exams Created</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-2xl">50K+</span>
            <span>Students</span>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground text-2xl">99%</span>
            <span>Uptime</span>
          </div>
        </div>
      </div>
    </section>
  )
}
