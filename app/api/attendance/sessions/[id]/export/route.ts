import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAttendanceSessionWithRecords } from '@/lib/services/attendance-sessions'
import {
  generateAttendanceExcel,
  generateAttendanceFilename,
  createExcelResponse
} from '@/lib/utils/excel-export'

// GET /api/attendance/sessions/[id]/export - Export attendance to Excel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const sessionId = params.id
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get session with records
    const session = await getAttendanceSessionWithRecords(sessionId)

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Verify user owns this session
    if (session.teacher_id !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Generate Excel file
    const excelBuffer = generateAttendanceExcel({
      sessionTitle: session.title,
      moduleName: session.module_name || undefined,
      sectionGroup: session.section_group || undefined,
      startedAt: session.started_at,
      endedAt: session.ended_at || undefined,
      records: session.attendance_records || []
    })

    const filename = generateAttendanceFilename(session.title)

    return createExcelResponse(excelBuffer, filename)
  } catch (error) {
    console.error('Error exporting attendance:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
