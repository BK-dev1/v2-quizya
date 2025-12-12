"use client"

import { useState } from "react"
import Link from "next/link"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { Search, Filter, Clock, Users, Star, BookOpen, ChevronDown, ArrowLeft, Copy, Check } from "lucide-react"

interface PublicExam {
  id: string
  title: string
  author: string
  institution: string
  subject: string
  duration: number
  questionCount: number
  attempts: number
  rating: number
  difficulty: "Easy" | "Medium" | "Hard"
  tags: string[]
  roomCode: string
}

const mockExams: PublicExam[] = [
  {
    id: "1",
    title: "Introduction to JavaScript",
    author: "Dr. Smith",
    institution: "Tech University",
    subject: "Computer Science",
    duration: 45,
    questionCount: 30,
    attempts: 1520,
    rating: 4.8,
    difficulty: "Easy",
    tags: ["Programming", "Web Development", "Beginners"],
    roomCode: "JS-INTRO-2024",
  },
  {
    id: "2",
    title: "Advanced Data Structures",
    author: "Prof. Johnson",
    institution: "State College",
    subject: "Computer Science",
    duration: 90,
    questionCount: 50,
    attempts: 892,
    rating: 4.5,
    difficulty: "Hard",
    tags: ["Algorithms", "Data Structures", "Advanced"],
    roomCode: "ADS-500-EX",
  },
  {
    id: "3",
    title: "World History: Ancient Civilizations",
    author: "Dr. Williams",
    institution: "Liberal Arts College",
    subject: "History",
    duration: 60,
    questionCount: 40,
    attempts: 2341,
    rating: 4.9,
    difficulty: "Medium",
    tags: ["History", "Ancient", "Civilizations"],
    roomCode: "HIST-ANC-01",
  },
  {
    id: "4",
    title: "Organic Chemistry Fundamentals",
    author: "Prof. Chen",
    institution: "Science Institute",
    subject: "Chemistry",
    duration: 75,
    questionCount: 45,
    attempts: 1105,
    rating: 4.3,
    difficulty: "Hard",
    tags: ["Chemistry", "Organic", "Science"],
    roomCode: "CHEM-ORG-F1",
  },
  {
    id: "5",
    title: "Business Communication Skills",
    author: "Dr. Martinez",
    institution: "Business School",
    subject: "Business",
    duration: 30,
    questionCount: 25,
    attempts: 3420,
    rating: 4.7,
    difficulty: "Easy",
    tags: ["Business", "Communication", "Soft Skills"],
    roomCode: "BUS-COM-101",
  },
  {
    id: "6",
    title: "Calculus I: Limits and Derivatives",
    author: "Prof. Anderson",
    institution: "Math Academy",
    subject: "Mathematics",
    duration: 60,
    questionCount: 35,
    attempts: 1876,
    rating: 4.4,
    difficulty: "Medium",
    tags: ["Mathematics", "Calculus", "STEM"],
    roomCode: "CALC-I-DRV",
  },
]

const subjects = [
  "All Subjects",
  "Computer Science",
  "History",
  "Chemistry",
  "Business",
  "Mathematics",
  "Physics",
  "Biology",
]
const difficulties = ["All Levels", "Easy", "Medium", "Hard"]

export default function PublicExamsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("All Subjects")
  const [selectedDifficulty, setSelectedDifficulty] = useState("All Levels")
  const [sortBy, setSortBy] = useState("popular")
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const filteredExams = mockExams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesSubject = selectedSubject === "All Subjects" || exam.subject === selectedSubject
    const matchesDifficulty = selectedDifficulty === "All Levels" || exam.difficulty === selectedDifficulty
    return matchesSearch && matchesSubject && matchesDifficulty
  })

  const sortedExams = [...filteredExams].sort((a, b) => {
    switch (sortBy) {
      case "popular":
        return b.attempts - a.attempts
      case "rating":
        return b.rating - a.rating
      case "newest":
        return 0
      default:
        return 0
    }
  })

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-600 bg-green-100"
      case "Medium":
        return "text-amber-600 bg-amber-100"
      case "Hard":
        return "text-red-600 bg-red-100"
      default:
        return "text-muted-foreground bg-muted"
    }
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
                placeholder="Search exams by title, author, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl neu-inset bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Filter className="w-4 h-4" />
                <span>Filters:</span>
              </div>

              {/* Subject Filter */}
              <div className="relative">
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 rounded-xl neu-button bg-transparent text-foreground text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {subjects.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Difficulty Filter */}
              <div className="relative">
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 rounded-xl neu-button bg-transparent text-foreground text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {difficulties.map((diff) => (
                    <option key={diff} value={diff}>
                      {diff}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Sort By */}
              <div className="relative ml-auto">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none px-4 py-2 pr-10 rounded-xl neu-button bg-transparent text-foreground text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="popular">Most Popular</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </NeuCard>

        {/* Results Count */}
        <p className="text-sm text-muted-foreground mb-4">
          Showing {sortedExams.length} exam{sortedExams.length !== 1 ? "s" : ""}
        </p>

        {/* Exam Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedExams.map((exam) => (
            <NeuCard key={exam.id} className="p-5 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getDifficultyColor(exam.difficulty)}`}>
                  {exam.difficulty}
                </span>
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-medium">{exam.rating}</span>
                </div>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-foreground mb-1 line-clamp-2">{exam.title}</h3>

              {/* Author */}
              <p className="text-sm text-muted-foreground mb-3">
                by {exam.author} • {exam.institution}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-2 mb-4">
                {exam.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="px-2 py-1 rounded-lg neu-flat text-xs text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{exam.duration} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  <span>{exam.questionCount} Qs</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{exam.attempts.toLocaleString()}</span>
                </div>
              </div>

              {/* Room Code & Actions */}
              <div className="mt-auto pt-4 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => handleCopyCode(exam.roomCode)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg neu-flat hover:bg-muted/50 transition-colors text-sm"
                  >
                    <code className="font-mono text-primary">{exam.roomCode}</code>
                    {copiedCode === exam.roomCode ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <Link href={`/join?code=${exam.roomCode}`}>
                    <NeuButton size="sm">Take Exam</NeuButton>
                  </Link>
                </div>
              </div>
            </NeuCard>
          ))}
        </div>

        {/* Empty State */}
        {sortedExams.length === 0 && (
          <NeuCard className="p-12 text-center">
            <div className="w-16 h-16 rounded-full neu-inset mx-auto mb-4 flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No exams found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
            <NeuButton
              variant="secondary"
              onClick={() => {
                setSearchQuery("")
                setSelectedSubject("All Subjects")
                setSelectedDifficulty("All Levels")
              }}
            >
              Clear Filters
            </NeuButton>
          </NeuCard>
        )}
      </main>
    </div>
  )
}
