"use client"

import * as React from "react"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuModal } from "@/components/ui/neu-modal"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  FileQuestion,
  Download,
  Filter,
  ChevronDown,
  Star,
  CheckCircle,
  XCircle,
  Save,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts"

const examResults = [
  { name: "Q1", passRate: 85, avgTime: 45 },
  { name: "Q2", passRate: 72, avgTime: 62 },
  { name: "Q3", passRate: 91, avgTime: 38 },
  { name: "Q4", passRate: 65, avgTime: 78 },
  { name: "Q5", passRate: 88, avgTime: 52 },
  { name: "Q6", passRate: 45, avgTime: 95 },
  { name: "Q7", passRate: 78, avgTime: 68 },
  { name: "Q8", passRate: 82, avgTime: 55 },
  { name: "Q9", passRate: 69, avgTime: 72 },
  { name: "Q10", passRate: 94, avgTime: 35 },
]

const scoreDistribution = [
  { range: "0-20%", count: 2 },
  { range: "21-40%", count: 5 },
  { range: "41-60%", count: 12 },
  { range: "61-80%", count: 18 },
  { range: "81-100%", count: 8 },
]

const performanceTrend = [
  { exam: "Quiz 1", avgScore: 72 },
  { exam: "Quiz 2", avgScore: 78 },
  { exam: "Midterm", avgScore: 74 },
  { exam: "Quiz 3", avgScore: 82 },
  { exam: "Final", avgScore: 79 },
]

const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#0ea5e9"]

const topPerformers = [
  { name: "Carol Davis", score: 98, time: 42 },
  { name: "Alice Johnson", score: 95, time: 48 },
  { name: "Emma Brown", score: 92, time: 51 },
]

const needsImprovement = [
  { name: "David Wilson", score: 45, time: 58 },
  { name: "Frank Miller", score: 52, time: 55 },
  { name: "Grace Lee", score: 58, time: 52 },
]

const essaySubmissions = [
  {
    id: 1,
    studentName: "Alice Johnson",
    question: "Explain the difference between process and thread...",
    answer:
      "A process is an independent execution unit with its own memory space, while a thread is a lightweight unit within a process that shares the same memory. Processes are isolated from each other, providing security and stability, but inter-process communication is slower. Threads within the same process can communicate more easily through shared memory but require careful synchronization to avoid race conditions...",
    autoScore: 8,
    maxScore: 10,
    graded: false,
  },
  {
    id: 2,
    studentName: "Bob Smith",
    question: "Explain the difference between process and thread...",
    answer:
      "Process and thread are both ways to run code. A process runs separately while threads share memory. Threads are faster to create than processes.",
    autoScore: 5,
    maxScore: 10,
    graded: false,
  },
  {
    id: 3,
    studentName: "Carol Davis",
    question: "Explain the difference between process and thread...",
    answer:
      "In operating systems, processes and threads serve different purposes. A process represents a complete program execution environment with dedicated resources including memory, file handles, and security context. Threads are execution units within processes that share these resources. For example, a web browser might be a single process containing multiple threads for rendering, networking, and JavaScript execution...",
    autoScore: 9,
    maxScore: 10,
    graded: true,
    finalScore: 10,
    feedback: "Excellent explanation with practical examples.",
  },
]

