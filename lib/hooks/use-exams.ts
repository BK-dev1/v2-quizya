'use client'

import { useState, useEffect } from 'react'
import { Exam } from '@/lib/types'
import { useAuth } from './use-auth'

export function useExams() {
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  const fetchExams = async () => {
    if (!user) return

    setLoading(true)
    try {
      const res = await fetch(`/api/exams?userId=${user.id}`)
      if (res.ok) {
        const data = await res.json()
        setExams(data)
      }
    } catch (error) {
      console.error('Error fetching exams:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchExams()
  }, [user])

  const createExam = async (examData: any) => {
    if (!user) return null

    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...examData, created_by: user.id })
      })

      if (res.ok) {
        const data = await res.json()
        setExams(prev => [data, ...prev])
        return data
      }
    } catch (error) {
      console.error('Error creating exam:', error)
    }

    return null
  }

  const updateExam = async (examId: string, updates: any) => {
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (res.ok) {
        const data = await res.json()
        setExams(prev => prev.map(exam => exam.id === examId ? data : exam))
        return data
      }
    } catch (error) {
      console.error('Error updating exam:', error)
    }

    return null
  }

  const deleteExam = async (examId: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        setExams(prev => prev.filter(exam => exam.id !== examId))
        return true
      }
    } catch (error) {
      console.error('Error deleting exam:', error)
    }

    return false
  }

  return {
    exams,
    loading,
    createExam,
    updateExam,
    deleteExam,
    refetch: fetchExams
  }
}