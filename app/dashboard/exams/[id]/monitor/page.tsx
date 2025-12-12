"use client"

import * as React from "react"
import Link from "next/link"
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from "@/components/ui/neu-card"
import { NeuButton } from "@/components/ui/neu-button"
import { NeuModal } from "@/components/ui/neu-modal"
import {
  ArrowLeft,
  Users,
  AlertTriangle,
  Clock,
  Eye,
  MessageSquare,
  RefreshCw,
  User,
  Monitor,
  MonitorOff,
  XCircle,
} from "lucide-react"

interface Student {
  id: number
  name: string
  email: string
  status: "in-exam" | "left-fullscreen" | "focus-lost" | "submitted" | "not-started"
  currentQuestion: number
  timeSpent: number
  infractions: number
  infractionHistory: { type: string; timestamp: string }[]
  progress: number
}

const mockStudents: Student[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@school.edu",
    status: "in-exam",
    currentQuestion: 8,
    timeSpent: 32,
    infractions: 0,
    infractionHistory: [],
    progress: 80,
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@school.edu",
    status: "left-fullscreen",
    currentQuestion: 5,
    timeSpent: 25,
    infractions: 2,
    infractionHistory: [
      { type: "Left fullscreen", timestamp: "10:32 AM" },
      { type: "Focus lost", timestamp: "10:28 AM" },
    ],
    progress: 50,
  },
  {
    id: 3,
    name: "Carol Davis",
    email: "carol@school.edu",
    status: "in-exam",
    currentQuestion: 10,
    timeSpent: 45,
    infractions: 0,
    infractionHistory: [],
    progress: 100,
  },
  {
    id: 4,
    name: "David Wilson",
    email: "david@school.edu",
    status: "focus-lost",
    currentQuestion: 3,
    timeSpent: 15,
    infractions: 3,
    infractionHistory: [
      { type: "Tab switch", timestamp: "10:35 AM" },
      { type: "Focus lost", timestamp: "10:30 AM" },
      { type: "Left fullscreen", timestamp: "10:22 AM" },
    ],
    progress: 30,
  },
  {
    id: 5,
    name: "Emma Brown",
    email: "emma@school.edu",
    status: "submitted",
    currentQuestion: 10,
    timeSpent: 42,
    infractions: 1,
    infractionHistory: [{ type: "Focus lost", timestamp: "10:20 AM" }],
    progress: 100,
  },
  {
    id: 6,
    name: "Frank Miller",
    email: "frank@school.edu",
    status: "not-started",
    currentQuestion: 0,
    timeSpent: 0,
    infractions: 0,
    infractionHistory: [],
    progress: 0,
  },
]

const statusConfig = {
  "in-exam": { label: "In Exam", color: "bg-success/10 text-success", icon: Monitor },
  "left-fullscreen": { label: "Left Fullscreen", color: "bg-warning/10 text-warning", icon: MonitorOff },
  "focus-lost": { label: "Focus Lost", color: "bg-destructive/10 text-destructive", icon: XCircle },
  submitted: { label: "Submitted", color: "bg-primary/10 text-primary", icon: Eye },
  "not-started": { label: "Not Started", color: "bg-muted text-muted-foreground", icon: Clock },
}

export default function LiveMonitorPage() {
  const [students] = React.useState(mockStudents)
  const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null)
  const [showMessageModal, setShowMessageModal] = React.useState(false)
  const [messageStudent, setMessageStudent] = React.useState<Student | null>(null)
  const [message, setMessage] = React.useState("")

  const activeStudents = students.filter((s) => s.status === "in-exam").length
  const submittedStudents = students.filter((s) => s.status === "submitted").length
  const totalInfractions = students.reduce((acc, s) => acc + s.infractions, 0)

  const sendMessage = () => {
    // Simulate sending message
    setShowMessageModal(false)
    setMessage("")
    setMessageStudent(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/exams">
            <NeuButton variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
            </NeuButton>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Live Monitoring</h1>
            <p className="text-muted-foreground">Introduction to Computer Science - Midterm</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            Live
          </span>
          <NeuButton variant="secondary" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </NeuButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <NeuCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{students.length}</p>
              <p className="text-xs text-muted-foreground">Total Students</p>
            </div>
          </div>
        </NeuCard>

        <NeuCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <Monitor className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold">{activeStudents}</p>
              <p className="text-xs text-muted-foreground">Active Now</p>
            </div>
          </div>
        </NeuCard>

        <NeuCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent/10">
              <Eye className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold">{submittedStudents}</p>
              <p className="text-xs text-muted-foreground">Submitted</p>
            </div>
          </div>
        </NeuCard>

        <NeuCard className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{totalInfractions}</p>
              <p className="text-xs text-muted-foreground">Total Infractions</p>
            </div>
          </div>
        </NeuCard>
      </div>

      {/* Student List */}
      <NeuCard>
        <NeuCardHeader>
          <NeuCardTitle>Students</NeuCardTitle>
        </NeuCardHeader>
        <NeuCardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Student</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    Progress
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground hidden lg:table-cell">
                    Time
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Infractions</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const StatusIcon = statusConfig[student.status].icon
                  return (
                    <tr key={student.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            <p className="text-xs text-muted-foreground hidden sm:block">{student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig[student.status].color}`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {statusConfig[student.status].label}
                        </span>
                      </td>
                      <td className="py-4 px-4 hidden md:table-cell">
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 hidden lg:table-cell">
                        <span className="text-sm">{student.timeSpent} min</span>
                      </td>
                      <td className="py-4 px-4">
                        {student.infractions > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                            <AlertTriangle className="w-3 h-3" />
                            {student.infractions}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center justify-end gap-2">
                          <NeuButton variant="ghost" size="sm" onClick={() => setSelectedStudent(student)}>
                            <Eye className="w-4 h-4" />
                          </NeuButton>
                          <NeuButton
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setMessageStudent(student)
                              setShowMessageModal(true)
                            }}
                          >
                            <MessageSquare className="w-4 h-4" />
                          </NeuButton>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </NeuCardContent>
      </NeuCard>

      {/* Student Detail Modal */}
      <NeuModal
        open={!!selectedStudent}
        onClose={() => setSelectedStudent(null)}
        title={selectedStudent?.name || ""}
        description={selectedStudent?.email}
        className="max-w-lg"
      >
        {selectedStudent && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground">Current Question</p>
                <p className="text-lg font-semibold">{selectedStudent.currentQuestion}/10</p>
              </div>
              <div className="p-3 rounded-xl bg-muted/50">
                <p className="text-xs text-muted-foreground">Time Spent</p>
                <p className="text-lg font-semibold">{selectedStudent.timeSpent} min</p>
              </div>
            </div>

            {selectedStudent.infractionHistory.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  Infraction History
                </h4>
                <div className="space-y-2">
                  {selectedStudent.infractionHistory.map((infraction, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5">
                      <span className="text-sm">{infraction.type}</span>
                      <span className="text-xs text-muted-foreground">{infraction.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </NeuModal>

      {/* Message Modal */}
      <NeuModal
        open={showMessageModal}
        onClose={() => setShowMessageModal(false)}
        title={`Message ${messageStudent?.name || ""}`}
        description="Send a quick message to this student"
        footer={
          <>
            <NeuButton variant="ghost" onClick={() => setShowMessageModal(false)}>
              Cancel
            </NeuButton>
            <NeuButton onClick={sendMessage} disabled={!message.trim()}>
              Send Message
            </NeuButton>
          </>
        }
      >
        <textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-background neu-input placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
        />
      </NeuModal>
    </div>
  )
}
