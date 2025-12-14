'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { NeuCard, NeuCardHeader, NeuCardTitle, NeuCardContent } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuInput } from '@/components/ui/neu-input'
import { ArrowLeft, Edit, Trash2, Share2, Eye, Copy, Check, Loader2, Globe, Lock, BarChart3, Users } from 'lucide-react'
import { toast } from 'sonner'

interface Question {
  id: string
  question_text: string
  question_type: string
  options?: string[]
  correct_answer: string
  order_index: number
  points: number
}

interface Exam {
  id: string
  title: string
  description: string
  duration_minutes: number
  total_questions: number
  passing_score: number
  is_public: boolean
  is_active: boolean
  room_code: string
  shuffle_questions: boolean
  show_results_immediately: boolean
  created_at: string
  updated_at: string
  created_by: string
}

export default function ExamDetailPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params.id as string

  const [exam, setExam] = useState<Exam | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const [editData, setEditData] = useState({
    title: '',
    description: '',
    duration_minutes: 60,
    passing_score: 70,
  })

  useEffect(() => {
    fetchExamDetails()
  }, [examId])

  const fetchExamDetails = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}`)
      if (res.ok) {
        const data = await res.json()
        setExam(data.exam)
        setQuestions(data.questions || [])
        setEditData({
          title: data.exam.title,
          description: data.exam.description,
          duration_minutes: data.exam.duration_minutes,
          passing_score: data.exam.passing_score,
        })
      }
    } catch (error) {
      toast.error('Failed to load exam')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!exam) return

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_public: !exam.is_public,
          is_active: !exam.is_public ? true : exam.is_active
        })
      })

      if (res.ok) {
        const data = await res.json()
        setExam(data)
        toast.success(exam.is_public ? 'Exam unpublished' : 'Exam published!')
      } else {
        toast.error('Failed to update exam')
      }
    } catch (error) {
      toast.error('Error updating exam')
    }
  }

  const handleSaveChanges = async () => {
    if (!editData.title.trim()) {
      toast.error('Exam title is required')
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      })

      if (res.ok) {
        const data = await res.json()
        setExam(data)
        setIsEditing(false)
        toast.success('Exam updated successfully')
      } else {
        toast.error('Failed to save changes')
      }
    } catch (error) {
      toast.error('Error saving changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      return
    }

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        toast.success('Exam deleted')
        router.push('/dashboard/exams')
      } else {
        toast.error('Failed to delete exam')
      }
    } catch (error) {
      toast.error('Error deleting exam')
    }
  }

  const copyRoomCode = () => {
    if (exam?.room_code) {
      navigator.clipboard.writeText(exam.room_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
      toast.success('Room code copied!')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!exam) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Exam not found</h2>
        <Link href="/dashboard/exams">
          <NeuButton>Back to Exams</NeuButton>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/dashboard/exams">
          <NeuButton variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </NeuButton>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{exam.title}</h1>
          <p className="text-muted-foreground">Created {new Date(exam.created_at).toLocaleDateString()}</p>
        </div>
        <div className="flex gap-2">
          <NeuButton
            variant={exam.is_public ? 'primary' : 'secondary'}
            onClick={handlePublish}
            className="gap-2"
          >
            {exam.is_public ? (
              <>
                <Globe className="w-4 h-4" />
                Published
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Draft
              </>
            )}
          </NeuButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Exam Info Card */}
          <NeuCard>
            <NeuCardHeader>
              <div className="flex items-center justify-between">
                <NeuCardTitle>Exam Details</NeuCardTitle>
                {!isEditing && (
                  <NeuButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </NeuButton>
                )}
              </div>
            </NeuCardHeader>
            <NeuCardContent className="space-y-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <NeuInput
                      value={editData.title}
                      onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      className="w-full p-3 border border-slate-300 rounded-lg"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                      <NeuInput
                        type="number"
                        value={editData.duration_minutes}
                        onChange={(e) => setEditData({ ...editData, duration_minutes: parseInt(e.target.value) })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Passing Score (%)</label>
                      <NeuInput
                        type="number"
                        min="0"
                        max="100"
                        value={editData.passing_score}
                        onChange={(e) => setEditData({ ...editData, passing_score: parseInt(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end">
                    <NeuButton
                      variant="secondary"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </NeuButton>
                    <NeuButton
                      onClick={handleSaveChanges}
                      disabled={isSaving}
                    >
                      {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Save Changes
                    </NeuButton>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground">Description</label>
                    <p className="mt-1">{exam.description || 'No description'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-muted-foreground">Duration</label>
                      <p className="mt-1 font-medium">{exam.duration_minutes} minutes</p>
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Passing Score</label>
                      <p className="mt-1 font-medium">{exam.passing_score}%</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground">Total Questions</label>
                    <p className="mt-1 font-medium">{exam.total_questions}</p>
                  </div>
                </>
              )}
            </NeuCardContent>
          </NeuCard>

          {/* Questions Section */}
          <NeuCard>
            <NeuCardHeader>
              <NeuCardTitle>Questions ({questions.length})</NeuCardTitle>
            </NeuCardHeader>
            <NeuCardContent className="space-y-4">
              {questions.length === 0 ? (
                <p className="text-muted-foreground">No questions added yet</p>
              ) : (
                questions.map((question, index) => (
                  <div key={question.id} className="p-4 border border-border rounded-lg">
                    <p className="font-medium">
                      {index + 1}. {question.question_text}
                    </p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Type: {question.question_type} | Points: {question.points}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </NeuCardContent>
          </NeuCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Room Code Card */}
          <NeuCard>
            <NeuCardHeader>
              <NeuCardTitle className="text-sm">Room Code</NeuCardTitle>
            </NeuCardHeader>
            <NeuCardContent className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  value={exam.room_code}
                  readOnly
                  className="w-full p-3 border border-border rounded-lg font-mono text-lg font-bold text-center bg-muted"
                />
              </div>
              <NeuButton
                onClick={copyRoomCode}
                className="w-full gap-2"
                variant="secondary"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Code
                  </>
                )}
              </NeuButton>
            </NeuCardContent>
          </NeuCard>

          {/* Status Card */}
          <NeuCard>
            <NeuCardHeader>
              <NeuCardTitle className="text-sm">Status</NeuCardTitle>
            </NeuCardHeader>
            <NeuCardContent className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Visibility</label>
                <p className="mt-1 font-medium">
                  {exam.is_public ? '🌐 Public' : '🔒 Private'}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Status</label>
                <p className="mt-1 font-medium">
                  {exam.is_active ? '✓ Active' : '✗ Inactive'}
                </p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Last Updated</label>
                <p className="mt-1 font-medium text-sm">
                  {new Date(exam.updated_at).toLocaleDateString()}
                </p>
              </div>
            </NeuCardContent>
          </NeuCard>

          {/* Actions */}
          <div className="space-y-2">
            <Link href={`/dashboard/exams/${examId}/results`}>
              <NeuButton className="w-full gap-2">
                <BarChart3 className="w-4 h-4" />
                View Results
              </NeuButton>
            </Link>
            <Link href={`/dashboard/exams/${examId}/monitor`}>
              <NeuButton className="w-full gap-2">
                <Users className="w-4 h-4" />
                Live Monitor
              </NeuButton>
            </Link>
            <Link href={`/exam/take?room=${exam.room_code}`}>
              <NeuButton className="w-full gap-2">
                <Eye className="w-4 h-4" />
                Preview Exam
              </NeuButton>
            </Link>
            <NeuButton
              variant="destructive"
              className="w-full gap-2"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" />
              Delete Exam
            </NeuButton>
          </div>
        </div>
      </div>
    </div>
  )
}
