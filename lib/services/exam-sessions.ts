import { createClient } from '@/lib/supabase/server'
import { ExamSession, ExamSessionInsert, ExamSessionUpdate, StudentAnswer } from '@/lib/types'

export async function createExamSession(session: ExamSessionInsert): Promise<ExamSession | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exam_sessions')
    .insert(session)
    .select()
    .single()

  if (error) {
    console.error('Error creating exam session:', error)
    return null
  }

  return data
}

export async function getExamSession(examId: string, studentId?: string, guestEmail?: string): Promise<ExamSession | null> {
  const supabase = await createClient()
  
  let query = supabase
    .from('exam_sessions')
    .select('*')
    .eq('exam_id', examId)

  if (studentId) {
    query = query.eq('student_id', studentId)
  } else if (guestEmail) {
    query = query.eq('guest_email', guestEmail).eq('is_guest', true)
  } else {
    return null
  }

  const { data, error } = await query.single()

  if (error) {
    console.error('Error fetching exam session:', error)
    return null
  }

  return data
}

export async function updateExamSession(sessionId: string, updates: ExamSessionUpdate): Promise<ExamSession | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exam_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating exam session:', error)
    return null
  }

  return data
}

export async function startExamSession(
  examId: string, 
  studentId?: string, 
  guestName?: string, 
  guestEmail?: string
): Promise<ExamSession | null> {
  const supabase = await createClient()
  
  // First check if session already exists
  const existingSession = await getExamSession(examId, studentId, guestEmail)
  
  if (existingSession) {
    // Update existing session to mark as started
    return updateExamSession(existingSession.id, {
      started_at: new Date().toISOString(),
      status: 'in_progress'
    })
  }

  // Get exam details for total_points
  const { data: exam } = await supabase
    .from('exams')
    .select('questions(points)')
    .eq('id', examId)
    .single()

  const totalPoints = exam?.questions?.reduce((sum: number, q: any) => sum + q.points, 0) || 0

  // Create new session
  const sessionData: ExamSessionInsert = {
    exam_id: examId,
    started_at: new Date().toISOString(),
    status: 'in_progress',
    total_points: totalPoints
  }

  // Add either student or guest data
  if (studentId) {
    sessionData.student_id = studentId
    sessionData.is_guest = false
  } else if (guestName && guestEmail) {
    sessionData.guest_name = guestName
    sessionData.guest_email = guestEmail
    sessionData.is_guest = true
  } else {
    throw new Error('Either studentId or guest information (name and email) is required')
  }

  return createExamSession(sessionData)
}

export async function submitExamSession(
  sessionId: string, 
  answers: StudentAnswer[]
): Promise<ExamSession | null> {
  const supabase = await createClient()
  
  // Calculate score
  const totalPointsEarned = answers.reduce((sum, answer) => sum + answer.points_earned, 0)
  
  return updateExamSession(sessionId, {
    submitted_at: new Date().toISOString(),
    status: 'completed',
    answers: answers as any,
    score: totalPointsEarned
  })
}

export async function getStudentExamSessions(studentId: string): Promise<ExamSession[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exam_sessions')
    .select(`
      *,
      exam:exams (*)
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching student exam sessions:', error)
    return []
  }

  return data
}

export async function getExamSessions(examId: string): Promise<ExamSession[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exam_sessions')
    .select(`
      *,
      student:profiles (*)
    `)
    .eq('exam_id', examId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching exam sessions:', error)
    return []
  }

  return data
}

export async function addProctoringEvent(
  sessionId: string, 
  eventType: string, 
  details?: any
): Promise<boolean> {
  const supabase = await createClient()
  
  // Get current proctoring data
  const { data: session } = await supabase
    .from('exam_sessions')
    .select('proctoring_data')
    .eq('id', sessionId)
    .single()

  const currentData = session?.proctoring_data || []
  const newEvent = {
    type: eventType,
    timestamp: new Date().toISOString(),
    details
  }

  const { error } = await supabase
    .from('exam_sessions')
    .update({
      proctoring_data: [...currentData, newEvent]
    })
    .eq('id', sessionId)

  if (error) {
    console.error('Error adding proctoring event:', error)
    return false
  }

  return true
}