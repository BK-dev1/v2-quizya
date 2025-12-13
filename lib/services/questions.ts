import { createClient } from '@/lib/supabase/server'
import { Question, QuestionInsert, QuestionUpdate } from '@/lib/types'

export async function createQuestion(question: QuestionInsert): Promise<Question | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('questions')
    .insert(question)
    .select()
    .single()

  if (error) {
    console.error('Error creating question:', error)
    return null
  }

  return data
}

export async function createMultipleQuestions(questions: QuestionInsert[]): Promise<Question[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('questions')
    .insert(questions)
    .select()

  if (error) {
    console.error('Error creating questions:', error)
    return []
  }

  return data
}

export async function getExamQuestions(examId: string, shuffle: boolean = false): Promise<Question[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('questions')
    .select('*')
    .eq('exam_id', examId)

  if (!shuffle) {
    query = query.order('order_index')
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching questions:', error)
    return []
  }

  if (shuffle) {
    return data.sort(() => Math.random() - 0.5)
  }

  return data
}

export async function updateQuestion(questionId: string, updates: QuestionUpdate): Promise<Question | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', questionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating question:', error)
    return null
  }

  return data
}

export async function deleteQuestion(questionId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId)

  if (error) {
    console.error('Error deleting question:', error)
    return false
  }

  return true
}

export async function reorderQuestions(examId: string, questionIds: string[]): Promise<boolean> {
  const supabase = await createClient()
  
  const updates = questionIds.map((id, index) => ({
    id,
    order_index: index + 1
  }))

  const { error } = await supabase
    .from('questions')
    .upsert(updates)

  if (error) {
    console.error('Error reordering questions:', error)
    return false
  }

  return true
}