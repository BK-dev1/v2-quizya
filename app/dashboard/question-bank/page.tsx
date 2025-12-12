"use client"

import * as React from "react"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent, NeuCardFooter } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuModal } from "@/components/ui/neu-modal"
import { NeuToast } from "@/components/ui/neu-toast"
import { Search, Filter, Heart, Calendar, FileQuestion, Download, Eye, ChevronDown, AlertTriangle } from "lucide-react"

const publicExams = [
  {
    id: 1,
    title: "Intro to Machine Learning Basics",
    author: "Dr. Emily Chen",
    authorAvatar: "EC",
    subject: "Computer Science",
    questions: 30,
    createdAt: "2024-01-15",
    likes: 142,
    isLiked: false,
    description: "Covers supervised and unsupervised learning, neural networks basics, and common ML algorithms.",
    previewQuestions: [
      { text: "What is the primary goal of supervised learning?", type: "MCQ" },
      { text: "Neural networks are inspired by biological neurons. True or False?", type: "True/False" },
      { text: "Explain the concept of overfitting in machine learning.", type: "Short Answer" },
    ],
  },
  {
    id: 2,
    title: "Calculus I Final Review",
    author: "Prof. Michael Smith",
    authorAvatar: "MS",
    subject: "Mathematics",
    questions: 45,
    createdAt: "2024-01-12",
    likes: 89,
    isLiked: true,
    description: "Comprehensive review covering limits, derivatives, integrals, and their applications.",
    previewQuestions: [
      { text: "Calculate the derivative of f(x) = x³ + 2x² - 5x + 3", type: "Short Answer" },
      { text: "The integral of a constant is always zero. True or False?", type: "True/False" },
      { text: "Which rule would you use to differentiate f(x) = sin(x²)?", type: "MCQ" },
    ],
  },
  {
    id: 3,
    title: "World History: Ancient Civilizations",
    author: "Dr. Sarah Johnson",
    authorAvatar: "SJ",
    subject: "History",
    questions: 25,
    createdAt: "2024-01-20",
    likes: 67,
    isLiked: false,
    description: "Explores ancient Egypt, Mesopotamia, Greece, and Rome through key events and figures.",
    previewQuestions: [
      { text: "Which ancient civilization built the pyramids at Giza?", type: "MCQ" },
      { text: "The Roman Empire fell in 476 AD. True or False?", type: "True/False" },
      { text: "Describe the significance of the Code of Hammurabi.", type: "Essay" },
    ],
  },
  {
    id: 4,
    title: "Organic Chemistry Fundamentals",
    author: "Prof. David Lee",
    authorAvatar: "DL",
    subject: "Chemistry",
    questions: 35,
    createdAt: "2024-01-18",
    likes: 103,
    isLiked: false,
    description: "Covers functional groups, reaction mechanisms, stereochemistry, and nomenclature.",
    previewQuestions: [
      { text: "What is the IUPAC name for CH₃CH₂CH₂OH?", type: "Short Answer" },
      { text: "Enantiomers have identical physical properties. True or False?", type: "True/False" },
      { text: "Which functional group is present in aldehydes?", type: "MCQ" },
    ],
  },
  {
    id: 5,
    title: "Introduction to Psychology",
    author: "Dr. Lisa Martinez",
    authorAvatar: "LM",
    subject: "Psychology",
    questions: 40,
    createdAt: "2024-01-22",
    likes: 156,
    isLiked: true,
    description: "Basic concepts in psychology including cognition, behavior, development, and mental health.",
    previewQuestions: [
      { text: "Who is considered the father of psychoanalysis?", type: "MCQ" },
      { text: "Classical conditioning was discovered by Pavlov. True or False?", type: "True/False" },
      { text: "Explain the difference between short-term and long-term memory.", type: "Essay" },
    ],
  },
  {
    id: 6,
    title: "Data Structures and Algorithms",
    author: "Prof. Robert Kim",
    authorAvatar: "RK",
    subject: "Computer Science",
    questions: 50,
    createdAt: "2024-01-25",
    likes: 234,
    isLiked: false,
    description: "Comprehensive coverage of arrays, linked lists, trees, graphs, sorting, and searching algorithms.",
    previewQuestions: [
      { text: "What is the time complexity of binary search?", type: "MCQ" },
      { text: "A stack follows FIFO principle. True or False?", type: "True/False" },
      { text: "Implement a function to reverse a linked list.", type: "Essay" },
    ],
  },
]

const subjects = ["All Subjects", "Computer Science", "Mathematics", "History", "Chemistry", "Psychology", "Physics"]

