import { createClient } from '@/lib/supabase/server'
import { Exam, ExamInsert, ExamUpdate, ExamWithQuestions, Question } from '@/lib/types'

export async function createExam(exam: ExamInsert): Promise<Exam | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exams')
    .insert(exam)
    .select()
    .single()

  if (error) {
    console.error('Error creating exam:', error)
    return null
  }

  return data
}

export async function getExam(examId: string): Promise<Exam | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', examId)
    .single()

  if (error) {
    console.error('Error fetching exam:', error)
    return null
  }

  return data
}

export async function getExamWithQuestions(examId: string): Promise<ExamWithQuestions | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('exams')
    .select(`
      *,
      questions (*)
    `)
    .eq('id', examId)
    .order('order_index', { foreignTable: 'questions' }) // order questions by order_index
    .single();

  if (error) {
    console.error('Error fetching exam with questions:', error);
    return null;
  }

  return data as ExamWithQuestions;
}


export async function getUserExams(userId: string): Promise<Exam[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('created_by', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching user exams:', error)
    return []
  }

  return data
}

export async function getPublicExams(): Promise<Exam[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('is_public', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching public exams:', error)
    return []
  }

  return data
}

export async function updateExam(examId: string, updates: ExamUpdate): Promise<Exam | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exams')
    .update(updates)
    .eq('id', examId)
    .select()
    .single()

  if (error) {
    console.error('Error updating exam:', error)
    return null
  }

  return data
}

export async function deleteExam(examId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', examId)

  if (error) {
    console.error('Error deleting exam:', error)
    return false
  }

  return true
}

export async function getExamByRoomCode(roomCode: string): Promise<Exam | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('room_code', roomCode)
    .eq('is_active', true)
    .single()

  if (error) {
    console.error('Error fetching exam by room code:', error)
    return null
  }

  return data
}

export async function generateRoomCode(): Promise<string> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .rpc('generate_room_code')

  if (error) {
    console.error('Error generating room code:', error)
    // Fallback to client-side generation
    return Math.random().toString(36).substring(2, 8).toUpperCase()
  }

  return data
}