"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { Search, Filter, Clock, Users, Star, BookOpen, ChevronDown, ArrowLeft, Copy, Check, Loader2 } from "lucide-react"

interface PublicExam {
  id: string
  title: string
  created_by: string
  full_name: string // Joined from profiles
  description: string
  subject: string
  duration_minutes: number
  total_questions: number
  attempts: number // We might need to count sessions
  difficulty: "Easy" | "Medium" | "Hard" // We might need to add this to exam schema or infer
  tags: string[]
  room_code: string
}

const subjects = [
  "All Subjects",
  "Computer Science",
  "Mathematics",
  "Science",
  "History",
  "General Knowledge",
  "Other"
]

export default function PublicExamsPage() {
  const [exams, setExams] = useState<PublicExam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("All Subjects")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      // Assuming we have an API endpoint or we reuse GET /api/exams with a public filter
      // For now, let's try searching via a new dedicated endpoint or existing one
      const res = await fetch('/api/public-exams')
      if (res.ok) {
        const data = await res.json()
        setExams(data)
      }
    } catch (error) {
      console.error("Failed to fetch public exams", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter client-side for now
  const filteredExams = exams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.description && exam.description.toLowerCase().includes(searchQuery.toLowerCase()))

    // Subject filter is tricky if we don't have subject field in Exam table yet. 
    // Assuming for now we show all or basic text match.
    return matchesSearch
  })

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back</span>
              </Link>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-foreground">Public Exams</h1>
                <p className="text-sm text-muted-foreground">Browse and take exams from educators worldwide</p>
              </div>
            </div>
            <Link href="/join">
              <NeuButton>Enter Room Code</NeuButton>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Search and Filters */}
        <NeuCard className="p-4 md:p-6 mb-8">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl neu-inset bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </div>
        </NeuCard>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {filteredExams.length} exam{filteredExams.length !== 1 ? "s" : ""}
            </p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredExams.map((exam) => (
                <NeuCard key={exam.id} className="p-5 flex flex-col">
                  {/* Title */}
                  <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{exam.title}</h3>

                  {/* Author */}
                  <p className="text-sm text-muted-foreground mb-3">
                    {exam.duration_minutes} mins • {exam.total_questions} Qs
                  </p>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {exam.description || "No description provided."}
                  </p>

                  {/* Room Code & Actions */}
                  <div className="mt-auto pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => handleCopyCode(exam.room_code || 'N/A')}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg neu-flat hover:bg-muted/50 transition-colors text-sm"
                        disabled={!exam.room_code}
                      >
                        <code className="font-mono text-primary">{exam.room_code || 'No Code'}</code>
                        {copiedCode === exam.room_code ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      <Link href={exam.room_code ? `/join?code=${exam.room_code}` : '#'}>
                        <NeuButton size="sm" disabled={!exam.room_code}>Take Exam</NeuButton>
                      </Link>
                    </div>
                  </div>
                </NeuCard>
              ))}
            </div>

            {filteredExams.length === 0 && (
              <NeuCard className="p-12 text-center">
                <h3 className="font-semibold text-foreground mb-2">No exams found</h3>
                <p className="text-muted-foreground">Try adjusting your search</p>
              </NeuCard>
            )}
          </>
        )}
      </main>
    </div>
  )
}
