'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { useExams } from '@/lib/hooks/use-exams'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { 
  Plus, 
  FileEdit, 
  Users, 
  BarChart3, 
  Eye, 
  Copy, 
  Trash2, 
  Globe, 
  Lock,
  Loader2,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function DashboardPage() {
  const { user, profile, loading: authLoading } = useAuth()
  const { exams, loading: examsLoading, deleteExam, fetchExams, pagination } = useExams()
  const [stats, setStats] = useState({
    totalExams: 0,
    activeExams: 0,
    totalSessions: 0,
    avgScore: 0
  })
  const [loadingStats, setLoadingStats] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    if (user) {
      loadStats()
    }
  }, [user, exams])

  const loadStats = async () => {
    try {
      const res = await fetch(`/api/analytics/dashboard`)
      if (res.ok) {
        const data = await res.json()
        setStats({
          totalExams: data.totalExams || 0,
          activeExams: data.activeExams || 0,
          totalSessions: data.totalSessions || 0,
          avgScore: data.avgScore || 0
        })
      }
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const handleCopyRoomCode = (roomCode: string) => {
    navigator.clipboard.writeText(roomCode)
    toast.success('Room code copied to clipboard!')
  }

  const handleDeleteExam = async (examId: string) => {
    if (confirm('Are you sure you want to delete this exam?')) {
      const success = await deleteExam(examId)
      if (success) {
        toast.success('Exam deleted successfully')
      } else {
        toast.error('Failed to delete exam')
      }
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Please sign in to access the dashboard</p>
          <Link href="/auth/login">
            <NeuButton className="mt-4">Sign In</NeuButton>
          </Link>
        </div>
      </div>
    )
  }

  if (profile?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Access denied. Teacher account required.</p>
        </div>
      </div>
    )
  }

  const statsData = [
    { 
      label: "Total Exams", 
      value: loadingStats ? "..." : stats.totalExams, 
      icon: FileEdit, 
      color: "text-blue-600" 
    },
    { 
      label: "Active Exams", 
      value: loadingStats ? "..." : stats.activeExams, 
      icon: Globe, 
      color: "text-green-600" 
    },
    { 
      label: "Total Attempts", 
      value: loadingStats ? "..." : stats.totalSessions, 
      icon: Users, 
      color: "text-purple-600" 
    },
    { 
      label: "Avg. Score", 
      value: loadingStats ? "..." : `${stats.avgScore}%`, 
      icon: BarChart3, 
      color: "text-orange-600" 
    },
  ]

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold  mb-2">
            Welcome, {profile?.full_name || user.email}
          </h1>
          <p className="">Manage your exams and track student performance</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <NeuCard key={index} className="p-6">
              <div className="flex items-center">
                <div className={`p-2 rounded-lg ${stat.color} bg-opacity-10 mr-4`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-sm font-medium ">{stat.label}</p>
                  <p className="text-2xl font-bold ">{stat.value}</p>
                </div>
              </div>
            </NeuCard>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold ">Your Exams</h2>
          <Link href="/dashboard/exams/new">
            <NeuButton>
              <Plus className="h-4 w-4 mr-2" />
              Create Exam
            </NeuButton>
          </Link>
        </div>

        {/* Exams List */}
        {examsLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Loading exams...</p>
          </div>
        ) : exams.length === 0 ? (
          <NeuCard className="text-center p-12">
            <FileEdit className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium  mb-2">No exams yet</h3>
            <p className="text-slate-500 mb-4">Create your first exam to get started</p>
            <Link href="/dashboard/exams/new">
              <NeuButton>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Exam
              </NeuButton>
            </Link>
          </NeuCard>
        ) : (
          <div className="grid gap-6">
            {exams.map((exam) => (
              <NeuCard key={exam.id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold ">{exam.title}</h3>
                      {exam.is_public ? (
                        <Globe className="h-4 w-4 text-green-600" />
                      ) : (
                        <Lock className="h-4 w-4 text-slate-400" />
                      )}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        exam.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {exam.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    {exam.description && (
                      <p className=" mb-3">{exam.description}</p>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span>{exam.total_questions} questions</span>
                      <span>{exam.duration_minutes} minutes</span>
                      <span>Passing: {exam.passing_score}%</span>
                      {exam.room_code && (
                        <button
                          onClick={() => handleCopyRoomCode(exam.room_code!)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                        >
                          <Copy className="h-3 w-3" />
                          Room: {exam.room_code}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/exams/${exam.id}`}>
                      <NeuButton variant="secondary" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </NeuButton>
                    </Link>
                    
                    <Link href={`/dashboard/exams/${exam.id}/monitor`}>
                      <NeuButton variant="secondary" size="sm">
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Monitor
                      </NeuButton>
                    </Link>
                    
                    <NeuButton
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDeleteExam(exam.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </NeuButton>
                  </div>
                </div>
              </NeuCard>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * pagination.limit + 1} to{' '}
              {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
              {pagination.total} exams
            </p>
            <div className="flex gap-2">
              <NeuButton
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => {
                  setCurrentPage(currentPage - 1)
                  fetchExams(currentPage - 1)
                }}
              >
                Previous
              </NeuButton>
              <NeuButton
                variant="secondary"
                size="sm"
                disabled={currentPage === pagination.pages}
                onClick={() => {
                  setCurrentPage(currentPage + 1)
                  fetchExams(currentPage + 1)
                }}
              >
                Next
              </NeuButton>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard/question-bank">
            <NeuCard className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <FileEdit className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h3 className="font-medium  mb-1">Question Bank</h3>
                <p className="text-sm ">Manage reusable questions</p>
              </div>
            </NeuCard>
          </Link>

          <Link href="/dashboard/analytics">
            <NeuCard className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-medium  mb-1">Analytics</h3>
                <p className="text-sm ">View detailed reports</p>
              </div>
            </NeuCard>
          </Link>

          <Link href="/dashboard/settings">
            <NeuCard className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="text-center">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                <h3 className="font-medium  mb-1">Settings</h3>
                <p className="text-sm ">Account preferences</p>
              </div>
            </NeuCard>
          </Link>
        </div>
      </div>
    </div>
  )
}