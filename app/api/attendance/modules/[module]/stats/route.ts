import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

// GET /api/attendance/modules/[module]/stats - Get attendance statistics for a module
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ module: string }> }
) {
    try {
        const supabase = await createClient()
        const supabaseAdmin = createServiceRoleClient()
        const { module: moduleName } = await params

        // Decode the module name from URL
        const decodedModuleName = decodeURIComponent(moduleName)

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Parse query parameters for filtering
        const searchParams = request.nextUrl.searchParams
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const sectionGroup = searchParams.get('section')

        // Build query for sessions
        let sessionsQuery = supabaseAdmin
            .from('attendance_sessions')
            .select(`
        id,
        module_name,
        section_group,
        started_at,
        ended_at,
        is_active,
        week,
        section_num,
        attendance_records (
          id,
          student_name,
          student_email,
          check_in_time
        )
      `)
            .eq('teacher_id', user.id)
            .eq('module_name', decodedModuleName)
            .order('started_at', { ascending: false })

        // Apply filters
        if (startDate) {
            sessionsQuery = sessionsQuery.gte('started_at', startDate)
        }
        if (endDate) {
            sessionsQuery = sessionsQuery.lte('started_at', endDate)
        }
        if (sectionGroup) {
            sessionsQuery = sessionsQuery.eq('section_group', sectionGroup)
        }

        const { data: sessions, error: sessionsError } = await sessionsQuery

        if (sessionsError) {
            console.error('Error fetching sessions:', sessionsError)
            return NextResponse.json(
                { error: 'Failed to fetch sessions' },
                { status: 500 }
            )
        }

        if (!sessions || sessions.length === 0) {
            return NextResponse.json({
                module: decodedModuleName,
                totalSessions: 0,
                students: [],
                sessionDetails: []
            })
        }

        // Aggregate attendance by student email
        const studentMap = new Map<string, {
            name: string
            email: string
            sessionsAttended: number
            sessionIds: string[]
            lastAttended: string
        }>()

        sessions.forEach(session => {
            const records = session.attendance_records || []
            records.forEach(record => {
                const email = record.student_email || 'unknown'
                const existing = studentMap.get(email)

                if (existing) {
                    existing.sessionsAttended++
                    existing.sessionIds.push(session.id)
                    if (record.check_in_time > existing.lastAttended) {
                        existing.lastAttended = record.check_in_time
                        existing.name = record.student_name
                    }
                } else {
                    studentMap.set(email, {
                        name: record.student_name,
                        email: email,
                        sessionsAttended: 1,
                        sessionIds: [session.id],
                        lastAttended: record.check_in_time
                    })
                }
            })
        })

        // Convert to array and calculate percentages
        const totalSessions = sessions.length
        const students = Array.from(studentMap.values()).map(student => ({
            ...student,
            totalSessions,
            attendancePercentage: Math.round((student.sessionsAttended / totalSessions) * 100)
        }))

        // Sort by attendance percentage (descending)
        students.sort((a, b) => b.attendancePercentage - a.attendancePercentage)

        // Calculate statistics
        const totalStudents = students.length
        const averageAttendance = students.reduce((sum, s) => sum + s.attendancePercentage, 0) / (totalStudents || 1)
        const studentsAbove75 = students.filter(s => s.attendancePercentage >= 75).length
        const studentsBelow50 = students.filter(s => s.attendancePercentage < 50).length

        // Session details for timeline
        const sessionDetails = sessions.map(session => ({
            id: session.id,
            startedAt: session.started_at,
            endedAt: session.ended_at,
            isActive: session.is_active,
            sectionGroup: session.section_group,
            week: session.week,
            sectionNum: session.section_num,
            attendanceCount: (session.attendance_records || []).length
        }))

        return NextResponse.json({
            module: decodedModuleName,
            totalSessions,
            totalStudents,
            averageAttendance: Math.round(averageAttendance),
            studentsAbove75Percent: studentsAbove75,
            studentsBelow50Percent: studentsBelow50,
            students,
            sessionDetails
        })
    } catch (error) {
        console.error('Error generating module statistics:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
