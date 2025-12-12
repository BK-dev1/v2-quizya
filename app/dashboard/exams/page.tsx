"use client"

import * as React from "react"
import Link from "next/link"
import { NeuCard } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuModal } from "@/components/ui/neu-modal"
import {
  Plus,
  Search,
  Globe,
  Lock,
  Play,
  Pause,
  MoreVertical,
  Eye,
  FileEdit,
  Copy,
  Trash2,
  Users,
  Clock,
} from "lucide-react"

const exams = [
  {
    id: 1,
    title: "Introduction to Computer Science - Midterm",
    questions: 25,
    duration: 60,
    status: "published",
    isPublic: false,
    roomCode: "ABC123",
    students: 45,
    avgScore: 82,
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    title: "Data Structures Quiz 3",
    questions: 15,
    duration: 30,
    status: "draft",
    isPublic: false,
    roomCode: "DEF456",
    students: 0,
    avgScore: null,
    createdAt: "2024-01-18",
  },
  {
    id: 3,
    title: "Algorithms Final Exam",
    questions: 40,
    duration: 120,
    status: "published",
    isPublic: true,
    roomCode: "GHI789",
    students: 52,
    avgScore: 74,
    createdAt: "2024-01-20",
  },
  {
    id: 4,
    title: "Python Basics Assessment",
    questions: 20,
    duration: 45,
    status: "published",
    isPublic: false,
    roomCode: "JKL012",
    students: 38,
    avgScore: 88,
    createdAt: "2024-01-22",
  },
  {
    id: 5,
    title: "Web Development Fundamentals",
    questions: 30,
    duration: 60,
    status: "draft",
    isPublic: false,
    roomCode: "MNO345",
    students: 0,
    avgScore: null,
    createdAt: "2024-01-25",
  },
]

export default function ExamsPage() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [statusFilter, setStatusFilter] = React.useState<"all" | "published" | "draft">("all")
  const [activeDropdown, setActiveDropdown] = React.useState<number | null>(null)
  const [deleteModal, setDeleteModal] = React.useState<number | null>(null)

  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || exam.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">My Exams</h1>
          <p className="text-muted-foreground">Manage and organize your exams</p>
        </div>
        <Link href="/dashboard/exams/new">
          <NeuButton className="gap-2">
            <Plus className="w-5 h-5" />
            Create Exam
          </NeuButton>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search exams..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-background neu-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="flex gap-2">
          <NeuButton
            variant={statusFilter === "all" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setStatusFilter("all")}
          >
            All
          </NeuButton>
          <NeuButton
            variant={statusFilter === "published" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setStatusFilter("published")}
          >
            Published
          </NeuButton>
          <NeuButton
            variant={statusFilter === "draft" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setStatusFilter("draft")}
          >
            Drafts
          </NeuButton>
        </div>
      </div>

      {/* Exam Cards */}
      {filteredExams.length === 0 ? (
        <NeuCard className="p-12 text-center">
          <p className="text-muted-foreground">No exams found. Create your first exam to get started!</p>
          <Link href="/dashboard/exams/new" className="inline-block mt-4">
            <NeuButton className="gap-2">
              <Plus className="w-5 h-5" />
              Create Exam
            </NeuButton>
          </Link>
        </NeuCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExams.map((exam) => (
            <NeuCard key={exam.id} className="flex flex-col">
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    {exam.isPublic ? (
                      <Globe className="w-4 h-4 text-success" />
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        exam.status === "published" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {exam.status === "published" ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                      {exam.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setActiveDropdown(activeDropdown === exam.id ? null : exam.id)}
                      className="p-1.5 rounded-lg hover:bg-muted"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeDropdown === exam.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-popover rounded-xl neu-card-sm p-1 z-10">
                        <Link
                          href={`/dashboard/exams/${exam.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                        <Link
                          href={`/dashboard/exams/${exam.id}/edit`}
                          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted"
                        >
                          <FileEdit className="w-4 h-4" />
                          Edit
                        </Link>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted">
                          <Copy className="w-4 h-4" />
                          Duplicate
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive"
                          onClick={() => {
                            setActiveDropdown(null)
                            setDeleteModal(exam.id)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="font-semibold text-lg mb-2 line-clamp-2">{exam.title}</h3>

                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1">
                    <FileEdit className="w-4 h-4" />
                    {exam.questions} questions
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {exam.duration} min
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <code className="px-2 py-1 bg-muted rounded font-mono">{exam.roomCode}</code>
                  {exam.students > 0 && (
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {exam.students}
                    </span>
                  )}
                </div>
              </div>

              {exam.avgScore !== null && (
                <div className="px-5 py-3 border-t border-border bg-muted/30">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avg. Score</span>
                    <span className="font-semibold">{exam.avgScore}%</span>
                  </div>
                </div>
              )}
            </NeuCard>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <NeuModal
        open={deleteModal !== null}
        onClose={() => setDeleteModal(null)}
        title="Delete Exam?"
        description="This action cannot be undone. All student submissions will also be deleted."
        variant="destructive"
        footer={
          <>
            <NeuButton variant="ghost" onClick={() => setDeleteModal(null)}>
              Cancel
            </NeuButton>
            <NeuButton variant="destructive" onClick={() => setDeleteModal(null)}>
              Delete Exam
            </NeuButton>
          </>
        }
      />
    </div>
  )
}
