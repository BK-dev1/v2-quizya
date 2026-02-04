import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/attendance/analytics
 * Aggregated attendance data across all sessions for a teacher
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all sessions for this teacher
    const { data: sessions, error: sessionsError } = await (supabase as any)
      .from('attendance_sessions')
      .select('id, session_name, module_name, section_name, created_at')
      .eq('teacher_id', user.id)
      .order('created_at', { ascending: false })

    if (sessionsError) {
      return NextResponse.json({ error: 'Failed to fetch sessions' }, { status: 500 })
    }

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ analytics: [] })
    }

    const sessionIds = sessions.map((s: any) => s.id)

    // Fetch all attendance logs for these sessions
    const { data: logs, error: logsError } = await (supabase as any)
      .from('attendance_logs')
      .select(`
        id,
        session_id,
        student_id,
        profiles:student_id(
          full_name,
          username,
          email
        )
      `)
      .in('session_id', sessionIds)

    if (logsError) {
      return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 })
    }

    // Aggregate by student
    const studentStats: { [key: string]: any } = {}

    logs?.forEach((log: any) => {
      const studentId = log.student_id
      if (!studentStats[studentId]) {
        studentStats[studentId] = {
          studentId: studentId,
          name: log.profiles?.full_name || log.profiles?.username || 'Unknown',
          email: log.profiles?.email,
          sessionsAttended: [],
          totalAttended: 0
        }
      }
      studentStats[studentId].sessionsAttended.push(log.session_id)
      studentStats[studentId].totalAttended += 1
    })

    const analytics = Object.values(studentStats).map((student: any) => {
      // Calculate attendance rate relative to all sessions
      const attendanceRate = (student.totalAttended / sessions.length) * 100
      
      // Map sessions to attended/missed status
      const sessionHistory = sessions.map((s: any) => ({
         sessionId: s.id,
         sessionName: s.session_name,
         date: s.created_at,
         attended: student.sessionsAttended.includes(s.id)
      }))

      return {
        ...student,
        attendanceRate,
        sessionHistory
      }
    })

    return NextResponse.json({ 
      analytics,
      totalSessions: sessions.length
    })
  } catch (error) {
    console.error('Error in GET /api/attendance/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
