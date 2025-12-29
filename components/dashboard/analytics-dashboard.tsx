'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/hooks/use-auth'
import { NeuCard } from '@/components/ui/neu-card'
import { 
  TrendingUp, 
  Users, 
  FileText, 
  Clock,
  Award,
  Target,
  Loader2,
  BarChart3,
  PieChart
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AnalyticsData {
  totalExams: number
  totalStudents: number
  totalSessions: number
  avgScore: number
  recentExams: Array<{
    title: string
    sessions: number
    avgScore: number
    date: string
  }>
  scoreDistribution: Array<{
    range: string
    count: number
    percentage: number
  }>
  monthlyStats: Array<{
    month: string
    exams: number
    students: number
  }>
}

export default function AnalyticsPage() {
  const { user, profile } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    if (user && profile?.role === 'teacher') {
      loadAnalytics()
    }
  }, [user, profile])

  const loadAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics/teacher`)
      if (res.ok) {
        const data = await res.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

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
          <p>{t('loadingAnalytics')}</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{t('failedLoadAnalytics')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen  p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold ">{t('analyticsDashboard')}</h1>
          <p className="">{t('analyticsDescription')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <NeuCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm ">{t('totalExams')}</p>
                <p className="text-2xl font-bold ">{analytics.totalExams}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </NeuCard>

          <NeuCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm ">{t('studentsReached')}</p>
                <p className="text-2xl font-bold ">{analytics.totalStudents}</p>
              </div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </NeuCard>

          <NeuCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm ">{t('totalAttempts')}</p>
                <p className="text-2xl font-bold ">{analytics.totalSessions}</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </NeuCard>

          <NeuCard className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm ">{t('averageScore')}</p>
                <p className="text-2xl font-bold ">{analytics.avgScore}%</p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </NeuCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <NeuCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold ">{t('recentExamPerformance')}</h3>
            </div>
            
            {analytics.recentExams.length > 0 ? (
              <div className="space-y-4">
                {analytics.recentExams.map((exam, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div className="flex-1">
                      <p className="font-medium  truncate">{exam.title}</p>
                      <p className="text-sm ">
                        {exam.sessions} {t('attempts')} • {t('created')} {exam.date}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold ">{exam.avgScore}%</p>
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-linear-to-r from-blue-500 to-green-500 transition-all duration-500"
                          style={{ width: `${exam.avgScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('noExamData')}</p>
              </div>
            )}
          </NeuCard>

          <NeuCard className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <PieChart className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold ">{t('scoreDistribution')}</h3>
            </div>
            
            {analytics.scoreDistribution.some(d => d.count > 0) ? (
              <div className="space-y-3">
                {analytics.scoreDistribution.map((dist, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm  min-w-[80px]">{dist.range}</span>
                    <div className="flex-1 mx-4">
                      <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-linear-to-r from-red-400 via-yellow-400 to-green-500 transition-all duration-500"
                          style={{ 
                            width: `${dist.percentage}%`,
                            background: dist.range.includes('90-100') ? '#10b981' :
                                       dist.range.includes('80-89') ? '#22c55e' :
                                       dist.range.includes('70-79') ? '#eab308' :
                                       dist.range.includes('60-69') ? '#f97316' : '#ef4444'
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-medium  min-w-[60px] text-right">
                      {dist.count} ({dist.percentage}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                <PieChart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>{t('noScoreData')}</p>
              </div>
            )}
          </NeuCard>

          <NeuCard className="p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-semibold ">{t('monthlyActivity')}</h3>
            </div>
            
            <div className="grid grid-cols-6 gap-4">
              {analytics.monthlyStats.map((month, index) => (
                <div key={index} className="text-center p-4 rounded-lg ">
                  <p className="text-xs  mb-2">{month.month}</p>
                  <p className="text-lg font-bold text-blue-600">{month.exams}</p>
                  <p className="text-xs text-slate-500">{t('exams')}</p>
                  <p className="text-sm font-semibold text-green-600 mt-1">{month.students}</p>
                  <p className="text-xs text-slate-500">{t('students')}</p>
                </div>
              ))}
            </div>
          </NeuCard>
        </div>
      </div>
    </div>
  )
}