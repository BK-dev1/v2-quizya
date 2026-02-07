'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { useExams } from '@/lib/hooks/use-exams'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuInput } from '@/components/ui/neu-input'
import {
  Plus,
  Search,
  Globe,
  Lock,
  Play,
  Pause,
  Eye,
  Copy,
  Trash2,
  Users,
  Clock,
  Loader2,
  MoreVertical,
  FileQuestion
} from 'lucide-react'
import { Exam } from '@/lib/types'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export default function ExamsPage() {
  const { user, profile } = useAuth()
  const { exams, loading, deleteExam } = useExams()
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [examStats, setExamStats] = useState<Record<string, { sessions: number; avgScore: number }>>({})
  const [loadingStats, setLoadingStats] = useState(true)
  const { t } = useTranslation()

  const loadExamStats = useCallback(async () => {
    try {
      const stats: Record<string, { sessions: number; avgScore: number }> = {}

      for (const exam of exams) {
        try {
          const res = await fetch(`/api/sessions/${exam.id}/stats`)
          if (res.ok) {
            const data = await res.json()
            stats[exam.id] = { sessions: data.sessionCount, avgScore: data.avgScore }
          }
        } catch (error) {
          console.error(`Error loading stats for exam ${exam.id}:`, error)
        }
      }

      setExamStats(stats)
    } catch (error) {
      console.error('Error loading exam stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }, [exams])

  useEffect(() => {
    if (user && exams.length > 0) {
      loadExamStats()
    }
  }, [user, exams, loadExamStats])

  const handleCopyRoomCode = useCallback((roomCode: string) => {
    navigator.clipboard.writeText(roomCode)
    toast.success(t('roomCodeCopied'))
  }, [t])

  const handleDeleteExam = useCallback(async (examId: string, title: string) => {
    if (confirm(`${t('confirmDeleteExam')} "${title}"?`)) {
      const success = await deleteExam(examId)
      if (success) {
        toast.success(t('examDeleted'))
      } else {
        toast.error(t('deleteExamFailed'))
      }
    }
  }, [deleteExam, t])

  const toggleExamStatus = useCallback(async (exam: Exam) => {
    try {
      const res = await fetch(`/api/exams/${exam.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !exam.is_active })
      })

      if (!res.ok) {
        toast.error(t('updateStatusFailed'))
      } else {
        toast.success(t(exam.is_active ? 'examDeactivated' : 'examActivated'))
        window.location.reload()
      }
    } catch (error) {
      toast.error(t('updateStatusFailed'))
    }
  }, [t])

  const filteredExams = useMemo(() => {
    return exams.filter(exam => {
      const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter = filter === 'all' ||
        (filter === 'active' && exam.is_active) ||
        (filter === 'inactive' && !exam.is_active)

      return matchesSearch && matchesFilter
    })
  }, [exams, searchTerm, filter])

  if (!user || profile?.role !== 'teacher') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{t('accessDeniedTeacher')}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>{t('loadingExams')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen  p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold ">{t('yourExams')}</h1>
              <p className="">{t('manageExamsDescription')}</p>
            </div>
            <Link href="/dashboard/exams/new">
              <NeuButton>
                <Plus className="h-4 w-4 mr-2" />
                {t('createExam')}
              </NeuButton>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <NeuInput
                placeholder={t('searchExamsPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'active', 'inactive'] as const).map((filterType) => (
                <NeuButton
                  key={filterType}
                  variant={filter === filterType ? 'primary' : 'outline'}
                  onClick={() => setFilter(filterType)}
                  size="sm"
                  className="capitalize"
                >
                  {t(filterType)}
                </NeuButton>
              ))}
            </div>
          </div>
        </div>

        {filteredExams.length === 0 ? (
          <NeuCard className="text-center p-12">
            <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            {exams.length === 0 ? (
              <>
                <h3 className="text-lg font-medium  mb-2">{t('noExamsYet')}</h3>
                <p className="text-muted-foreground mb-4">{t('createFirstExamPrompt')}</p>
                <Link href="/dashboard/exams/new">
                  <NeuButton>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('createFirstExam')}
                  </NeuButton>
                </Link>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium  mb-2">{t('noMatchingExams')}</h3>
                <p className="text-muted-foreground">{t('adjustSearchFilter')}</p>
              </>
            )}
          </NeuCard>
        ) : (
          <div className="grid gap-6">
            {filteredExams.map((exam) => {
              const stats = examStats[exam.id] || { sessions: 0, avgScore: 0 }

              return (
                <NeuCard key={exam.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold ">{exam.title}</h3>

                        {exam.is_public ? (
                          <Globe className="h-4 w-4 text-green-600" aria-label={t('publicExam')} />
                        ) : (
                          <Lock className="h-4 w-4 text-muted-foreground" aria-label={t('privateExam')} />
                        )}

                        <button
                          onClick={() => toggleExamStatus(exam)}
                          className={`p-1 rounded ${exam.is_active
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-red-600 hover:bg-red-50'
                            }`}
                          title={exam.is_active ? t('deactivateExam') : t('activateExam')}
                        >
                          {exam.is_active ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                        </button>

                        <span className={`px-2 py-1 rounded text-xs font-medium ${exam.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-muted text-muted-foreground'
                          }`}>
                          {exam.is_active ? t('active') : t('inactive')}
                        </span>
                      </div>

                      {exam.description && (
                        <p className=" mb-3 line-clamp-2">{exam.description}</p>
                      )}

                      <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <FileQuestion className="h-4 w-4" />
                          {exam.total_questions} {t('questions')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {exam.duration_minutes} {t('minutes')}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {loadingStats ? '...' : stats.sessions} {t('attempts')}
                        </div>
                        {!loadingStats && stats.sessions > 0 && (
                          <div>
                            {t('avg')}: {stats.avgScore}%
                          </div>
                        )}
                      </div>

                      {exam.room_code && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm ">{t('roomCode')}</span>
                          <button
                            onClick={() => handleCopyRoomCode(exam.room_code!)}
                            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                          >
                            <Copy className="h-3 w-3" />
                            {exam.room_code}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 ml-4">
                      <Link href={`/dashboard/exams/${exam.id}`}>
                        <NeuButton variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          {t('view')}
                        </NeuButton>
                      </Link>

                      <Link href={`/dashboard/exams/${exam.id}/monitor`}>
                        <NeuButton variant="outline" size="sm">
                          <Users className="h-4 w-4 mr-1" />
                          {t('monitor')}
                        </NeuButton>
                      </Link>

                      <NeuButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </NeuButton>
                    </div>
                  </div>
                </NeuCard>
              )
            })}
          </div >
        )}
      </div >
    </div >
  )
}