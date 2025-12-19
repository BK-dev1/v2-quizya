import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total exams
    const { data: exams } = await supabase
      .from('exams')
      .select('id, title, created_at')
      .eq('created_by', user.id)

    // Get exam sessions with scores
    const { data: sessions } = await supabase
      .from('exam_sessions')
      .select('id, score, total_points, created_at, exam_id, student_id, guest_email')
      .in('exam_id', exams?.map(e => e.id) || [])
      .eq('status', 'completed')

    const totalSessions = sessions?.length || 0

    // Calculate average score percentage across all sessions
    // Score is raw points, we need to convert to percentage based on total_points
    const avgScore = totalSessions > 0
      ? Math.round((sessions || []).reduce((sum, s) => {
        const percentage = s.total_points > 0 ? (s.score || 0) / s.total_points * 100 : 0
        return sum + percentage
      }, 0) / totalSessions)
      : 0

    // Recent exams logic
    const recentExams = exams?.slice(0, 5).map(exam => {
      const examSessions = sessions?.filter(s => s.exam_id === exam.id) || []
      const examAvg = examSessions.length > 0
        ? Math.round(examSessions.reduce((sum, s) => {
          const percentage = s.total_points > 0 ? (s.score || 0) / s.total_points * 100 : 0
          return sum + percentage
        }, 0) / examSessions.length)
        : 0

      return {
        title: exam.title,
        sessions: examSessions.length,
        avgScore: examAvg,
        date: new Date(exam.created_at).toLocaleDateString()
      }
    }) || []

    // Score distribution logic
    const distribution = {
      '90-100%': 0,
      '80-89%': 0,
      '70-79%': 0,
      '60-69%': 0,
      '<60%': 0
    }

    sessions?.forEach(s => {
      const percentage = s.total_points > 0 ? (s.score || 0) / s.total_points * 100 : 0
      if (percentage >= 90) distribution['90-100%']++
      else if (percentage >= 80) distribution['80-89%']++
      else if (percentage >= 70) distribution['70-79%']++
      else if (percentage >= 60) distribution['60-69%']++
      else distribution['<60%']++
    })

    const scoreDistribution = Object.entries(distribution).map(([range, count]) => ({
      range,
      count,
      percentage: totalSessions > 0 ? Math.round((count / totalSessions) * 100) : 0
    }))

    // Monthly stats logic (last 6 months)
    const monthlyStatsMap = new Map<string, { exams: Set<string>, students: Set<string> }>()

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = d.toLocaleString('default', { month: 'short' })
      monthlyStatsMap.set(key, { exams: new Set(), students: new Set() })
    }

    sessions?.forEach(s => {
      const date = new Date(s.created_at)
      // Only count if within last 6 months roughly
      const key = date.toLocaleString('default', { month: 'short' })
      if (monthlyStatsMap.has(key)) {
        const stats = monthlyStatsMap.get(key)!
        stats.exams.add(s.exam_id)
        if (s.student_id) stats.students.add(s.student_id)
        else if (s.guest_email) stats.students.add(s.guest_email)
      }
    })

    const monthlyStats = Array.from(monthlyStatsMap.entries()).map(([month, data]) => ({
      month,
      exams: data.exams.size,
      students: data.students.size
    }))

    // Calculate total unique students across all time
    const uniqueStudents = new Set<string>()
    sessions?.forEach(s => {
      if (s.student_id) uniqueStudents.add(s.student_id)
      else if (s.guest_email) uniqueStudents.add(s.guest_email)
    })

    return NextResponse.json({
      totalExams: exams?.length || 0,
      totalStudents: uniqueStudents.size,
      totalSessions,
      avgScore,
      recentExams,
      scoreDistribution,
      monthlyStats
    })
  } catch (error) {
    console.error('Error fetching teacher analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
