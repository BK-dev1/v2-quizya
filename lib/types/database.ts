export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'teacher' | 'student'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'teacher' | 'student'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'teacher' | 'student'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          id: string
          title: string
          description: string | null
          duration_minutes: number
          total_questions: number
          passing_score: number
          is_public: boolean
          is_active: boolean
          room_code: string | null
          proctoring_enabled: boolean
          shuffle_questions: boolean
          show_results_immediately: boolean
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          duration_minutes: number
          total_questions: number
          passing_score: number
          is_public?: boolean
          is_active?: boolean
          room_code?: string | null
          proctoring_enabled?: boolean
          shuffle_questions?: boolean
          show_results_immediately?: boolean
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          duration_minutes?: number
          total_questions?: number
          passing_score?: number
          is_public?: boolean
          is_active?: boolean
          room_code?: string | null
          proctoring_enabled?: boolean
          shuffle_questions?: boolean
          show_results_immediately?: boolean
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      questions: {
        Row: {
          id: string
          exam_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options: Json | null
          correct_answer: string
          points: number
          order_index: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options?: Json | null
          correct_answer: string
          points: number
          order_index: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options?: Json | null
          correct_answer?: string
          points?: number
          order_index?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          }
        ]
      }
      exam_sessions: {
        Row: {
          id: string
          exam_id: string
          student_id: string | null
          guest_name: string | null
          guest_email: string | null
          is_guest: boolean
          started_at: string | null
          submitted_at: string | null
          score: number | null
          total_points: number
          status: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
          answers: Json | null
          proctoring_data: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          exam_id: string
          student_id?: string | null
          guest_name?: string | null
          guest_email?: string | null
          is_guest?: boolean
          started_at?: string | null
          submitted_at?: string | null
          score?: number | null
          total_points: number
          status?: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
          answers?: Json | null
          proctoring_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          exam_id?: string
          student_id?: string | null
          guest_name?: string | null
          guest_email?: string | null
          is_guest?: boolean
          started_at?: string | null
          submitted_at?: string | null
          score?: number | null
          total_points?: number
          status?: 'not_started' | 'in_progress' | 'completed' | 'abandoned'
          answers?: Json | null
          proctoring_data?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      question_bank: {
        Row: {
          id: string
          title: string
          description: string | null
          subject: string | null
          difficulty_level: 'easy' | 'medium' | 'hard'
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options: Json | null
          correct_answer: string
          explanation: string | null
          tags: string[] | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          subject?: string | null
          difficulty_level: 'easy' | 'medium' | 'hard'
          question_text: string
          question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options?: Json | null
          correct_answer: string
          explanation?: string | null
          tags?: string[] | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          subject?: string | null
          difficulty_level?: 'easy' | 'medium' | 'hard'
          question_text?: string
          question_type?: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay'
          options?: Json | null
          correct_answer?: string
          explanation?: string | null
          tags?: string[] | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_bank_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}