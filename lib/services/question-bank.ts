import { createClient } from '@/lib/supabase/server'
import { QuestionBank, QuestionBankInsert, QuestionBankUpdate } from '@/lib/types'

export async function createQuestionBankItem(question: QuestionBankInsert): Promise<QuestionBank | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('question_bank')
    .insert(question)
    .select()
    .single()

  if (error) {
    console.error('Error creating question bank item:', error)
    return null
  }

  return data
}

export async function getQuestionBankItems(
  userId: string,
  filters?: {
    subject?: string
    difficulty?: string
    tags?: string[]
    search?: string
  }
): Promise<QuestionBank[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('question_bank')
    .select('*')
    .eq('created_by', userId)

  if (filters?.subject) {
    query = query.eq('subject', filters.subject)
  }

  if (filters?.difficulty) {
    query = query.eq('difficulty_level', filters.difficulty)
  }

  if (filters?.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,question_text.ilike.%${filters.search}%`)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching question bank items:', error)
    return []
  }

  return data
}

export async function updateQuestionBankItem(
  questionId: string, 
  updates: QuestionBankUpdate
): Promise<QuestionBank | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('question_bank')
    .update(updates)
    .eq('id', questionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating question bank item:', error)
    return null
  }

  return data
}

export async function deleteQuestionBankItem(questionId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('question_bank')
    .delete()
    .eq('id', questionId)

  if (error) {
    console.error('Error deleting question bank item:', error)
    return false
  }

  return true
}

export async function getQuestionBankSubjects(userId: string): Promise<string[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('question_bank')
    .select('subject')
    .eq('created_by', userId)
    .not('subject', 'is', null)

  if (error) {
    console.error('Error fetching subjects:', error)
    return []
  }

  const subjects = [...new Set(data.map(item => item.subject).filter(Boolean))]
  return subjects as string[]
}

export async function getQuestionBankTags(userId: string): Promise<string[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('question_bank')
    .select('tags')
    .eq('created_by', userId)
    .not('tags', 'is', null)

  if (error) {
    console.error('Error fetching tags:', error)
    return []
  }

  const allTags = data.flatMap(item => item.tags || [])
  const uniqueTags = [...new Set(allTags)]
  return uniqueTags
}