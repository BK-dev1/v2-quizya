import { createClient } from '@/lib/supabase/server'
import { AttendanceSession, AttendanceSessionInsert, AttendanceSessionUpdate, AttendanceRecord, AttendanceRecordInsert } from '@/lib/types'

export async function createAttendanceSession(session: AttendanceSessionInsert): Promise<AttendanceSession | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance_sessions')
    .insert(session)
    .select()
    .single()

  if (error) {
    console.error('Error creating attendance session:', error)
    return null
  }

  return data
}

export async function getAttendanceSession(sessionId: string): Promise<AttendanceSession | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('id', sessionId)
    .single()

  if (error) {
    console.error('Error fetching attendance session:', error)
    return null
  }

  return data
}

export async function getAttendanceSessionWithRecords(sessionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance_sessions')
    .select(`
      *,
      attendance_records (*)
    `)
    .eq('id', sessionId)
    .order('check_in_time', { foreignTable: 'attendance_records', ascending: false })
    .single()

  if (error) {
    console.error('Error fetching attendance session with records:', error)
    return null
  }

  return data
}

export async function getAttendanceSessionWithRecordsSummary(sessionId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance_sessions')
    .select(`
      id,
      title,
      description,
      module_name,
      section_group,
      started_at,
      ended_at,
      is_active,
      qr_refresh_interval,
      location_lat,
      location_lng,
      max_distance_meters,
      teacher_id,
      attendance_records (
        id,
        student_name,
        student_email,
        check_in_time,
        location_lat,
        location_lng
      )
    `)
    .eq('id', sessionId)
    .order('check_in_time', { foreignTable: 'attendance_records', ascending: false })
    .single()

  if (error) {
    console.error('Error fetching attendance session summary:', error)
    return null
  }

  return data
}

export async function getTeacherAttendanceSessions(teacherId: string): Promise<AttendanceSession[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance_sessions')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching teacher attendance sessions:', error)
    return []
  }

  return data
}

export async function updateAttendanceSession(
  sessionId: string,
  updates: AttendanceSessionUpdate
): Promise<AttendanceSession | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating attendance session:', error)
    return null
  }

  return data
}

export async function endAttendanceSession(sessionId: string): Promise<AttendanceSession | null> {
  return updateAttendanceSession(sessionId, {
    is_active: false,
    ended_at: new Date().toISOString()
  })
}

export async function deleteAttendanceSession(sessionId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('attendance_sessions')
    .delete()
    .eq('id', sessionId)

  if (error) {
    console.error('Error deleting attendance session:', error)
    return false
  }

  return true
}

export async function createAttendanceRecord(record: AttendanceRecordInsert): Promise<AttendanceRecord | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance_records')
    .insert(record)
    .select()
    .single()

  if (error) {
    console.error('Error creating attendance record:', error)
    return null
  }

  return data
}

export async function getAttendanceRecords(sessionId: string): Promise<AttendanceRecord[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('attendance_records')
    .select('*')
    .eq('session_id', sessionId)
    .order('check_in_time', { ascending: false })

  if (error) {
    console.error('Error fetching attendance records:', error)
    return []
  }

  return data
}

export async function checkDuplicateAttendance(
  sessionId: string,
  studentName: string,
  studentEmail?: string | null
): Promise<boolean> {
  const supabase = await createClient()

  let query = supabase
    .from('attendance_records')
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('student_name', studentName)

  if (studentEmail) {
    query = query.eq('student_email', studentEmail)
  }

  const { count, error } = await query

  if (error) {
    console.error('Error checking duplicate attendance:', error)
    return false
  }

  return (count || 0) > 0
}

export async function storeAttendanceToken(
  sessionId: string,
  token: string,
  expiresAt: string
): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase.from('attendance_tokens' as any) as any)
    .insert({
      session_id: sessionId,
      token,
      expires_at: expiresAt
    })

  if (error) {
    console.error('Error storing attendance token:', error)
    return false
  }

  return true
}

export async function getValidTokenForSession(
  sessionId: string,
  minRemainingSeconds: number = 10
): Promise<{ token: string; expiresAt: string } | null> {
  const supabase = await createClient()

  const minExpiryTime = new Date(Date.now() + minRemainingSeconds * 1000).toISOString()

  const { data, error } = await (supabase.from('attendance_tokens' as any) as any)
    .select('token, expires_at')
    .eq('session_id', sessionId)
    .gt('expires_at', minExpiryTime)
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching valid token:', error)
    return null
  }

  if (!data) return null

  return {
    token: data.token,
    expiresAt: data.expires_at
  }
}

export async function cleanupExpiredTokens(sessionId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase.from('attendance_tokens' as any) as any)
    .delete()
    .eq('session_id', sessionId)
    .lt('expires_at', new Date().toISOString())

  if (error) {
    console.error('Error cleaning up expired tokens:', error)
    return false
  }

  return true
}

export async function verifyAttendanceToken(
  sessionId: string,
  token: string
): Promise<boolean> {
  const supabase = await createClient()

  const { count, error } = await (supabase.from('attendance_tokens' as any) as any)
    .select('id', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('token', token)
    .gt('expires_at', new Date().toISOString())


  if (error) {
    console.error('Error verifying attendance token:', error)
    return false
  }

  return (count || 0) > 0
}

export async function clearAttendanceTokens(sessionId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await (supabase.from('attendance_tokens' as any) as any)
    .delete()
    .eq('session_id', sessionId)

  if (error) {
    console.error('Error clearing attendance tokens:', error)
    return false
  }

  return true
}

export async function deleteAttendanceRecord(recordId: string): Promise<boolean> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('attendance_records')
    .delete()
    .eq('id', recordId)

  if (error) {
    console.error('Error deleting attendance record:', error)
    return false
  }

  return true
}
