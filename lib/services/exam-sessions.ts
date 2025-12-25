import { createClient } from '@/lib/supabase/server'
import { ExamSession, ExamSessionInsert, ExamSessionUpdate, StudentAnswer, ProctoringData, ProctoringEvent } from '@/lib/types'

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
  const { data: questions } = await supabase
    .from('questions')
    .select('points')
    .eq('exam_id', examId)

  const totalPoints = questions?.reduce((sum: number, q: any) => sum + q.points, 0) || 0

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

  // 1. Get the session to find the exam_id
  const { data: session, error: sessionError } = await supabase
    .from('exam_sessions')
    .select('exam_id, started_at')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    console.error('Error fetching session:', sessionError)
    return null
  }

  // 2. Fetch all questions for this exam AND exam duration
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select('id, question_type, correct_answer, points')
    .eq('exam_id', session.exam_id)

  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('duration_minutes, status')
    .eq('id', session.exam_id)
    .single()

  if (questionsError || !questions || examError || !exam) {
    console.error('Error fetching exam data:', questionsError || examError)
    return null
  }

  // 2.5 Validation Logic (Time Check)
  if (session.started_at && exam.duration_minutes) {
    const startTime = new Date(session.started_at).getTime()
    const now = new Date().getTime()
    const allowedDurationMs = exam.duration_minutes * 60 * 1000
    const gracePeriodMs = 2 * 60 * 1000 // 2 minutes grace
    const deadline = startTime + allowedDurationMs + gracePeriodMs

    if (now > deadline) {
      console.error(`Submission rejected: Time limit exceeded. Now: ${now}, Deadline: ${deadline}`)
      throw new Error('Time limit exceeded')
    }
  }

  // 3. Calculate score and validate answers
  let totalScore = 0

  // Create a map for faster lookup
  const questionMap = new Map(questions.map(q => [q.id, q]))

  const validatedAnswers: StudentAnswer[] = answers.map(ans => {
    const question = questionMap.get(ans.question_id)
    if (!question) {
      // Question not found or invalid
      return { ...ans, is_correct: false, points_earned: 0 }
    }

    let isCorrect = false

    if (question.question_type === 'essay') {
      // Essays require manual grading, set to 0 for now
      isCorrect = false
    } else if (question.question_type === 'short_answer') {
      // Case-insensitive comparison
      isCorrect = (ans.answer || '').trim().toLowerCase() === (question.correct_answer || '').trim().toLowerCase()
    } else {
      // Exact match for multiple choice / true_false
      isCorrect = ans.answer === question.correct_answer
    }

    const pointsEarned = isCorrect ? question.points : 0
    totalScore += pointsEarned

    return {
      question_id: ans.question_id,
      answer: ans.answer,
      is_correct: isCorrect,
      points_earned: pointsEarned
    }
  })

  return updateExamSession(sessionId, {
    submitted_at: new Date().toISOString(),
    status: 'completed',
    answers: validatedAnswers as any,
    score: totalScore
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
  eventType: ProctoringEvent['type'],
  details?: any
): Promise<boolean> {
  const supabase = await createClient()

  // Get current proctoring data
  const { data: session, error: fetchError } = await supabase
    .from('exam_sessions')
    .select('proctoring_data')
    .eq('id', sessionId)
    .single()

  if (fetchError || !session) {
    console.error('Error fetching session for proctoring event:', fetchError)
    return false
  }

  const currentData = (session.proctoring_data as unknown as ProctoringData) || { infractions: [] }
  const newEvent: ProctoringEvent = {
    type: eventType as any,
    timestamp: new Date().toISOString(),
    details
  }

  const updatedData: ProctoringData = {
    ...currentData,
    infractions: [...(currentData.infractions || []), newEvent]
  }

  const { error: updateError } = await supabase
    .from('exam_sessions')
    .update({
      proctoring_data: updatedData as any
    })
    .eq('id', sessionId)

  if (updateError) {
    console.error('Error adding proctoring event:', updateError)
    return false
  }

  return true
}