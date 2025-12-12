"use client"

import * as React from "react"
import Link from "next/link"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import {
  FileEdit,
  Users,
  BarChart3,
  Plus,
  Eye,
  Copy,
  Trash2,
  MoreVertical,
  Globe,
  Lock,
  Play,
  Pause,
} from "lucide-react"

const stats = [
  { label: "Total Exams", value: 12, icon: FileEdit, color: "text-primary" },
  { label: "Active Exams", value: 3, icon: Play, color: "text-success" },
  { label: "Total Students", value: 248, icon: Users, color: "text-accent" },
  { label: "Avg. Score", value: "78%", icon: BarChart3, color: "text-warning" },
]

const recentExams = [
  {
    id: 1,
    title: "Introduction to Computer Science - Midterm",
    questions: 25,
    duration: "60 min",
    status: "published",
    isPublic: false,
    roomCode: "ABC123",
    students: 45,
    avgScore: 82,
  },
  {
    id: 2,
    title: "Data Structures Quiz 3",
    questions: 15,
    duration: "30 min",
    status: "draft",
    isPublic: false,
    roomCode: "DEF456",
    students: 0,
    avgScore: null,
  },
  {
    id: 3,
    title: "Algorithms Final Exam",
    questions: 40,
    duration: "120 min",
    status: "published",
    isPublic: true,
    roomCode: "GHI789",
    students: 52,
    avgScore: 74,
  },
  {
    id: 4,
    title: "Python Basics Assessment",
    questions: 20,
    duration: "45 min",
    status: "published",
    isPublic: false,
    roomCode: "JKL012",
    students: 38,
    avgScore: 88,
  },
]

export default function DashboardPage() {
  const [activeDropdown, setActiveDropdown] = React.useState<number | null>(null)

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Welcome back, John!</h1>
          <p className="text-muted-foreground">Here&apos;s what&apos;s happening with your exams.</p>
        </div>
        <Link href="/dashboard/exams/new">
          <NeuButton className="gap-2">
            <Plus className="w-5 h-5" />
            Create Exam
          </NeuButton>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {stats.map((stat) => (
          <NeuCard key={stat.label} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl lg:text-3xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
          </NeuCard>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/dashboard/exams/new">
          <NeuCard className="p-5 hover:scale-[1.02] transition-transform cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Create Exam</h3>
                <p className="text-sm text-muted-foreground">Start building a new exam</p>
              </div>
            </div>
          </NeuCard>
        </Link>

        <Link href="/dashboard/analytics">
          <NeuCard className="p-5 hover:scale-[1.02] transition-transform cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-success/10 group-hover:bg-success/20 transition-colors">
                <BarChart3 className="w-6 h-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold">View Results</h3>
                <p className="text-sm text-muted-foreground">Analyze student performance</p>
              </div>
            </div>
          </NeuCard>
        </Link>

        <Link href="/dashboard/question-bank">
          <NeuCard className="p-5 hover:scale-[1.02] transition-transform cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-accent/10 group-hover:bg-accent/20 transition-colors">
                <Eye className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Question Bank</h3>
                <p className="text-sm text-muted-foreground">Browse public exams</p>
              </div>
            </div>
          </NeuCard>
        </Link>
      </div>

      {/* Recent Exams */}
      <NeuCard>
        <NeuCardHeader className="flex-row items-center justify-between">
          <NeuCardTitle>Recent Exams</NeuCardTitle>
          <Link href="/dashboard/exams">
            <NeuButton variant="ghost" size="sm">
              View All
            </NeuButton>
          </Link>
        </NeuCardHeader>
        <NeuCardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Exam</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Questions
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Duration
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                    Room Code
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Students
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentExams.map((exam) => (
                  <tr key={exam.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          {exam.isPublic ? (
                            <Globe className="w-4 h-4 text-success" aria-label="Public exam" />
                          ) : (
                            <Lock className="w-4 h-4 text-muted-foreground" aria-label="Private exam" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium line-clamp-1">{exam.title}</p>
                          <p className="text-xs text-muted-foreground md:hidden">
                            {exam.questions} questions • {exam.duration}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 hidden md:table-cell">{exam.questions}</td>
                    <td className="py-4 px-4 hidden lg:table-cell">{exam.duration}</td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                          exam.status === "published" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {exam.status === "published" ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                        {exam.status === "published" ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="py-4 px-4 hidden sm:table-cell">
                      <code className="px-2 py-1 bg-muted rounded text-sm font-mono">{exam.roomCode}</code>
                    </td>
                    <td className="py-4 px-4 hidden lg:table-cell">{exam.students}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <div className="relative">
                          <button
                            onClick={() => setActiveDropdown(activeDropdown === exam.id ? null : exam.id)}
                            className="p-2 rounded-lg hover:bg-muted"
                            aria-label="More actions"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {activeDropdown === exam.id && (
                            <div className="absolute right-0 top-full mt-1 w-40 bg-popover rounded-xl neu-card-sm p-1 z-10">
                              <Link
                                href={`/dashboard/exams/${exam.id}`}
                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </Link>
                              <Link
                                href={`/dashboard/exams/${exam.id}/edit`}
                                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <FileEdit className="w-4 h-4" />
                                Edit
                              </Link>
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-muted"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <Copy className="w-4 h-4" />
                                Duplicate
                              </button>
                              <button
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive"
                                onClick={() => setActiveDropdown(null)}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </NeuCardContent>
      </NeuCard>
    </div>
  )
}