export default function AnalyticsPage() {
  const [selectedExam, setSelectedExam] = React.useState("Introduction to Computer Science - Midterm")
  const [showExportModal, setShowExportModal] = React.useState(false)
  const [showGradeModal, setShowGradeModal] = React.useState(false)
  const [selectedEssay, setSelectedEssay] = React.useState<(typeof essaySubmissions)[0] | null>(null)
  const [gradeInput, setGradeInput] = React.useState("")
  const [feedbackInput, setFeedbackInput] = React.useState("")
  const [exportFormat, setExportFormat] = React.useState<"csv" | "pdf" | "excel">("csv")

  const openGradeModal = (essay: (typeof essaySubmissions)[0]) => {
    setSelectedEssay(essay)
    setGradeInput(essay.finalScore?.toString() || essay.autoScore.toString())
    setFeedbackInput(essay.feedback || "")
    setShowGradeModal(true)
  }

  const handleSaveGrade = () => {
    // Simulate saving grade
    setShowGradeModal(false)
    setSelectedEssay(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold">Analytics & Results</h1>
          <p className="text-muted-foreground">View exam performance and grade essays</p>
        </div>
        <div className="flex items-center gap-3">
          <NeuButton variant="secondary" className="gap-2">
            <Filter className="w-4 h-4" />
            Filter
            <ChevronDown className="w-4 h-4" />
          </NeuButton>
          <NeuButton onClick={() => setShowExportModal(true)} className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </NeuButton>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <NeuCard className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Score</p>
              <p className="text-3xl font-bold mt-1">78%</p>
              <p className="text-xs text-success flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +5% from last exam
              </p>
            </div>
            <div className="p-3 rounded-xl bg-primary/10">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
          </div>
        </NeuCard>

        <NeuCard className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Highest Score</p>
              <p className="text-3xl font-bold mt-1">98%</p>
              <p className="text-xs text-muted-foreground mt-1">Carol Davis</p>
            </div>
            <div className="p-3 rounded-xl bg-success/10">
              <Star className="w-5 h-5 text-success" />
            </div>
          </div>
        </NeuCard>

        <NeuCard className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Lowest Score</p>
              <p className="text-3xl font-bold mt-1">45%</p>
              <p className="text-xs text-destructive flex items-center gap-1 mt-1">
                <TrendingDown className="w-3 h-3" />
                Needs attention
              </p>
            </div>
            <div className="p-3 rounded-xl bg-destructive/10">
              <TrendingDown className="w-5 h-5 text-destructive" />
            </div>
          </div>
        </NeuCard>

        <NeuCard className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Submissions</p>
              <p className="text-3xl font-bold mt-1">45</p>
              <p className="text-xs text-muted-foreground mt-1">of 48 enrolled</p>
            </div>
            <div className="p-3 rounded-xl bg-accent/10">
              <Users className="w-5 h-5 text-accent" />
            </div>
          </div>
        </NeuCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Question Performance */}
        <NeuCard>
          <NeuCardHeader>
            <NeuCardTitle className="flex items-center gap-2">
              <FileQuestion className="w-5 h-5" />
              Question Performance
            </NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examResults}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="passRate" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Pass rate (%) by question</p>
          </NeuCardContent>
        </NeuCard>

        {/* Score Distribution */}
        <NeuCard>
          <NeuCardHeader>
            <NeuCardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Score Distribution
            </NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent>
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    label={({ range }) => range}
                  >
                    {scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </NeuCardContent>
        </NeuCard>
      </div>

      {/* Performance Trend & Top/Bottom Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Trend */}
        <NeuCard className="lg:col-span-2">
          <NeuCardHeader>
            <NeuCardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Trend
            </NeuCardTitle>
          </NeuCardHeader>
          <NeuCardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="exam" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--background)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                  />
                  <Line type="monotone" dataKey="avgScore" stroke="var(--primary)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </NeuCardContent>
        </NeuCard>

        {/* Top & Bottom Performers */}
        <div className="space-y-6">
          <NeuCard>
            <NeuCardHeader className="pb-2">
              <NeuCardTitle className="text-base flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                Top Performers
              </NeuCardTitle>
            </NeuCardHeader>
            <NeuCardContent className="space-y-3">
              {topPerformers.map((student, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-success/10 text-success text-xs flex items-center justify-center font-medium">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{student.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-success">{student.score}%</span>
                </div>
              ))}
            </NeuCardContent>
          </NeuCard>

          <NeuCard>
            <NeuCardHeader className="pb-2">
              <NeuCardTitle className="text-base flex items-center gap-2">
                <XCircle className="w-4 h-4 text-destructive" />
                Needs Improvement
              </NeuCardTitle>
            </NeuCardHeader>
            <NeuCardContent className="space-y-3">
              {needsImprovement.map((student, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm">{student.name}</span>
                  <span className="text-sm font-semibold text-destructive">{student.score}%</span>
                </div>
              ))}
            </NeuCardContent>
          </NeuCard>
        </div>
      </div>

      {/* Essay Grading */}
      <NeuCard>
        <NeuCardHeader className="flex-row items-center justify-between">
          <NeuCardTitle className="flex items-center gap-2">
            <FileQuestion className="w-5 h-5" />
            Essay Submissions (Manual Grading)
          </NeuCardTitle>
          <span className="text-sm text-muted-foreground">
            {essaySubmissions.filter((e) => !e.graded).length} pending
          </span>
        </NeuCardHeader>
        <NeuCardContent>
          <div className="space-y-4">
            {essaySubmissions.map((essay) => (
              <div key={essay.id} className="p-4 rounded-xl bg-muted/30 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium">{essay.studentName}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{essay.question}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {essay.graded ? (
                      <span className="px-2 py-1 bg-success/10 text-success text-xs rounded-full">
                        Graded: {essay.finalScore}/{essay.maxScore}
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-warning/10 text-warning text-xs rounded-full">
                        Auto: {essay.autoScore}/{essay.maxScore}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{essay.answer}</p>
                <NeuButton variant="secondary" size="sm" onClick={() => openGradeModal(essay)}>
                  {essay.graded ? "Edit Grade" : "Grade Now"}
                </NeuButton>
              </div>
            ))}
          </div>
        </NeuCardContent>
      </NeuCard>

      {/* Export Modal */}
      <NeuModal
        open={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Export Results"
        description="Choose your export format and options"
        footer={
          <>
            <NeuButton variant="ghost" onClick={() => setShowExportModal(false)}>
              Cancel
            </NeuButton>
            <NeuButton onClick={() => setShowExportModal(false)} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </NeuButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <div className="flex gap-2">
              {(["csv", "pdf", "excel"] as const).map((format) => (
                <NeuButton
                  key={format}
                  variant={exportFormat === format ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setExportFormat(format)}
                >
                  {format.toUpperCase()}
                </NeuButton>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Include</label>
            <div className="space-y-2">
              {["Student scores", "Question analytics", "Time analysis", "Infraction reports"].map((option) => (
                <label key={option} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-border" />
                  <span className="text-sm">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </NeuModal>

      {/* Grade Essay Modal */}
      <NeuModal
        open={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        title="Grade Essay"
        description={selectedEssay?.studentName}
        className="max-w-2xl"
        footer={
          <>
            <NeuButton variant="ghost" onClick={() => setShowGradeModal(false)}>
              Cancel
            </NeuButton>
            <NeuButton onClick={handleSaveGrade} className="gap-2">
              <Save className="w-4 h-4" />
              Save Grade
            </NeuButton>
          </>
        }
      >
        {selectedEssay && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-muted/30">
              <p className="text-sm font-medium mb-2">Question</p>
              <p className="text-sm text-muted-foreground">{selectedEssay.question}</p>
            </div>

            <div className="p-4 rounded-xl bg-muted/30 max-h-48 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Student Answer</p>
              <p className="text-sm">{selectedEssay.answer}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Auto-suggested Score</label>
                <div className="p-3 rounded-lg bg-muted text-center">
                  <span className="text-2xl font-bold">{selectedEssay.autoScore}</span>
                  <span className="text-muted-foreground">/{selectedEssay.maxScore}</span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Score</label>
                <input
                  type="number"
                  min={0}
                  max={selectedEssay.maxScore}
                  value={gradeInput}
                  onChange={(e) => setGradeInput(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl bg-background neu-input text-center text-xl font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback (optional)</label>
              <textarea
                placeholder="Add feedback for the student..."
                value={feedbackInput}
                onChange={(e) => setFeedbackInput(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-background neu-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>
        )}
      </NeuModal>
    </div>
  )
}
