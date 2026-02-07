import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceRoleClient } from '@/lib/supabase/server'

// GET /api/attendance/modules/[module]/export - Export module attendance to CSV
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
        week,
        section_num,
        attendance_records (
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
            return NextResponse.json(
                { error: 'No sessions found for this module' },
                { status: 404 }
            )
        }

        // Aggregate attendance by student email
        const studentMap = new Map<string, {
            name: string
            email: string
            sessionsAttended: number
        }>()

        sessions.forEach(session => {
            const records = session.attendance_records || []
            records.forEach(record => {
                const email = record.student_email || 'unknown'
                const existing = studentMap.get(email)

                if (existing) {
                    existing.sessionsAttended++
                } else {
                    studentMap.set(email, {
                        name: record.student_name,
                        email: email,
                        sessionsAttended: 1
                    })
                }
            })
        })

        // Generate CSV content
        const totalSessions = sessions.length
        const students = Array.from(studentMap.values()).map(student => ({
            ...student,
            totalSessions,
            attendancePercentage: Math.round((student.sessionsAttended / totalSessions) * 100)
        }))

        // Sort by name
        students.sort((a, b) => a.name.localeCompare(b.name))

        // Build CSV
        let csv = 'Student Name,Email,Sessions Attended,Total Sessions,Attendance %\n'

        students.forEach(student => {
            csv += `"${student.name}","${student.email}",${student.sessionsAttended},${student.totalSessions},${student.attendancePercentage}%\n`
        })

        // Add summary rows
        csv += '\n'
        csv += `Total Students,${students.length}\n`
        csv += `Average Attendance,${Math.round(students.reduce((sum, s) => sum + s.attendancePercentage, 0) / (students.length || 1))}%\n`
        csv += `Students ≥75%,${students.filter(s => s.attendancePercentage >= 75).length}\n`
        csv += `Students <50%,${students.filter(s => s.attendancePercentage < 50).length}\n`

        // Create filename
        const sanitizedModuleName = decodedModuleName.replace(/[^a-z0-9]/gi, '_').toLowerCase()
        const dateStr = new Date().toISOString().split('T')[0]
        const filename = `attendance_${sanitizedModuleName}_${dateStr}.csv`

        // Return CSV file
        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`
            }
        })
    } catch (error) {
        console.error('Error exporting module attendance:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
