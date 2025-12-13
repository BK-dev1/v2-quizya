'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/hooks/use-auth'
import { NeuCard } from '@/components/ui/neu-card'
import { NeuButton } from '@/components/ui/neu-button'
import { NeuInput } from '@/components/ui/neu-input'
import {
  Plus,
  Search,
  Globe,
  Clock,
  Users,
  FileQuestion,
  Star,
  Eye,
  Loader2,
  BookOpen
} from 'lucide-react'

interface PublicExam {
  id: string
  title: string
  description: string | null
  duration_minutes: number
  total_questions: number
  created_at: string
  profiles: {
    username: string | null
  } | null
  _count?: {
    exam_sessions: number
  }
  avgRating?: number
}

export default function QuestionBankPage() {
  const { user, profile } = useAuth()
  const [publicExams, setPublicExams] = useState<PublicExam[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'popular' | 'recent'>('all')

  useEffect(() => {
    loadPublicExams()
  }, [])

  const loadPublicExams = async () => {
    try {
      const res = await fetch('/api/public-exams')
      if (!res.ok) {
        console.error('Error loading public exams')
        return
      }

      const exams = await res.json()
      setPublicExams(exams)
    } catch (error) {
      console.error('Error loading public exams:', error)
    } finally {
      setLoading(false)
    }
  } 
              ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length / 10) // Convert to 5-star scale
              : 0
          }
        })
      )

      setPublicExams(examsWithStats)
    } catch (error) {
      console.error('Error loading public exams:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter exams based on search and category
  const filteredExams = publicExams.filter(exam => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exam.profiles?.username?.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false

    if (categoryFilter === 'popular') {
      return (exam._count?.exam_sessions || 0) >= 5
    } else if (categoryFilter === 'recent') {
      const createdAt = new Date(exam.created_at)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      return createdAt >= weekAgo
    }
    
    return true
  })

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Please log in to access the question bank.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading question bank...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen  p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold ">Question Bank</h1>
              <p className="">Discover and explore public examinations</p>
            </div>
            {profile?.role === 'teacher' && (
              <Link href="/dashboard/exams/new">
                <NeuButton>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Public Exam
                </NeuButton>
              </Link>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <NeuInput
                placeholder="Search exams, topics, or authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              {(['all', 'popular', 'recent'] as const).map((filterType) => (
                <NeuButton
                  key={filterType}
                  variant={categoryFilter === filterType ? 'default' : 'outline'}
                  onClick={() => setCategoryFilter(filterType)}
                  size="sm"
                  className="capitalize"
                >
                  {filterType === 'all' ? 'All' : 
                   filterType === 'popular' ? 'Popular' : 'Recent'}
                </NeuButton>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <NeuCard className="p-4">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm ">Total Public Exams</p>
                <p className="text-xl font-bold ">{publicExams.length}</p>
              </div>
            </div>
          </NeuCard>

          <NeuCard className="p-4">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm ">Total Attempts</p>
                <p className="text-xl font-bold ">
                  {publicExams.reduce((sum, exam) => sum + (exam._count?.exam_sessions || 0), 0)}
                </p>
              </div>
            </div>
          </NeuCard>

          <NeuCard className="p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm ">Active Creators</p>
                <p className="text-xl font-bold ">
                  {new Set(publicExams.map(exam => exam.profiles?.username).filter(Boolean)).size}
                </p>
              </div>
            </div>
          </NeuCard>
        </div>

        {/* Exams Grid */}
        {filteredExams.length === 0 ? (
          <NeuCard className="text-center p-12">
            <BookOpen className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            {publicExams.length === 0 ? (
              <>
                <h3 className="text-lg font-medium  mb-2">No public exams available</h3>
                <p className="text-slate-500 mb-4">Be the first to create and share a public exam!</p>
                {profile?.role === 'teacher' && (
                  <Link href="/dashboard/exams/new">
                    <NeuButton>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Public Exam
                    </NeuButton>
                  </Link>
                )}
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium  mb-2">No matching exams</h3>
                <p className="text-slate-500">Try adjusting your search or filter criteria</p>
              </>
            )}
          </NeuCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExams.map((exam) => (
              <NeuCard key={exam.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                      Public
                    </span>
                  </div>
                  
                  {exam.avgRating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs ">
                        {exam.avgRating}/5
                      </span>
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold  mb-2 line-clamp-2">
                  {exam.title}
                </h3>

                {exam.description && (
                  <p className=" text-sm mb-3 line-clamp-3">
                    {exam.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
                  <div className="flex items-center gap-1">
                    <FileQuestion className="h-4 w-4" />
                    {exam.total_questions}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {exam.duration_minutes}m
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {exam._count?.exam_sessions || 0}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="text-slate-500">By </span>
                    <span className="font-medium ">
                      {exam.profiles?.username || 'Anonymous'}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/public-exams/${exam.id}`}>
                      <NeuButton size="sm" variant="outline">
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </NeuButton>
                    </Link>
                    
                    <Link href={`/join?exam=${exam.id}`}>
                      <NeuButton size="sm">
                        Take Exam
                      </NeuButton>
                    </Link>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100">
                  <div className="text-xs text-slate-500">
                    Created {new Date(exam.created_at).toLocaleDateString()}
                  </div>
                </div>
              </NeuCard>
            ))}
          </div>
        )}

        {/* Load More Button */}
        {filteredExams.length > 0 && filteredExams.length < publicExams.length && (
          <div className="text-center mt-8">
            <NeuButton variant="outline">
              Load More Exams
            </NeuButton>
          </div>
        )}
      </div>
    </div>
  )
}