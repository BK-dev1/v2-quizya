import { Database } from './database'

// Type helpers for easier use
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Specific types for each table
export type Profile = Tables<'profiles'>
export type Exam = Tables<'exams'>
export type Question = Tables<'questions'>
export type ExamSession = Tables<'exam_sessions'>
export type QuestionBank = Tables<'question_bank'>

// Insert types
export type ProfileInsert = TablesInsert<'profiles'>
export type ExamInsert = TablesInsert<'exams'>
export type QuestionInsert = TablesInsert<'questions'>
export type ExamSessionInsert = TablesInsert<'exam_sessions'>
export type QuestionBankInsert = TablesInsert<'question_bank'>

// Update types
export type ProfileUpdate = TablesUpdate<'profiles'>
export type ExamUpdate = TablesUpdate<'exams'>
export type QuestionUpdate = TablesUpdate<'questions'>
export type ExamSessionUpdate = TablesUpdate<'exam_sessions'>
export type QuestionBankUpdate = TablesUpdate<'question_bank'>

// Custom types for frontend use
export type ExamWithQuestions = Exam & {
  questions: Question[]
}

export type ExamSessionWithExam = ExamSession & {
  exam: Exam
}

export type ExamWithStats = Exam & {
  total_sessions: number
  average_score: number
  completion_rate: number
}

export type QuestionOption = {
  id: string
  text: string
  isCorrect?: boolean
}

export type StudentAnswer = {
  question_id: string
  answer: string
  is_correct: boolean
  points_earned: number
}

export type ProctoringEvent = {
  type: 'tab_switch' | 'focus_lost' | 'fullscreen_exit' | 'suspicious_activity'
  timestamp: string
  details?: any
}

export type ProctoringData = {
  infractions: ProctoringEvent[]
  fullscreen_exits?: number
  tab_switches?: number
}