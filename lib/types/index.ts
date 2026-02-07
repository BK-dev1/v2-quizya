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
export type UserSettings = Tables<'user_settings'>
export type AttendanceSession = Tables<'attendance_sessions'>
export type AttendanceRecord = Tables<'attendance_records'>

// Insert types
export type ProfileInsert = TablesInsert<'profiles'>
export type ExamInsert = TablesInsert<'exams'>
export type QuestionInsert = TablesInsert<'questions'>
export type ExamSessionInsert = TablesInsert<'exam_sessions'>
export type QuestionBankInsert = TablesInsert<'question_bank'>
export type UserSettingsInsert = TablesInsert<'user_settings'>
export type AttendanceSessionInsert = TablesInsert<'attendance_sessions'>
export type AttendanceRecordInsert = TablesInsert<'attendance_records'>

// Update types
export type ProfileUpdate = TablesUpdate<'profiles'>
export type ExamUpdate = TablesUpdate<'exams'>
export type QuestionUpdate = TablesUpdate<'questions'>
export type ExamSessionUpdate = TablesUpdate<'exam_sessions'>
export type QuestionBankUpdate = TablesUpdate<'question_bank'>
export type UserSettingsUpdate = TablesUpdate<'user_settings'>
export type AttendanceSessionUpdate = TablesUpdate<'attendance_sessions'>
export type AttendanceRecordUpdate = TablesUpdate<'attendance_records'>

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
  answer: string | string[]
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

// Attendance types
export type AttendanceSessionWithRecords = AttendanceSession & {
  records: AttendanceRecord[]
  attendance_count?: number
}

export type AttendanceQRData = {
  sessionId: string
  token: string
  expiresAt: number
  teacherLocation?: {
    lat: number
    lng: number
  }
}
// Live Quiz Types
export type LiveQuizStatus = 'waiting' | 'active' | 'paused' | 'showing_results' | 'ended'
export type QuestionState = 'hidden' | 'active' | 'closed' | 'showing_answer'

export type LiveQuizOption = {
  id: string
  text: string
}

export type LiveQuiz = {
  id: string
  title: string
  description: string | null
  quiz_code: string
  status: LiveQuizStatus
  current_question_index: number
  show_results_to_students: boolean
  created_by: string
  started_at: string | null
  ended_at: string | null
  created_at: string
  updated_at: string
}

export type LiveQuizQuestion = {
  id: string
  quiz_id: string
  question_text: string
  options: LiveQuizOption[]
  correct_options: string[] // Array of option IDs that are correct
  time_limit_seconds: number
  points: number
  order_index: number
  state: QuestionState
  started_at: string | null
  ended_at: string | null
  created_at: string
  updated_at: string
}

export type LiveQuizParticipant = {
  id: string
  quiz_id: string
  participant_name: string
  participant_email: string | null
  user_id: string | null
  display_position: { x: number; y: number } | null
  total_score: number
  total_correct: number
  joined_at: string
  last_seen_at: string
}

export type LiveQuizResponse = {
  id: string
  quiz_id: string
  question_id: string
  participant_id: string
  selected_options: string[]
  is_correct: boolean
  points_earned: number
  answered_at: string
  response_time_ms: number | null
}

export type LiveQuizWithQuestions = LiveQuiz & {
  questions: LiveQuizQuestion[]
}

export type LiveQuizWithParticipants = LiveQuiz & {
  participants: LiveQuizParticipant[]
}

export type LiveQuizFull = LiveQuiz & {
  questions: LiveQuizQuestion[]
  participants: LiveQuizParticipant[]
}

// Insert/Update types
export type LiveQuizInsert = Omit<LiveQuiz, 'id' | 'created_at' | 'updated_at'>
export type LiveQuizUpdate = Partial<LiveQuizInsert>

export type LiveQuizQuestionInsert = Omit<LiveQuizQuestion, 'id' | 'created_at' | 'updated_at'>
export type LiveQuizQuestionUpdate = Partial<LiveQuizQuestionInsert>

export type LiveQuizParticipantInsert = Omit<LiveQuizParticipant, 'id' | 'joined_at' | 'last_seen_at' | 'total_score' | 'total_correct'>
export type LiveQuizParticipantUpdate = Partial<LiveQuizParticipant>

export type LiveQuizResponseInsert = Omit<LiveQuizResponse, 'id' | 'answered_at'>
export type LiveQuizResponseUpdate = Partial<LiveQuizResponse>

// Statistics types for teacher view
export type QuestionStatistics = {
  question_id: string
  total_responses: number
  correct_responses: number
  option_distribution: Record<string, number> // option_id -> count
}

export type ParticipantResult = {
  participant: LiveQuizParticipant
  responses: LiveQuizResponse[]
  total_score: number
  total_correct: number
  rank: number
}