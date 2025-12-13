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
      .select('id, score, created_at, exam_id')
      .in('exam_id', exams?.map(e => e.id) || [])
      .eq('status', 'completed')

    const totalSessions = sessions?.length || 0
    const avgScore = totalSessions > 0
      ? Math.round((sessions || []).reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions)
      : 0

    const recentExams = exams?.slice(0, 5).map(exam => {
      const examSessions = sessions?.filter(s => s.exam_id === exam.id) || []
      const examAvg = examSessions.length > 0
        ? Math.round(examSessions.reduce((sum, s) => sum + (s.score || 0), 0) / examSessions.length)
        : 0

      return {
        title: exam.title,
        sessions: examSessions.length,
        avgScore: examAvg,
        date: exam.created_at
      }
    }) || []

    return NextResponse.json({
      totalExams: exams?.length || 0,
      totalStudents: new Set(sessions?.map(s => s.id)).size || 0,
      totalSessions,
      avgScore,
      recentExams,
      scoreDistribution: [],
      monthlyStats: []
    })
  } catch (error) {
    console.error('Error fetching teacher analytics:', error)
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
  }
}