export default function QuestionBankPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedSubject, setSelectedSubject] = React.useState("All Subjects")
  const [showFilters, setShowFilters] = React.useState(false)
  const [sortBy, setSortBy] = React.useState<"newest" | "popular">("popular")
  const [exams, setExams] = React.useState(publicExams)
  const [previewExam, setPreviewExam] = React.useState<(typeof publicExams)[0] | null>(null)
  const [importWarning, setImportWarning] = React.useState<number | null>(null)
  const [toast, setToast] = React.useState<{ message: string; variant: "success" | "error" | "warning" } | null>(null)

  const toggleLike = (id: number) => {
    setExams(
      exams.map((exam) =>
        exam.id === id
          ? { ...exam, isLiked: !exam.isLiked, likes: exam.isLiked ? exam.likes - 1 : exam.likes + 1 }
          : exam,
      ),
    )
  }

  const handleImport = (exam: (typeof publicExams)[0]) => {
    setImportWarning(null)
    setPreviewExam(null)
    setToast({ message: `"${exam.title}" imported to your exams!`, variant: "success" })
    setTimeout(() => setToast(null), 3000)
  }

  const filteredExams = exams
    .filter((exam) => {
      const matchesSearch =
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.author.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSubject = selectedSubject === "All Subjects" || exam.subject === selectedSubject
      return matchesSearch && matchesSubject
    })
    .sort((a, b) => {
      if (sortBy === "popular") return b.likes - a.likes
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Question Bank</h1>
        <p className="text-muted-foreground">Browse and import public exams from other teachers</p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search exams or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-background neu-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <NeuButton variant="secondary" onClick={() => setShowFilters(!showFilters)} className="gap-2">
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </NeuButton>
        </div>

        {showFilters && (
          <NeuCard className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject) => (
                    <NeuButton
                      key={subject}
                      variant={selectedSubject === subject ? "primary" : "secondary"}
                      size="sm"
                      onClick={() => setSelectedSubject(subject)}
                    >
                      {subject}
                    </NeuButton>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort By</label>
                <div className="flex gap-2">
                  <NeuButton
                    variant={sortBy === "popular" ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setSortBy("popular")}
                  >
                    Most Popular
                  </NeuButton>
                  <NeuButton
                    variant={sortBy === "newest" ? "primary" : "secondary"}
                    size="sm"
                    onClick={() => setSortBy("newest")}
                  >
                    Newest
                  </NeuButton>
                </div>
              </div>
            </div>
          </NeuCard>
        )}
      </div>

      {/* Results Count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredExams.length} {filteredExams.length === 1 ? "exam" : "exams"}
      </p>

      {/* Exam Cards */}
      {filteredExams.length === 0 ? (
        <NeuCard className="p-12 text-center">
          <p className="text-muted-foreground">No exams found matching your criteria.</p>
        </NeuCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <NeuCard key={exam.id} className="flex flex-col">
              <NeuCardHeader>
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {exam.subject}
                  </span>
                  <button
                    onClick={() => toggleLike(exam.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      exam.isLiked ? "text-destructive bg-destructive/10" : "text-muted-foreground hover:bg-muted"
                    }`}
                    aria-label={exam.isLiked ? "Unlike" : "Like"}
                  >
                    <Heart className={`w-5 h-5 ${exam.isLiked ? "fill-current" : ""}`} />
                  </button>
                </div>
                <NeuCardTitle className="text-lg line-clamp-2">{exam.title}</NeuCardTitle>
              </NeuCardHeader>

              <NeuCardContent className="flex-1 space-y-4">
                <p className="text-sm text-muted-foreground line-clamp-2">{exam.description}</p>

                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-semibold text-primary">{exam.authorAvatar}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium">{exam.author}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileQuestion className="w-4 h-4" />
                    {exam.questions} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    {exam.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(exam.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </NeuCardContent>

              <NeuCardFooter className="gap-2">
                <NeuButton variant="secondary" size="sm" className="flex-1 gap-1" onClick={() => setPreviewExam(exam)}>
                  <Eye className="w-4 h-4" />
                  Preview
                </NeuButton>
                <NeuButton size="sm" className="flex-1 gap-1" onClick={() => setImportWarning(exam.id)}>
                  <Download className="w-4 h-4" />
                  Import
                </NeuButton>
              </NeuCardFooter>
            </NeuCard>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewExam && (
        <NeuModal
          open={!!previewExam}
          onClose={() => setPreviewExam(null)}
          title={previewExam.title}
          description={`By ${previewExam.author} • ${previewExam.questions} questions`}
          className="max-w-2xl"
          footer={
            <>
              <NeuButton variant="ghost" onClick={() => setPreviewExam(null)}>
                Close
              </NeuButton>
              <NeuButton onClick={() => setImportWarning(previewExam.id)} className="gap-2">
                <Download className="w-4 h-4" />
                Import to My Exams
              </NeuButton>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">{previewExam.description}</p>

            <div className="space-y-3">
              <h4 className="font-medium">Sample Questions</h4>
              {previewExam.previewQuestions.map((q, i) => (
                <div key={i} className="p-4 rounded-xl bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm">
                      <span className="font-medium">{i + 1}.</span> {q.text}
                    </p>
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full whitespace-nowrap">
                      {q.type}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </NeuModal>
      )}

      {/* Import Warning Modal */}
      <NeuModal
        open={importWarning !== null}
        onClose={() => setImportWarning(null)}
        title="Import Public Exam?"
        description="This will create a copy of this exam in your account. You can modify it as needed."
        variant="warning"
        footer={
          <>
            <NeuButton variant="ghost" onClick={() => setImportWarning(null)}>
              Cancel
            </NeuButton>
            <NeuButton onClick={() => handleImport(exams.find((e) => e.id === importWarning)!)}>
              Yes, Import Exam
            </NeuButton>
          </>
        }
      >
        <div className="flex items-start gap-3 p-3 rounded-xl bg-warning/10">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <p className="text-sm text-warning-foreground">
            Make sure to review and customize the questions before publishing to your students.
          </p>
        </div>
      </NeuModal>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <NeuToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
        </div>
      )}
    </div>
  )
}
